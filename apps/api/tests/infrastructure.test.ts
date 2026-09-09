import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import assert from 'node:assert';
import { z } from 'zod';
import { createApp } from '../src/app.js';
import { AppError, errorHandler } from '../src/middleware/error.middleware.js';
import { validateRequest } from '../src/middleware/validation.middleware.js';
import { jwtService } from '../src/lib/jwt.js';
import { passwordService } from '../src/lib/password.js';
import { authenticate } from '../src/middleware/auth.middleware.js';
import { requireRole } from '../src/middleware/role.middleware.js';

async function runInfrastructureTests() {
  console.log('=== Running Backend Foundation Infrastructure Tests ===\n');
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

  // 1. Health Endpoint Test
  await test('GET /health returns 200 and ok status', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
    assert(typeof res.body.uptime === 'number');
    assert(res.body.timestamp);
  });

  // 2. 404 Unknown Route Test
  await test('GET /unknown-route returns 404 with standard JSON error shape', async () => {
    const res = await request(app).get('/unknown-endpoint-test');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.error?.code, 'NOT_FOUND');
    assert(res.body.error?.message.includes('not found'));
  });

  // 3. Central Error Handling Test
  await test('Controlled AppError returns custom status and error code', async () => {
    const testApp = express();
    testApp.get('/test-error', (req: Request, res: Response, next: NextFunction) => {
      next(new AppError('Custom domain failure', 409, 'CUSTOM_CONFLICT', { item: 'sample' }));
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get('/test-error');
    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.error?.code, 'CUSTOM_CONFLICT');
    assert.strictEqual(res.body.error?.message, 'Custom domain failure');
    assert.deepStrictEqual(res.body.error?.details, { item: 'sample' });
  });

  // 4. Request Validation Middleware Test
  await test('Validation middleware rejects invalid body with 400 and details', async () => {
    const testApp = express();
    testApp.use(express.json());
    const schema = z.object({
      email: z.string().email('Must be a valid email'),
      age: z.number().int().min(18),
    });

    testApp.post('/test-validation', validateRequest(schema), (req: Request, res: Response) => {
      res.status(200).json({ success: true, data: req.body });
    });
    testApp.use(errorHandler);

    // Invalid request: bad email and underage
    const badRes = await request(testApp)
      .post('/test-validation')
      .send({ email: 'not-an-email', age: 15 });

    assert.strictEqual(badRes.status, 400);
    assert.strictEqual(badRes.body.error?.code, 'VALIDATION_ERROR');
    assert(Array.isArray(badRes.body.error?.details));
    assert.strictEqual(badRes.body.error.details.length, 2);

    // Valid request
    const goodRes = await request(testApp)
      .post('/test-validation')
      .send({ email: 'valid@college.edu', age: 20 });
    assert.strictEqual(goodRes.status, 200);
    assert.strictEqual(goodRes.body.success, true);
  });

  // 5. Password Utility Test
  await test('Password utility hashes with argon2id and verifies correctly', async () => {
    const plainPassword = 'SecretPassword123!';
    const hash = await passwordService.hashPassword(plainPassword);
    assert(hash.startsWith('$argon2id$'), 'Must use argon2id');

    const isValid = await passwordService.verifyPassword(plainPassword, hash);
    assert.strictEqual(isValid, true, 'Valid password must verify');

    const isInvalid = await passwordService.verifyPassword('WrongPassword', hash);
    assert.strictEqual(isInvalid, false, 'Wrong password must be rejected');
  });

  // 6. JWT Utility Test
  await test('JWT service signs and verifies access and refresh tokens', async () => {
    const accessPayload = { userId: '123e4567-e89b-12d3-a456-426614174000', role: 'STUDENT' };
    const accessToken = jwtService.signAccessToken(accessPayload);
    const verifiedAccess = jwtService.verifyAccessToken(accessToken);
    assert.strictEqual(verifiedAccess.userId, accessPayload.userId);
    assert.strictEqual(verifiedAccess.role, accessPayload.role);

    const refreshPayload = { userId: '123e4567-e89b-12d3-a456-426614174000', tokenId: 'token-uuid' };
    const refreshToken = jwtService.signRefreshToken(refreshPayload);
    const verifiedRefresh = jwtService.verifyRefreshToken(refreshToken);
    assert.strictEqual(verifiedRefresh.userId, refreshPayload.userId);
    assert.strictEqual(verifiedRefresh.tokenId, refreshPayload.tokenId);

    // Tampered token must fail
    assert.throws(() => {
      jwtService.verifyAccessToken(accessToken + 'tampered');
    });
  });

  // 7. Authentication Middleware Test
  await test('Authentication middleware extracts token and attaches user context', async () => {
    const testApp = express();
    testApp.get('/test-auth', authenticate, (req: Request, res: Response) => {
      res.status(200).json({ user: req.user });
    });
    testApp.use(errorHandler);

    // Missing header
    const noHeaderRes = await request(testApp).get('/test-auth');
    assert.strictEqual(noHeaderRes.status, 401);
    assert.strictEqual(noHeaderRes.body.error?.code, 'NO_TOKEN_PROVIDED');

    // Valid token
    const token = jwtService.signAccessToken({ userId: 'u-1', role: 'ORGANIZER' });
    const authRes = await request(testApp)
      .get('/test-auth')
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(authRes.status, 200);
    assert.strictEqual(authRes.body.user?.userId, 'u-1');
    assert.strictEqual(authRes.body.user?.role, 'ORGANIZER');
  });

  // 8. Role Middleware Test
  await test('Role middleware enforces role requirement', async () => {
    const testApp = express();
    testApp.get(
      '/test-admin-only',
      authenticate,
      requireRole('ADMIN'),
      (req: Request, res: Response) => {
        res.status(200).json({ authorized: true });
      }
    );
    testApp.use(errorHandler);

    const studentToken = jwtService.signAccessToken({ userId: 's-1', role: 'STUDENT' });
    const studentRes = await request(testApp)
      .get('/test-admin-only')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(studentRes.status, 403);
    assert.strictEqual(studentRes.body.error?.code, 'FORBIDDEN');

    const adminToken = jwtService.signAccessToken({ userId: 'a-1', role: 'ADMIN' });
    const adminRes = await request(testApp)
      .get('/test-admin-only')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(adminRes.status, 200);
    assert.strictEqual(adminRes.body.authorized, true);
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runInfrastructureTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
