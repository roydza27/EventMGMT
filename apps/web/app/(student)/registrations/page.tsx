'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Registration } from '@/types/api';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  Filter,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function RegistrationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'CANCELLED'>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.registrations.getMyRegistrations();
      setRegistrations(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch registrations.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/registrations');
      } else {
        fetchRegistrations();
      }
    }
  }, [authLoading, isAuthenticated, router, fetchRegistrations]);

  const handleCancelRegistration = async (registrationId: string, eventTitle?: string) => {
    if (!confirm(`Are you sure you want to withdraw your pass for "${eventTitle || 'this event'}"?`)) {
      return;
    }

    setCancellingId(registrationId);
    setError(null);
    setSuccessMsg(null);

    try {
      await apiClient.registrations.cancel(registrationId);
      setSuccessMsg('Registration successfully withdrawn.');
      setRegistrations((prev) =>
        prev.map((reg) =>
          reg.id === registrationId ? { ...reg, status: 'CANCELLED' } : reg
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to cancel registration.');
    } finally {
      setCancellingId(null);
    }
  };

  const filteredRegistrations = registrations.filter((reg) => {
    if (filter === 'ACTIVE') return reg.status === 'ACTIVE';
    if (filter === 'CANCELLED') return reg.status === 'CANCELLED';
    return true;
  });

  const activeCount = registrations.filter((r) => r.status === 'ACTIVE').length;
  const cancelledCount = registrations.filter((r) => r.status === 'CANCELLED').length;

  if (authLoading || (isLoading && registrations.length === 0)) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
        <p className="text-xs font-mono text-muted uppercase tracking-widest">
          Loading registrations...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 bg-subtle-grid">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft text-accent border border-accent/20 text-xs font-mono uppercase tracking-widest">
              <Ticket className="w-3.5 h-3.5" />
              <span>Student Passes</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-foreground tracking-tight">
              My Registrations
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              Manage your confirmed passes, event schedules, and digital admission records.
            </p>
          </div>

          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-medium text-xs uppercase tracking-wider hover:bg-accent-hover transition-colors shadow-glow-sm shrink-0 self-start md:self-end"
          >
            <span>Discover Events</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-border bg-surface shadow-sm">
            <span className="text-[11px] font-mono text-muted uppercase tracking-wider block">
              Total Passes Issued
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-serif text-3xl font-medium text-foreground">
                {registrations.length}
              </span>
              <span className="text-xs text-muted">All-time</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-surface shadow-sm">
            <span className="text-[11px] font-mono text-muted uppercase tracking-wider block">
              Active Passes
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-serif text-3xl font-medium text-success">
                {activeCount}
              </span>
              <span className="text-xs text-success bg-success-soft px-2 py-0.5 rounded">
                Confirmed
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-surface shadow-sm">
            <span className="text-[11px] font-mono text-muted uppercase tracking-wider block">
              Withdrawn Passes
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-serif text-3xl font-medium text-muted">
                {cancelledCount}
              </span>
              <span className="text-xs text-muted">History retained</span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-xl bg-danger-soft border border-danger/30 text-danger text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Action Failed</p>
              <p className="text-xs opacity-90">{error}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-success-soft border border-success/30 text-success text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Updated</p>
              <p className="text-xs opacity-90">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <span className="text-xs text-muted mr-2 flex items-center gap-1 font-mono uppercase">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>

          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'ALL'
                ? 'bg-accent-soft text-accent font-semibold border border-accent/30'
                : 'text-muted hover:text-foreground hover:bg-surface'
            }`}
          >
            All Passes ({registrations.length})
          </button>

          <button
            onClick={() => setFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'ACTIVE'
                ? 'bg-success-soft text-success font-semibold border border-success/30'
                : 'text-muted hover:text-foreground hover:bg-surface'
            }`}
          >
            Active ({activeCount})
          </button>

          <button
            onClick={() => setFilter('CANCELLED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'CANCELLED'
                ? 'bg-surface-sunken text-muted font-semibold border border-border'
                : 'text-muted hover:text-foreground hover:bg-surface'
            }`}
          >
            Withdrawn ({cancelledCount})
          </button>
        </div>

        {/* Registrations List */}
        {filteredRegistrations.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-border p-12 text-center space-y-4 bg-surface/50">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-surface-elevated text-muted">
              <Ticket className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl sm:text-2xl text-foreground font-normal">
              {filter === 'ALL'
                ? 'No Event Registrations Yet'
                : filter === 'ACTIVE'
                ? 'No Active Registrations Found'
                : 'No Cancelled Registrations'}
            </h3>
            <p className="text-xs sm:text-sm text-muted max-w-md mx-auto">
              Discover workshops, hackathons, guest lectures, and competitions published across colleges.
            </p>
            <div className="pt-2">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-medium text-xs uppercase tracking-wider hover:bg-accent-hover transition-colors shadow-glow-sm"
              >
                <span>Browse Published Events</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRegistrations.map((reg) => {
              const event = reg.event;
              const registeredDate = new Date(reg.registeredAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              const startTime = event?.startTime ? new Date(event.startTime) : null;
              const eventDateStr = startTime
                ? startTime.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'TBD';
              const eventTimeStr = startTime
                ? startTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : '';

              const isActive = reg.status === 'ACTIVE';

              return (
                <div
                  key={reg.id}
                  className={`rounded-2xl border p-5 sm:p-6 bg-surface transition-all duration-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                    isActive
                      ? 'border-border hover:border-border-strong border-l-4 border-l-success'
                      : 'border-border/60 opacity-80 border-l-4 border-l-muted'
                  }`}
                >
                  <div className="space-y-3 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-3">
                      {event?.category && (
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-surface-elevated text-muted border border-border">
                          {event.category}
                        </span>
                      )}

                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-success-soft text-success border border-success/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active Pass</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-sunken text-muted border border-border">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Withdrawn</span>
                        </span>
                      )}

                      <span className="text-[11px] text-muted font-mono">
                        Booked on {registeredDate}
                      </span>
                    </div>

                    <Link
                      href={`/events/${reg.eventId}`}
                      className="block group"
                    >
                      <h3 className="font-serif text-xl sm:text-2xl text-foreground font-normal tracking-tight group-hover:text-accent transition-colors">
                        {event?.title || `Event #${reg.eventId.slice(0, 8)}`}
                      </h3>
                    </Link>

                    <div className="flex flex-wrap items-center gap-5 text-xs text-muted">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-accent" />
                        <span>{eventDateStr} • {eventTimeStr}</span>
                      </div>

                      {event?.venue && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-accent" />
                          <span>{event.venue}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                    <Link
                      href={`/events/${reg.eventId}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border hover:bg-surface-elevated text-xs font-semibold uppercase tracking-wider text-foreground transition-colors"
                    >
                      <span>Event Details</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>

                    {isActive && (
                      <button
                        onClick={() => handleCancelRegistration(reg.id, event?.title)}
                        disabled={cancellingId === reg.id}
                        className="px-3.5 py-2 rounded-xl text-xs font-medium text-danger hover:bg-danger-soft border border-transparent hover:border-danger/30 transition-colors disabled:opacity-50"
                      >
                        {cancellingId === reg.id ? 'Withdrawing...' : 'Withdraw Pass'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
