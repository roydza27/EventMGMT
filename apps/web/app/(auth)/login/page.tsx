'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { School, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push(redirect);
    }
  }, [authLoading, isAuthenticated, redirect, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoRole: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-12 bg-subtle-grid">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent-soft border border-accent/30 text-accent shadow-sm">
            <School className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground font-normal tracking-tight">
            Sign In to AIMIT
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-sm mx-auto">
            Access event discovery, registrations, and campus management tools.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-surface-dark space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-danger-soft border border-danger/30 text-danger text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Failed</p>
                <p className="mt-0.5 opacity-90">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              type="email"
              label="College Email"
              placeholder="e.g. alice@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />

            <div className="space-y-1">
              <Input
                id="password"
                type="password"
                label="Password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              Sign In
            </Button>
          </form>

          {/* Quick Fill for Testing */}
          <div className="pt-4 border-t border-border/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-muted uppercase tracking-wider">
                Demo Accounts
              </span>
              <span className="text-[10px] text-muted flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-accent" /> One-click fill
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-left">
              <button
                type="button"
                onClick={() => handleQuickFill('alice@college.edu', 'STUDENT')}
                className="p-2 rounded-xl border border-border bg-surface-elevated hover:border-accent/40 text-left transition-colors"
              >
                <span className="block text-[11px] font-semibold text-foreground truncate">Student</span>
                <span className="block text-[9px] text-muted font-mono truncate">alice@college.edu</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('organizer1@college.edu', 'ORGANIZER')}
                className="p-2 rounded-xl border border-border bg-surface-elevated hover:border-accent/40 text-left transition-colors"
              >
                <span className="block text-[11px] font-semibold text-foreground truncate">Organizer</span>
                <span className="block text-[9px] text-muted font-mono truncate">organizer1@college.edu</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin@college.edu', 'ADMIN')}
                className="p-2 rounded-xl border border-border bg-surface-elevated hover:border-accent/40 text-left transition-colors"
              >
                <span className="block text-[11px] font-semibold text-foreground truncate">Admin</span>
                <span className="block text-[9px] text-muted font-mono truncate">admin@college.edu</span>
              </button>
            </div>
          </div>

          <div className="pt-2 text-center text-xs text-muted">
            <span>Don't have an account yet? </span>
            <Link href="/register" className="font-semibold text-accent hover:underline">
              Create student pass
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
          >
            <span>Continue as guest to browse events</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-72px)] flex items-center justify-center p-12 text-center text-xs text-muted">Loading authentication portal...</div>}>
      <LoginForm />
    </Suspense>
  );
}
