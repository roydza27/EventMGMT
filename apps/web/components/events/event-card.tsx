'use client';

import React from 'react';
import Link from 'next/link';
import { Event } from '@/types/api';
import { StatusBadge } from '@/components/ui/status-badge';
import { Calendar, MapPin, Users, ArrowUpRight, Trophy } from 'lucide-react';

interface EventCardProps {
  event: Event;
  featured?: boolean;
}

export function EventCard({ event, featured = false }: EventCardProps) {
  const startDate = new Date(event.startTime);
  const dayName = startDate.toLocaleDateString('en-US', { weekday: 'short' });
  const monthName = startDate.toLocaleDateString('en-US', { month: 'short' });
  const dayNum = startDate.getDate();
  const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  if (featured) {
    return (
      <div className="relative group overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-8 hover:border-accent/50 transition-all duration-300 shadow-surface-dark">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6 md:items-start">
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 rounded bg-accent-soft text-accent border border-accent/25">
                Featured • {event.category}
              </span>
              <StatusBadge status={event.status} availability={event.availability} />
              {event.prize && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-warning bg-warning-soft px-2.5 py-1 rounded border border-warning/20">
                  <Trophy className="w-3 h-3" />
                  {event.prize}
                </span>
              )}
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl text-foreground font-normal tracking-tight group-hover:text-accent transition-colors">
              {event.title}
            </h2>

            <p className="text-sm sm:text-base text-muted line-clamp-3 font-normal leading-relaxed">
              {event.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs sm:text-sm text-muted">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                <span>{dayName}, {monthName} {dayNum} • {timeStr}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent" />
                <span>{event.venue}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                <span>
                  {event.activeRegistrationCount ?? 0} {event.capacity ? `/ ${event.capacity}` : ''} registered
                </span>
              </div>
            </div>
          </div>

          <div className="flex md:flex-col items-center md:items-end justify-between gap-4 shrink-0">
            <div className="text-center md:text-right border-l-2 md:border-l-0 md:border-r-2 border-accent pl-3 md:pl-0 md:pr-3">
              <span className="block text-2xl sm:text-3xl font-serif text-foreground leading-none">{dayNum}</span>
              <span className="text-xs uppercase tracking-widest text-muted font-mono">{monthName}</span>
            </div>

            <Link
              href={`/events/${event.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-medium text-xs uppercase tracking-wider hover:bg-accent-hover transition-colors shadow-glow-sm"
            >
              <span>Explore Event</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-border bg-surface p-5 sm:p-6 hover:border-border-strong hover:shadow-surface-dark transition-all duration-200 border-l-4 border-l-accent">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted">
            {event.category}
          </span>
          <StatusBadge status={event.status} availability={event.availability} />
        </div>

        <Link href={`/events/${event.id}`} className="block group">
          <h3 className="font-serif text-xl sm:text-2xl text-foreground font-normal tracking-tight group-hover:text-accent transition-colors line-clamp-2">
            {event.title}
          </h3>
        </Link>

        <p className="text-xs text-muted line-clamp-2 leading-relaxed">
          {event.description}
        </p>
      </div>

      <div className="pt-5 mt-4 border-t border-border/60 space-y-3">
        <div className="space-y-1.5 text-xs text-muted">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-accent/80 shrink-0" />
            <span className="truncate">{monthName} {dayNum} • {timeStr}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-accent/80 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] font-mono text-muted">
            {event.capacity ? `${event.activeRegistrationCount ?? 0}/${event.capacity} registered` : 'Open enrollment'}
          </span>
          <Link
            href={`/events/${event.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover group-hover:translate-x-0.5 transition-transform"
          >
            <span>Details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
