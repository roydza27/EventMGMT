import request from 'supertest';
import express, { Request, Response } from 'express';
import assert from 'node:assert';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import prisma from '../../src/config/database.js';
import { passwordService } from '../../src/lib/password.js';
import { jwtService } from '../../src/lib/jwt.js';
import { env } from '../../src/config/env.js';
import { authenticate } from '../../src/middleware/auth.middleware.js';
import { requireRole } from '../../src/middleware/role.middleware.js';
import { errorHandler } from '../../src/middleware/error.middleware.js';

async function runAuthTests() {
  console.log('=== Running Authentication & RBAC Integration Tests ===\n');
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ FAIL: ${name}`);
      console.error('   ', err.message || err);
      failed++;
    }
  }

  const app = createApp();

  // Setup test user fixtures with known passwords
  const testStudentEmail = 'auth-test-student@college.edu';
  const testOrganizerEmail = 'auth-test-organizer@college.edu';
  const testAdminEmail = 'auth-test-admin@college.edu';
  const testPassword = 'Password123!';

  const passwordHash = await passwordService.hashPassword(testPassword);

  // Clean up prior test data if present
  const cleanup = async () => {
    const users = await prisma.user.findMany({
      where: { email: { in: [testStudentEmail, testOrganizerEmail, testAdminEmail] } },
    });
    const userIds = users.map((u) => u.id);
    if (userIds.length > 0) {
      await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
  };

  await cleanup();

  // Create test users
  const studentUser = await prisma.user.create({
    data: {
      name: 'Auth Test Student',
      email: testStudentEmail,
      passwordHash,
      college: 'Test College',
      role: 'STUDENT',
    },
  });

  const organizerUser = await prisma.user.create({
    data: {
      name: 'Auth Test Organizer',
      email: testOrganizerEmail,
      passwordHash,
      college: 'Test College',
      role: 'ORGANIZER',
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      name: 'Auth Test Admin',
      email: testAdminEmail,
      passwordHash,
      college: 'Test College',
      role: 'ADMIN',
    },
  });

  try {
    // ==========================================
    // 1. LOGIN TESTS
    // ==========================================
    let activeRefreshToken = '';
    let activeAccessToken = '';

    await test('POST /api/auth/login succeeds with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testStudentEmail, password: testPassword });

      assert.strictEqual(res.status, 200);
      assert(res.body.user, 'User object must be returned');
      assert.strictEqual(res.body.user.email, testStudentEmail);
      assert.strictEqual(res.body.user.role, 'STUDENT');
      assert.strictEqual(res.body.user.name, 'Auth Test Student');

      // Security check: passwordHash must NEVER be returned
      assert.strictEqual(res.body.user.passwordHash, undefined);
      assert.strictEqual(JSON.stringify(res.body).includes('argon2id'), false);

      // Tokens must be returned
      assert(res.body.accessToken, 'Access token must be present');
      assert(res.body.refreshToken, 'Refresh token must be present');

      activeAccessToken = res.body.accessToken;
      activeRefreshToken = res.body.refreshToken;
    });

    await test('POST /api/auth/login rejects wrong password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testStudentEmail, password: 'WrongPassword999!' });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error?.code, 'INVALID_CREDENTIALS');
      assert.strictEqual(res.body.error?.message, 'Invalid email or password');
    });

    await test('POST /api/auth/login rejects nonexistent email safely with 401 without enumeration', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent-user@college.edu', password: testPassword });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error?.code, 'INVALID_CREDENTIALS');
      assert.strictEqual(res.body.error?.message, 'Invalid email or password');
    });

    await test('POST /api/auth/login rejects malformed payload with 400 validation error', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: '' });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error?.code, 'VALIDATION_ERROR');
      assert(Array.isArray(res.body.error?.details));
    });

    // ==========================================
    // 2. ACCESS TOKEN & GET /api/auth/me TESTS
    // ==========================================
    await test('GET /api/auth/me returns current user profile for valid access token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${activeAccessToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.user.id, studentUser.id);
      assert.strictEqual(res.body.user.email, testStudentEmail);
      assert.strictEqual(res.body.user.role, 'STUDENT');
      assert.strictEqual(res.body.user.passwordHash, undefined);
    });

    await test('GET /api/auth/me fails with 401 when token is missing', async () => {
      const res = await request(app).get('/api/auth/me');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error?.code, 'NO_TOKEN_PROVIDED');
    });

    await test('GET /api/auth/me fails with 401 when Authorization header is malformed', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Basic 12345');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error?.code, 'INVALID_AUTH_HEADER');
    });

    await test('GET /api/auth/me fails with 401 when access token is tampered', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${activeAccessToken}tampered`);
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error?.code, 'INVALID_TOKEN');
    });

    await test('GET /api/auth/me fails with 401 when access token is expired', async () => {
      // Craft an expired access token
      const expiredToken = jwt.sign(
        { userId: studentUser.id, role: 'STUDENT' },
        env.JWT_ACCESS_SECRET,
        { expiresIn: -10 }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error?.code, 'TOKEN_EXPIRED');
    });

    // ==========================================
    // 3. REFRESH TOKEN ROTATION & REPLAY DETECTION
    // ==========================================
    let rotatedRefreshToken = '';
    let rotatedAccessToken = '';

    await test('POST /api/auth/refresh rotates refresh token and returns new tokens', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: activeRefreshToken });

      assert.strictEqual(res.status, 200);
      assert(res.body.accessToken);
      assert(res.body.refreshToken);
      assert.notStrictEqual(res.body.refreshToken, activeRefreshToken, 'Must issue a new rotated token');

      rotatedAccessToken = res.body.accessToken;
      rotatedRefreshToken = res.body.refreshToken;

      // Verify new access token works
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${rotatedAccessToken}`);
      assert.strictEqual(meRes.status, 200);
    });

    await test('Reusing an already rotated refresh token fails with 401 and triggers replay protection', async () => {
      // Present the old activeRefreshToken which was already rotated
      const reuseRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: activeRefreshToken });

      assert.strictEqual(reuseRes.status, 401);
      assert.strictEqual(reuseRes.body.error?.code, 'TOKEN_REVOKED');

      // Replay protection check: The rotated token should NOW also be invalidated because of detected reuse!
      const subsequentRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: rotatedRefreshToken });

      assert.strictEqual(subsequentRes.status, 401);
      assert.strictEqual(subsequentRes.body.error?.code, 'TOKEN_REVOKED');
    });

    await test('POST /api/auth/refresh rejects an expired refresh token', async () => {
      const expiredRefreshToken = jwt.sign(
        { userId: studentUser.id, tokenId: crypto.randomUUID() },
        env.JWT_REFRESH_SECRET,
        { expiresIn: -10 }
      );

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: expiredRefreshToken });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error?.code, 'TOKEN_EXPIRED');
    });

    // ==========================================
    // 4. LOGOUT TESTS
    // ==========================================
    await test('POST /api/auth/logout invalidates session and prevents subsequent refresh', async () => {
      // 1. Log in fresh
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testOrganizerEmail, password: testPassword });
      assert.strictEqual(loginRes.status, 200);

      const logoutToken = loginRes.body.accessToken;
      const logoutRefresh = loginRes.body.refreshToken;

      // 2. Log out
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${logoutToken}`)
        .send({ refreshToken: logoutRefresh });

      assert.strictEqual(logoutRes.status, 204);

      // 3. Attempting to refresh with the logged-out refresh token must fail
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: logoutRefresh });

      assert.strictEqual(refreshRes.status, 401);
      assert.strictEqual(refreshRes.body.error?.code, 'TOKEN_REVOKED');
    });

    // ==========================================
    // 5. ROLE-BASED ACCESS CONTROL (RBAC) TESTS
    // ==========================================
    // Test app with a protected endpoint requiring ORGANIZER or ADMIN
    const rbacApp = express();
    rbacApp.use(express.json());
    rbacApp.get(
      '/test-organizer-admin-only',
      authenticate,
      requireRole('ORGANIZER', 'ADMIN'),
      (req: Request, res: Response) => {
        res.status(200).json({ authorized: true, user: req.user });
      }
    );
    rbacApp.use(errorHandler);

    await test('RBAC allows ORGANIZER to access organizer-protected resource', async () => {
      const token = jwtService.signAccessToken({ userId: organizerUser.id, role: 'ORGANIZER' });
      const res = await request(rbacApp)
        .get('/test-organizer-admin-only')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.authorized, true);
      assert.strictEqual(res.body.user.role, 'ORGANIZER');
    });

    await test('RBAC allows ADMIN to access admin-protected resource', async () => {
      const token = jwtService.signAccessToken({ userId: adminUser.id, role: 'ADMIN' });
      const res = await request(rbacApp)
        .get('/test-organizer-admin-only')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.authorized, true);
      assert.strictEqual(res.body.user.role, 'ADMIN');
    });

    await test('RBAC blocks STUDENT from accessing organizer/admin resource with 403 FORBIDDEN', async () => {
      const token = jwtService.signAccessToken({ userId: studentUser.id, role: 'STUDENT' });
      const res = await request(rbacApp)
        .get('/test-organizer-admin-only')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error?.code, 'FORBIDDEN');
    });

    await test('RBAC blocks unauthenticated requests with 401', async () => {
      const res = await request(rbacApp).get('/test-organizer-admin-only');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error?.code, 'NO_TOKEN_PROVIDED');
    });
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runAuthTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
