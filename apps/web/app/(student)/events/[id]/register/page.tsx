'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Event, Registration } from '@/types/api';
import { useAuth } from '@/hooks/use-auth';
import { apiClient, ApiRequestError } from '@/lib/api';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  School,
  Ticket,
  Users,
} from 'lucide-react';

export default function EventRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successRegistration, setSuccessRegistration] = useState<Registration | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    rollNo: '',
    department: '',
    phone: '',
    notes: '',
    confirmedEligibility: false,
  });

  useEffect(() => {
    if (!id) return;
    async function fetchEvent() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const data = await apiClient.events.getById(id);
        setEvent(data);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load event details.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/events/${id}/register`)}`);
    }
  }, [authLoading, isAuthenticated, id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.confirmedEligibility) {
      setFormError('Please verify and confirm that you meet the event eligibility criteria.');
      return;
    }
    if (!formData.rollNo.trim()) {
      setFormError('Please provide your Student ID / Roll Number.');
      return;
    }
    if (!formData.department.trim()) {
      setFormError('Please provide your Department / Major.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const reg = await apiClient.registrations.register(id);
      setSuccessRegistration(reg);
    } catch (err: any) {
      if (err instanceof ApiRequestError) {
        setFormError(err.message);
      } else {
        setFormError('An unexpected error occurred while booking your pass.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
        <p className="text-xs font-mono text-muted uppercase tracking-widest">
          Loading Event Pass Application...
        </p>
      </div>
    );
  }

  if (errorMsg || !event) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-danger-soft text-danger border border-danger/30">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl text-foreground">Event Unavailable</h2>
          <p className="text-xs text-muted">
            {errorMsg || 'This event could not be found or registration is currently unavailable.'}
          </p>
        </div>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Event Discovery</span>
        </Link>
      </div>
    );
  }

  const startDate = new Date(event.startTime);
  const formattedDate = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedDeadline = new Date(event.registrationDeadline).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  if (successRegistration) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-2xl border border-success/30 bg-surface shadow-surface-dark overflow-hidden p-8 sm:p-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-soft text-success border border-success/30 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-success font-medium">
              Registration Confirmed
            </span>
            <h2 className="font-serif text-3xl text-foreground font-normal">
              Your Pass is Secured!
            </h2>
            <p className="text-xs sm:text-sm text-muted max-w-md mx-auto">
              You are officially registered for <span className="font-medium text-foreground">{event.title}</span>. Your digital admission pass has been generated.
            </p>
          </div>

          {/* Pass Details Card */}
          <div className="p-5 rounded-xl border border-border bg-surface-sunken/60 text-left space-y-3 max-w-md mx-auto">
            <div className="flex items-center justify-between border-b border-border/70 pb-2">
              <span className="text-[11px] font-mono text-muted uppercase">Pass ID</span>
              <span className="text-xs font-mono font-medium text-foreground">
                {successRegistration.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border/70 pb-2">
              <span className="text-[11px] font-mono text-muted uppercase">Event Date</span>
              <span className="text-xs font-medium text-foreground">{formattedDate}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border/70 pb-2">
              <span className="text-[11px] font-mono text-muted uppercase">Venue</span>
              <span className="text-xs font-medium text-foreground">{event.venue}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-muted uppercase">Status</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success">
                <CheckCircle2 className="w-3 h-3" /> ACTIVE
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/registrations"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold uppercase tracking-wider shadow-glow transition-all"
            >
              <Ticket className="w-4 h-4" />
              <span>View in My Passes</span>
            </Link>
            <Link
              href={`/events/${id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl border border-border hover:bg-surface-elevated text-xs font-medium text-muted hover:text-foreground transition-colors"
            >
              Return to Event Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Top Back Navigation */}
      <div>
        <Link
          href={`/events/${id}`}
          className="inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Event</span>
        </Link>
      </div>

      {/* Main Registration Card */}
      <div className="rounded-2xl border border-border bg-surface shadow-surface-dark overflow-hidden">
        {/* Header Strip */}
        <div className="p-6 sm:p-8 border-b border-border bg-surface-sunken/40 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-medium tracking-wide uppercase bg-accent-soft text-accent border border-accent/20">
              <Ticket className="w-3.5 h-3.5" />
              <span>Official Registration</span>
            </span>
            <span className="text-xs font-mono text-muted uppercase">
              Deadline: {formattedDeadline}
            </span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl text-foreground font-normal">
            Pass Application: {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted pt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              <span>{formattedDate}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-accent" />
              <span>{event.venue}</span>
            </span>
            {event.capacity && (
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-accent" />
                <span>Max Capacity: {event.capacity}</span>
              </span>
            )}
          </div>
        </div>

        {/* Student Profile Identity Section */}
        <div className="px-6 sm:px-8 pt-6 pb-2">
          <div className="p-4 rounded-xl border border-border bg-surface-sunken/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-success" />
                <span>Verified Applicant Credentials</span>
              </div>
              <span className="text-[10px] font-mono text-success uppercase">
                Ready to Submit
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div>
                <span className="font-semibold text-foreground text-sm block">{user?.name}</span>
                <span className="text-muted text-xs">{user?.email}</span>
              </div>
              {user?.college && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface text-muted text-xs border border-border">
                  <School className="w-3.5 h-3.5 text-accent" />
                  <span>{user.college}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 pt-4 space-y-6">
          {formError && (
            <div className="p-4 rounded-xl bg-danger-soft border border-danger/30 text-danger text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">Registration Error</span>
                <span>{formError}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block">
                  Student ID / Roll Number <span className="text-accent">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. 2024CS1092"
                  value={formData.rollNo}
                  onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block">
                  Department / Program <span className="text-accent">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Information Technology"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block">
                Primary Contact Number <span className="text-muted text-[11px]">(optional)</span>
              </label>
              <Input
                type="tel"
                placeholder="e.g. +1 555-0199"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block">
                Special Requests or Notes <span className="text-muted text-[11px]">(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Share any accessibility requirements, team member info, or notes for the organizing committee..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-surface-elevated text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent resize-none"
              />
            </div>

            {/* Eligibility Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-surface-sunken/30 cursor-pointer hover:bg-surface-sunken/60 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.confirmedEligibility}
                  onChange={(e) => setFormData({ ...formData, confirmedEligibility: e.target.checked })}
                  className="mt-1 rounded border-border text-accent focus:ring-accent accent-accent"
                />
                <div className="text-xs leading-relaxed space-y-1">
                  <span className="font-semibold text-foreground block">
                    Eligibility & Policy Acknowledgement
                  </span>
                  <p className="text-muted text-[11px]">
                    I confirm that I meet the event criteria: <span className="font-medium text-foreground italic">"{event.eligibility}"</span>. I agree to abide by the event code of conduct and institute safety guidelines.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
            <Link
              href={`/events/${id}`}
              className="px-5 py-3 text-xs font-medium text-muted hover:text-foreground rounded-xl border border-border hover:bg-surface-elevated transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 text-xs font-semibold uppercase tracking-wider text-white bg-accent hover:bg-accent-hover rounded-xl shadow-glow transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Securing Pass...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Book Pass</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
