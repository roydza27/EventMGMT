'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Event, Registration } from '@/types/api';
import { useAuth } from '@/hooks/use-auth';
import { apiClient, ApiRequestError } from '@/lib/api';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Trophy,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  User as UserIcon,
  ArrowLeft,
  XCircle,
  Sparkles,
  X,
  School,
  Ticket
} from 'lucide-react';

interface EventDetailViewProps {
  initialEvent: Event;
}

export function EventDetailView({ initialEvent }: EventDetailViewProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [event, setEvent] = useState<Event>(initialEvent);
  const [userRegistration, setUserRegistration] = useState<Registration | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showStickyBar, setShowStickyBar] = useState<boolean>(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkRegistration() {
      if (isAuthenticated && user?.role === 'STUDENT') {
        try {
          const myRegs = await apiClient.registrations.getMyRegistrations();
          const found = myRegs.find(
            (r) => (r.eventId === event.id || r.event?.id === event.id) && r.status === 'ACTIVE'
          );
          if (found) {
            setUserRegistration(found);
          }
        } catch {}
      }
    }
    checkRegistration();
  }, [isAuthenticated, user, event.id]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const deadlineDate = new Date(event.registrationDeadline);

  const formattedDate = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTimeRange = `${startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })} – ${endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;

  const formattedDeadline = deadlineDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const [showRegModal, setShowRegModal] = useState<boolean>(false);
  const [regForm, setRegForm] = useState({
    rollNo: '',
    department: '',
    phone: '',
    notes: '',
    confirmedEligibility: false,
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('register') === 'true' && isAuthenticated && user?.role === 'STUDENT' && !userRegistration) {
        setShowRegModal(true);
      }
    }
  }, [isAuthenticated, user, userRegistration]);

  const handleOpenRegistrationForm = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/events/${event.id}?register=true`)}`);
      return;
    }

    if (user?.role !== 'STUDENT') {
      setErrorMsg('Only student accounts can apply for event passes.');
      return;
    }

    setFormError(null);
    setShowRegModal(true);
  };

  const handleConfirmRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.confirmedEligibility) {
      setFormError('Please check the confirmation box verifying eligibility.');
      return;
    }
    if (!regForm.rollNo.trim()) {
      setFormError('Please enter your Student ID / Roll Number.');
      return;
    }
    if (!regForm.department.trim()) {
      setFormError('Please enter your Department / Program.');
      return;
    }

    setIsRegistering(true);
    setFormError(null);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const reg = await apiClient.registrations.register(event.id);
      setUserRegistration(reg);
      setSuccessMsg("Registration confirmed! Your admission pass has been generated.");
      setEvent((prev) => ({
        ...prev,
        activeRegistrationCount: (prev.activeRegistrationCount || 0) + 1,
      }));
      setShowRegModal(false);
    } catch (err: any) {
      if (err instanceof ApiRequestError) {
        setFormError(err.message);
      } else {
        setFormError('An unexpected error occurred while registering.');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!userRegistration) return;
    if (!confirm('Are you sure you want to withdraw your registration for this event?')) return;

    setIsCancelling(true);
    setErrorMsg(null);

    try {
      await apiClient.registrations.cancel(userRegistration.id);
      setUserRegistration(null);
      setSuccessMsg('Your registration has been withdrawn.');
      setEvent((prev) => ({
        ...prev,
        activeRegistrationCount: Math.max(0, (prev.activeRegistrationCount || 1) - 1),
      }));
    } catch (err: any) {
      if (err instanceof ApiRequestError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to withdraw registration.');
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const isRegistered = !!userRegistration;
  const isCancelled = event.status === 'CANCELLED' || event.availability === 'CANCELLED';
  const isCompleted = event.status === 'COMPLETED' || event.availability === 'COMPLETED';
  const isClosed = event.availability === 'REGISTRATION_CLOSED' || new Date() >= deadlineDate;
  const isFull = event.availability === 'FULL';

  const renderRegisterButton = (isCompact = false) => {
    if (isRegistered) {
      return (
        <div className={`flex items-center gap-3 ${isCompact ? '' : 'flex-wrap'}`}>
          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-success-soft text-success border border-success/30 font-medium text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>You're Registered</span>
          </div>
          <button
            onClick={handleCancelRegistration}
            disabled={isCancelling}
            className="text-xs text-muted hover:text-danger hover:underline transition-colors px-2 py-1"
          >
            {isCancelling ? 'Withdrawing...' : 'Withdraw Pass'}
          </button>
        </div>
      );
    }

    if (isCancelled) {
      return (
        <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-danger-soft text-danger border border-danger/30 text-sm font-medium">
          <XCircle className="w-5 h-5" />
          <span>Event Cancelled</span>
        </div>
      );
    }

    if (isCompleted) {
      return (
        <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-sunken text-muted border border-border text-sm font-medium">
          <span>Event Completed</span>
        </div>
      );
    }

    if (isClosed) {
      return (
        <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-sunken text-muted border border-border text-sm font-medium">
          <span>Registration Closed</span>
        </div>
      );
    }

    if (isFull) {
      return (
        <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-warning-soft text-warning border border-warning/30 text-sm font-medium">
          <span>Event Capacity Full</span>
        </div>
      );
    }

    return (
      <button
        onClick={handleOpenRegistrationForm}
        disabled={isRegistering}
        className={`inline-flex items-center justify-center font-semibold rounded-xl bg-accent hover:bg-accent-hover text-white shadow-glow transition-all duration-200 active:scale-[0.98] ${
          isCompact ? 'px-5 py-2.5 text-xs' : 'px-8 py-4 text-sm tracking-wide uppercase'
        }`}
      >
        {!isAuthenticated ? (
          'Sign In to Register'
        ) : (
          'Register for Event'
        )}
      </button>
    );
  };

  return (
    <div className="relative min-h-screen pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>All Events</span>
        </Link>
      </div>

      {errorMsg && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-6">
          <div className="p-4 rounded-xl bg-danger-soft border border-danger/30 text-danger text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Registration Issue</p>
              <p className="text-xs opacity-90">{errorMsg}</p>
            </div>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-6">
          <div className="p-4 rounded-xl bg-success-soft border border-success/30 text-success text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Confirmation</p>
              <p className="text-xs opacity-90">{successMsg}</p>
            </div>
          </div>
        </div>
      )}

      <section ref={heroRef} className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-8 sm:p-14 shadow-surface-dark">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />

          <div className="relative z-10 max-w-4xl space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-widest px-3 py-1 rounded-full bg-accent-soft text-accent border border-accent/20">
                {event.category}
              </span>
              <StatusBadge status={event.status} availability={event.availability} />
              {event.prize && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-warning bg-warning-soft border border-warning/20">
                  <Trophy className="w-3.5 h-3.5" />
                  {event.prize}
                </span>
              )}
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal text-foreground tracking-tight leading-[1.05]">
              {event.title}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 pb-2 border-y border-border/80 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted text-xs font-mono uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-accent" />
                  <span>Date</span>
                </div>
                <p className="font-medium text-foreground text-sm sm:text-base">
                  {formattedDate}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted text-xs font-mono uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                  <span>Time</span>
                </div>
                <p className="font-medium text-foreground text-sm sm:text-base">
                  {formattedTimeRange}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted text-xs font-mono uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-accent" />
                  <span>Venue</span>
                </div>
                <p className="font-medium text-foreground text-sm sm:text-base">
                  {event.venue}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-4">
              <div className="flex items-center gap-4">
                {renderRegisterButton()}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted font-mono">
                <Users className="w-4 h-4 text-accent" />
                <span>
                  {event.activeRegistrationCount ?? 0} {event.capacity ? `/ ${event.capacity}` : ''} Active Participants
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-8 space-y-12">
            <div className="space-y-4">
              <h2 className="font-serif text-2xl sm:text-3xl text-foreground font-normal tracking-tight">
                About the Event
              </h2>
              <div className="prose dark:prose-invert max-w-none text-base text-muted leading-relaxed whitespace-pre-line">
                {event.description}
              </div>
            </div>

            <div className="space-y-6 pt-8 border-t border-border">
              <h3 className="font-serif text-2xl text-foreground font-normal tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Schedule & Registration Timeline
              </h3>

              <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/60">
                  <div>
                    <span className="text-xs font-mono text-muted uppercase tracking-wider block">Registration Deadline</span>
                    <span className="text-sm font-semibold text-foreground">{formattedDeadline}</span>
                  </div>
                  <span className="text-xs text-muted">
                    {new Date() > deadlineDate ? 'Deadline passed' : 'Open until deadline'}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono text-muted uppercase tracking-wider block">Event Duration</span>
                    <span className="text-sm font-semibold text-foreground">
                      {Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))} hours total
                    </span>
                  </div>
                  <span className="text-xs text-muted">
                    {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t border-border">
              <h3 className="font-serif text-2xl text-foreground font-normal tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-accent" />
                Eligibility Criteria
              </h3>
              <div className="rounded-2xl border border-border bg-surface p-6">
                <p className="text-sm text-foreground leading-relaxed">
                  {event.eligibility}
                </p>
                <div className="mt-4 pt-4 border-t border-border/60 flex items-center gap-2 text-xs text-muted">
                  <UserIcon className="w-3.5 h-3.5 text-accent" />
                  <span>Open to cross-college students satisfying the above requirement.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted block">
                Organized By
              </span>
              <div className="space-y-1">
                <h4 className="font-serif text-lg text-foreground">
                  {event.organizer?.name || 'Campus Organizing Committee'}
                </h4>
                <p className="text-xs text-muted">
                  {event.organizer?.college || 'Apex Institute of Technology'}
                </p>
              </div>
              {event.organizer?.email && (
                <div className="pt-3 border-t border-border/60 text-xs text-muted truncate">
                  <span className="text-muted/70">Contact: </span>
                  <a href={`mailto:${event.organizer.email}`} className="text-accent hover:underline">
                    {event.organizer.email}
                  </a>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted block">
                Location Details
              </span>
              <div className="space-y-1">
                <h4 className="font-serif text-lg text-foreground">{event.venue}</h4>
                <p className="text-xs text-muted">
                  Campus Main Grounds & Innovation Facilities
                </p>
              </div>
            </div>

            {isRegistered && (
              <div className="rounded-2xl border border-success/30 bg-success-soft p-6 space-y-3">
                <div className="flex items-center gap-2 text-success font-medium text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Digital Pass Active</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Your registration is verified. View your pass anytime under My Registrations.
                </p>
                <Link
                  href="/registrations"
                  className="inline-block text-xs font-semibold text-accent hover:underline pt-1"
                >
                  View My Digital Pass →
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md px-4 py-3.5 transition-all duration-300 shadow-surface-dark ${
          showStickyBar ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:flex flex-col truncate">
            <span className="font-serif text-lg text-foreground truncate">{event.title}</span>
            <span className="text-xs text-muted font-mono">
              {formattedDate} • {event.venue}
            </span>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {renderRegisterButton(true)}
          </div>
        </div>
      </div>

      {/* Registration Pass Modal Dialog */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg my-8 rounded-2xl border border-border bg-surface shadow-surface-dark overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-border bg-surface-sunken/40">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wide uppercase bg-accent-soft text-accent border border-accent/20">
                  <Ticket className="w-3 h-3" />
                  <span>Pass Application</span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl text-foreground font-normal">
                  Event Registration
                </h3>
                <p className="text-xs text-muted">
                  Confirm your details to book an admission pass for <span className="font-medium text-foreground">{event.title}</span>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRegModal(false)}
                className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-surface-elevated transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Summary Strip */}
            <div className="px-6 py-3 bg-surface-elevated/40 border-b border-border/60 text-xs flex flex-wrap items-center justify-between gap-2 text-muted">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-accent" />
                <span>{formattedDate}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-accent" />
                <span>{event.venue}</span>
              </span>
            </div>

            {/* Student Verified Identity Box */}
            <div className="px-6 pt-5 pb-2">
              <div className="p-3.5 rounded-xl border border-border bg-surface-sunken/60 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-success" />
                  <span>Verified Student Profile</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 font-sans">
                  <div>
                    <span className="font-semibold text-foreground text-sm block">{user?.name}</span>
                    <span className="text-muted text-[11px]">{user?.email}</span>
                  </div>
                  {user?.college && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface text-muted text-xs border border-border">
                      <School className="w-3.5 h-3.5 text-accent" />
                      <span>{user.college}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleConfirmRegistration} className="p-6 pt-3 space-y-4">
              {formError && (
                <div className="p-3.5 rounded-xl bg-danger-soft border border-danger/30 text-danger text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground block">
                    Student ID / Roll No. <span className="text-accent">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. 2024CS014"
                    value={regForm.rollNo}
                    onChange={(e) => setRegForm({ ...regForm, rollNo: e.target.value })}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground block">
                    Department / Major <span className="text-accent">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Computer Science"
                    value={regForm.department}
                    onChange={(e) => setRegForm({ ...regForm, department: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block">
                  Contact Phone Number <span className="text-muted text-[11px]">(optional)</span>
                </label>
                <Input
                  type="tel"
                  placeholder="e.g. +1 555-0199"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block">
                  Special Notes or Requirements <span className="text-muted text-[11px]">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Any dietary restrictions, team affiliations, or accommodations..."
                  value={regForm.notes}
                  onChange={(e) => setRegForm({ ...regForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-surface-elevated text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                />
              </div>

              {/* Eligibility Checkbox */}
              <div className="pt-2 border-t border-border/70">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-surface-sunken/30 cursor-pointer hover:bg-surface-sunken/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={regForm.confirmedEligibility}
                    onChange={(e) => setRegForm({ ...regForm, confirmedEligibility: e.target.checked })}
                    className="mt-0.5 rounded border-border text-accent focus:ring-accent accent-accent"
                  />
                  <div className="text-xs leading-relaxed space-y-1">
                    <span className="font-medium text-foreground block">
                      Eligibility Confirmation
                    </span>
                    <p className="text-muted text-[11px]">
                      I confirm that I meet the criteria for this event: <span className="font-medium text-foreground italic">"{event.eligibility}"</span>.
                    </p>
                  </div>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  disabled={isRegistering}
                  className="px-4 py-2.5 text-xs font-medium text-muted hover:text-foreground rounded-xl border border-border hover:bg-surface-elevated transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-accent hover:bg-accent-hover rounded-xl shadow-glow transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  {isRegistering ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm & Book Pass</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
