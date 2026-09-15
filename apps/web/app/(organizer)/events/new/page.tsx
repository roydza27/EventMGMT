'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { apiClient, ApiRequestError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, AlertCircle, Calendar, MapPin, Users, Award, ShieldAlert } from "lucide-react";

export default function CreateEventPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Hackathon");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [venue, setVenue] = useState("");
  const [capacity, setCapacity] = useState<string>("");
  const [eligibility, setEligibility] = useState("Open to all registered undergraduate students");
  const [prize, setPrize] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Front-end temporal invariants validation
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
      await apiClient.events.create({
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
        setError("Failed to create event. Please verify all inputs.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return <div className="p-12 text-center text-xs text-muted">Checking permissions...</div>;
  }

  if (!isAuthenticated || (user?.role !== "ORGANIZER" && user?.role !== "ADMIN")) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="font-serif text-2xl text-foreground">Access Restricted</h2>
        <p className="text-xs text-muted">Only campus organizers or administrators can author event drafts.</p>
        <Link href="/login" className="inline-block text-xs font-semibold text-accent hover:underline">
          Switch to an Organizer Account →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Return to Dashboard</span>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft text-accent border border-accent/20 text-xs font-mono uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Event Submission</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-foreground font-normal tracking-tight">
          Author Event Program
        </h1>
        <p className="text-xs sm:text-sm text-muted">
          Events are initially drafted in private mode. You can publish whenever ready from your management dashboard.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger-soft border border-danger/30 text-danger text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-surface p-6 sm:p-10 space-y-8 shadow-sm">
        
        {/* Section 1: Event Identity */}
        <div className="space-y-4">
          <h3 className="font-serif text-xl text-foreground pb-2 border-b border-border">
            1. Event Identity & Category
          </h3>

          <Input
            label="Event Title"
            placeholder="e.g. Annual Campus Hackathon 2026"
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
              placeholder="e.g. Main Auditorium, Innovation Block"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground tracking-wide">Description</label>
            <textarea
              rows={4}
              placeholder="Detailed schedule, prerequisites, objectives, and agenda..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {/* Section 2: Schedule & Invariants */}
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
            hint="Must be strictly before the event start time."
            value={registrationDeadline}
            onChange={(e) => setRegistrationDeadline(e.target.value)}
            required
          />
        </div>

        {/* Section 3: Capacity & Eligibility */}
        <div className="space-y-4">
          <h3 className="font-serif text-xl text-foreground pb-2 border-b border-border">
            3. Capacity & Participation Scope
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Capacity Limit (Optional)"
              type="number"
              min={1}
              placeholder="e.g. 100 (Leave empty for unlimited)"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />

            <Input
              label="Prize / Reward (Optional)"
              placeholder="e.g. $5,000 Cash Prize + Trophy"
              value={prize}
              onChange={(e) => setPrize(e.target.value)}
            />
          </div>

          <Input
            label="Eligibility Criteria"
            hint="Describe institutional rules or college restrictions."
            placeholder="e.g. Open to all students, or restricted to engineering majors"
            value={eligibility}
            onChange={(e) => setEligibility(e.target.value)}
            required
          />
        </div>

        {/* Actions */}
        <div className="pt-6 border-t border-border flex items-center justify-end gap-3">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-lg border border-border bg-surface-elevated hover:bg-surface text-xs font-semibold uppercase tracking-wider text-muted hover:text-foreground transition-colors"
          >
            Cancel
          </Link>
          <Button type="submit" isLoading={isSubmitting} size="lg">
            Create Event (Draft)
          </Button>
        </div>
      </form>
    </div>
  );
}
