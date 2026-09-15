'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Event } from "@/types/api";
import { apiClient } from "@/lib/api";
import { EventCard } from "@/components/events/event-card";
import { Compass, Sparkles, ArrowRight, ShieldCheck, Ticket, Users, Trophy } from "lucide-react";
import "./globals.css"

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHighlights() {
      try {
        const data = await apiClient.events.list();
        setEvents(data.slice(0, 4));
      } catch {
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadHighlights();
  }, []);

  const featured = events.length > 0 ? events[0] : null;
  const recent = events.length > 1 ? events.slice(1) : [];

  return (
    <div className="space-y-16 sm:space-y-24 pb-24">
      {/* HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-8 sm:p-16 lg:p-20 shadow-surface-dark">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[90px] -ml-20 -mb-20 pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-soft text-accent border border-accent/30 text-xs font-mono uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Event Forum 2026</span>
            </div>

            <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-normal text-foreground tracking-tight leading-[1.02]">
              The Intellectual & Creative Pulse of Apex Campus.
            </h1>

            <p className="text-base sm:text-lg text-muted font-normal leading-relaxed max-w-2xl">
              Discover engineering hackathons, design workshops, intercollegiate athletic meets, and arts summits across Apex Institute and partner universities.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                href="/events"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-accent text-white font-semibold text-xs uppercase tracking-wider hover:bg-accent-hover transition-all shadow-glow active:scale-[0.98]"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Events</span>
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-surface-elevated hover:bg-surface border border-border text-foreground font-medium text-xs tracking-wider transition-colors"
              >
                <span>Sign In / Student Portal</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CURATED HIGHLIGHTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-accent block">
              Curated Program
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground font-normal tracking-tight">
              Featured Campus Gatherings
            </h2>
          </div>

          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover group"
          >
            <span>View All Events</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs font-mono text-muted uppercase tracking-widest">
            Loading Catalog...
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted">
            No events are currently scheduled. Check back soon.
          </div>
        ) : (
          <div className="space-y-8">
            {featured && <EventCard event={featured} featured={true} />}

            {recent.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recent.map((evt) => (
                  <EventCard key={evt.id} event={evt} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  );
}
