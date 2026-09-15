'use client';

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Event } from "@/types/api";
import { apiClient } from "@/lib/api";
import { EventCard } from "@/components/events/event-card";
import { Input } from "@/components/ui/input";
import { Compass, Search, Filter, Calendar, Sparkles, X, RefreshCw } from "lucide-react";

function EventsCatalog() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams?.get("category") || "ALL";

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const categories = ["ALL", "Hackathon", "Workshop", "Seminar", "Cultural", "Sports"];

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.events.list({
        search: searchTerm.trim() || undefined,
        category: selectedCategory !== "ALL" ? selectedCategory : undefined,
        from: fromDate ? new Date(fromDate).toISOString() : undefined,
        to: toDate ? new Date(toDate).toISOString() : undefined,
      });
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [selectedCategory, fromDate, toDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadEvents();
  };

  const handleReset = () => {
    setSearchTerm("");
    setSelectedCategory("ALL");
    setFromDate("");
    setToDate("");
    loadEvents();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft text-accent border border-accent/20 text-xs font-mono uppercase tracking-widest">
          <Compass className="w-3.5 h-3.5" />
          <span>Intercollegiate Catalog</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl text-foreground font-normal tracking-tight">
          Campus Event Discovery
        </h1>
        <p className="text-sm sm:text-base text-muted max-w-2xl">
          Browse verified academic symposia, athletic tournaments, and student challenges across Apex Campus and partner colleges.
        </p>
      </div>

      {/* Filter Controls Card */}
      <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 space-y-6 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-medium text-foreground tracking-wide">
              Search by Title, Description, or Venue
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. Hackathon, Auditorium, Robotics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface pl-10 pr-3.5 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-xs font-medium text-foreground tracking-wide">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "ALL" ? "All Categories" : c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-medium text-foreground tracking-wide">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 h-10 rounded-lg bg-accent text-white text-xs font-semibold uppercase tracking-wider hover:bg-accent-hover transition-colors"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={handleReset}
              title="Reset Filters"
              className="p-2.5 h-10 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-muted hover:text-foreground transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <span className="text-xs font-mono uppercase tracking-widest text-muted">
          Showing {events.length} Published {events.length === 1 ? "Event" : "Events"}
        </span>
      </div>

      {/* Event Grid */}
      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <div className="inline-block animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
          <p className="text-xs font-mono text-muted uppercase tracking-widest">Searching catalog...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-16 text-center space-y-4">
          <Compass className="w-10 h-10 text-muted/40 mx-auto" />
          <h3 className="font-serif text-2xl text-foreground font-normal">No Matching Events Found</h3>
          <p className="text-xs sm:text-sm text-muted max-w-md mx-auto">
            We couldn't find any scheduled events matching your current filter criteria. Try adjusting your search keywords or clearing dates.
          </p>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => (
            <EventCard key={evt.id} event={evt} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-muted">Loading events...</div>}>
      <EventsCatalog />
    </Suspense>
  );
}
