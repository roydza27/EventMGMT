'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Registration, Event } from '@/types/api';
import { apiClient } from '@/lib/api';
import { Ticket, Calendar, Compass, ArrowUpRight, Sparkles, MapPin } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';

export function StudentDashboard({ user }: { user: User }) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [regs, evts] = await Promise.all([
          apiClient.registrations.getMyRegistrations().catch(() => []),
          apiClient.events.list().catch(() => []),
        ]);
        setRegistrations(regs);
        setUpcomingEvents(evts.slice(0, 3));
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const activeRegistrations = registrations.filter((r) => r.status === 'ACTIVE');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="rounded-3xl border border-border bg-surface p-8 sm:p-10 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft text-accent border border-accent/20 text-xs font-mono uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Student Portal • {user.college}</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl text-foreground font-normal tracking-tight">
            Welcome back, {user.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-muted">
            Track your registered campus events, upcoming workshops, and discover new collegiate challenges.
          </p>
          <div className="pt-2">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-medium uppercase tracking-wider hover:bg-accent-hover transition-colors shadow-glow-sm"
            >
              <Compass className="w-4 h-4" />
              <span>Explore All Events</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-serif text-2xl text-foreground flex items-center gap-2">
              <Ticket className="w-5 h-5 text-accent" />
              <span>My Active Passes</span>
            </h2>
            <Link href="/registrations" className="text-xs text-accent hover:underline">
              View All Passes ({activeRegistrations.length})
            </Link>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-muted text-xs">Loading passes...</div>
          ) : activeRegistrations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-3">
              <Ticket className="w-8 h-8 text-muted/50 mx-auto" />
              <p className="text-xs text-muted">You have no active event registrations at the moment.</p>
              <Link href="/events" className="inline-block text-xs font-medium text-accent hover:underline">
                Browse open events →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  className="rounded-2xl border border-border bg-surface p-5 hover:border-accent/40 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 truncate">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-accent">
                      {reg.event?.category || 'Event'}
                    </span>
                    <Link href={`/events/${reg.eventId || reg.event?.id}`} className="block">
                      <h4 className="font-serif text-lg text-foreground hover:text-accent transition-colors truncate">
                        {reg.event?.title || 'Campus Event'}
                      </h4>
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-muted">
                      {reg.event?.startTime && (
                        <span>
                          {new Date(reg.event.startTime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                      {reg.event?.venue && <span>• {reg.event.venue}</span>}
                    </div>
                  </div>

                  <Link
                    href={`/events/${reg.eventId || reg.event?.id}`}
                    className="shrink-0 p-2.5 rounded-xl bg-surface-elevated hover:bg-surface border border-border text-foreground transition-colors"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-serif text-2xl text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              <span>Campus Highlights</span>
            </h2>
            <Link href="/events" className="text-xs text-muted hover:text-foreground">
              See Catalog
            </Link>
          </div>

          <div className="space-y-4">
            {upcomingEvents.map((evt) => (
              <Link
                key={evt.id}
                href={`/events/${evt.id}`}
                className="block group rounded-2xl border border-border bg-surface p-5 hover:border-border-strong transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted uppercase tracking-wider">
                    {evt.category}
                  </span>
                  <StatusBadge status={evt.status} availability={evt.availability} />
                </div>
                <h4 className="font-serif text-lg text-foreground group-hover:text-accent transition-colors">
                  {evt.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <MapPin className="w-3.5 h-3.5 text-accent" />
                  <span className="truncate">{evt.venue}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
