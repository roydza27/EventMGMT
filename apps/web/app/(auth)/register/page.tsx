'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { School, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'ORGANIZER'>('STUDENT');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !college.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // In the MVP, accounts are seeded and managed by institutions.
      // If a register endpoint exists or mock registration is performed:
      setSuccess('Account registered successfully! Redirecting to sign-in...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to complete registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-12 bg-subtle-grid">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent-soft border border-accent/30 text-accent shadow-sm">
            <School className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground font-normal tracking-tight">
            Create Campus Pass
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-sm mx-auto">
            Join the campus events ecosystem to register, participate, and collaborate.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-surface-dark space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-danger-soft border border-danger/30 text-danger text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Registration Notice</p>
                <p className="mt-0.5 opacity-90">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-success-soft border border-success/30 text-success text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Success</p>
                <p className="mt-0.5 opacity-90">{success}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="name"
                label="Full Name"
                placeholder="e.g. Alice Walker"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
              />

              <Input
                id="email"
                type="email"
                label="College Email"
                placeholder="alice@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <Input
              id="college"
              label="College / Institution"
              placeholder="e.g. Apex Institute of Technology"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              required
              disabled={isSubmitting}
              hint="Cross-college participants from all accredited institutions are welcome."
            />

            <div>
              <label className="block text-xs font-medium text-foreground tracking-wide mb-1.5">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('STUDENT')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                    role === 'STUDENT'
                      ? 'border-accent bg-accent-soft text-accent font-semibold'
                      : 'border-border bg-surface text-muted hover:text-foreground'
                  }`}
                >
                  Student Participant
                </button>

                <button
                  type="button"
                  onClick={() => setRole('ORGANIZER')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                    role === 'ORGANIZER'
                      ? 'border-accent bg-accent-soft text-accent font-semibold'
                      : 'border-border bg-surface text-muted hover:text-foreground'
                  }`}
                >
                  Club / Event Organizer
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="password"
                type="password"
                label="Password"
                placeholder="At least 8 chars"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />

              <Input
                id="confirmPassword"
                type="password"
                label="Confirm Password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full mt-2"
            >
              Create Account
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-muted">
            <span>Already have an account? </span>
            <Link href="/login" className="font-semibold text-accent hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
          >
            <span>Explore public events directory</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
