'use client';

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { apiClient, ApiRequestError } from "@/lib/api";
import { Event } from "@/types/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle, Sparkles } from "lucide-react";

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Hackathon");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [venue, setVenue] = useState("");
  const [capacity, setCapacity] = useState<string>("");
  const [eligibility, setEligibility] = useState("");
  const [prize, setPrize] = useState("");

  const toLocalISO = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (!id) return;
    async function loadEvent() {
      setIsLoading(true);
      try {
        const evt = await apiClient.events.getById(id);
        setTitle(evt.title);
        setDescription(evt.description);
        setCategory(evt.category);
        setStartTime(toLocalISO(evt.startTime));
        setEndTime(toLocalISO(evt.endTime));
        setRegistrationDeadline(toLocalISO(evt.registrationDeadline));
        setVenue(evt.venue);
        setCapacity(evt.capacity ? String(evt.capacity) : "");
        setEligibility(evt.eligibility);
        setPrize(evt.prize || "");
      } catch (err: any) {
        setError(err.message || "Failed to fetch event data for editing.");
      } finally {
        setIsLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const start = new Date(startTime);
    const end = new Date(endTime);
    const deadline = new Date(registrationDeadline);

    if (start >= end) {
      setError("Start time must be strictly before end time.");
      return;
    }

    if (deadline >= start) {
      setError("Registration deadline must be strictly before the event start time.");
      return;
    }

    if (capacity && Number(capacity) <= 0) {
      setError("Capacity must be greater than zero if specified.");
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.events.update(id, {
        title: title.trim(),
        description: description.trim(),
        category,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        registrationDeadline: deadline.toISOString(),
        venue: venue.trim(),
        capacity: capacity ? parseInt(capacity, 10) : null,
        eligibility: eligibility.trim(),
        prize: prize.trim() || null,
      });

      router.push("/dashboard");
    } catch (err: any) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError("Failed to update event. Please check inputs.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || isLoading) {
    return <div className="p-12 text-center text-xs text-muted">Loading event details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Return to Dashboard</span>
        </Link>
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft text-accent border border-accent/20 text-xs font-mono uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Edit Event Program</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-foreground font-normal tracking-tight">
          Update Event Details
        </h1>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger-soft border border-danger/30 text-danger text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-surface p-6 sm:p-10 space-y-8 shadow-sm">
        <div className="space-y-4">
          <h3 className="font-serif text-xl text-foreground pb-2 border-b border-border">
            1. Event Identity & Category
          </h3>

          <Input
            label="Event Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground tracking-wide">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="Hackathon">Hackathon</option>
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
              </select>
            </div>

            <Input
              label="Venue / Location"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground tracking-wide">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-serif text-xl text-foreground pb-2 border-b border-border">
            2. Schedule & Deadlines
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date & Time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />

            <Input
              label="End Date & Time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          <Input
            label="Registration Deadline"
            type="datetime-local"
            value={registrationDeadline}
            onChange={(e) => setRegistrationDeadline(e.target.value)}
            required
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-serif text-xl text-foreground pb-2 border-b border-border">
            3. Capacity & Participation Scope
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Capacity Limit (Optional)"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />

            <Input
              label="Prize / Reward (Optional)"
              value={prize}
              onChange={(e) => setPrize(e.target.value)}
            />
          </div>

          <Input
            label="Eligibility Criteria"
            value={eligibility}
            onChange={(e) => setEligibility(e.target.value)}
            required
          />
        </div>

        <div className="pt-6 border-t border-border flex items-center justify-end gap-3">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-lg border border-border bg-surface-elevated hover:bg-surface text-xs font-semibold uppercase tracking-wider text-muted hover:text-foreground transition-colors"
          >
            Cancel
          </Link>
          <Button type="submit" isLoading={isSubmitting} size="lg">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
