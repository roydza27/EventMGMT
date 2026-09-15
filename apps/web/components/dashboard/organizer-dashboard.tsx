'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Event } from '@/types/api';
import { apiClient } from '@/lib/api';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  PlusCircle,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  Edit,
  XCircle,
  Eye,
  Sparkles
} from 'lucide-react';

export function OrganizerDashboard({ user }: { user: User }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.events.list();
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handlePublish = async (id: string) => {
    setActionLoadingId(id);
    setNotification(null);
    try {
      await apiClient.events.publish(id);
      setNotification({ type: 'success', message: 'Event published successfully!' });
      await fetchEvents();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to publish event.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this event?')) return;
    setActionLoadingId(id);
    setNotification(null);
    try {
      await apiClient.events.cancel(id);
      setNotification({ type: 'success', message: 'Event has been cancelled.' });
      await fetchEvents();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to cancel event.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const myEvents = events.filter((e) => e.organizerId === user.id);
  const publishedCount = myEvents.filter((e) => e.status === 'PUBLISHED').length;
  const draftCount = myEvents.filter((e) => e.status === 'DRAFT').length;
  const totalRegistrations = myEvents.reduce((acc, curr) => acc + (curr.activeRegistrationCount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft text-accent border border-accent/20 text-xs font-mono uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Organizer Operations</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground font-normal tracking-tight">
            Event Management Workspace
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Managing events for {user.name} • {user.college}
          </p>
        </div>

        <Link
          href="/events/new"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-white text-xs font-semibold uppercase tracking-wider hover:bg-accent-hover transition-colors shadow-glow-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Event</span>
        </Link>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${
          notification.type === 'success'
            ? 'bg-success-soft text-success border-success/30'
            : 'bg-danger-soft text-danger border-danger/30'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted block">Total Owned</span>
          <p className="font-serif text-3xl text-foreground">{myEvents.length}</p>
          <span className="text-[11px] text-muted">Active in catalog</span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted block">Live Published</span>
          <p className="font-serif text-3xl text-success">{publishedCount}</p>
          <span className="text-[11px] text-muted">Open to students</span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted block">Pending Drafts</span>
          <p className="font-serif text-3xl text-warning">{draftCount}</p>
          <span className="text-[11px] text-muted">Unpublished events</span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted block">Total Registrations</span>
          <p className="font-serif text-3xl text-accent">{totalRegistrations}</p>
          <span className="text-[11px] text-muted">Across all live events</span>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl text-foreground">Your Event Programs</h2>
            <p className="text-xs text-muted">Review, publish, edit, or track attendance roster.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs font-mono text-muted uppercase tracking-widest">
            Loading Events...
          </div>
        ) : myEvents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Calendar className="w-10 h-10 text-muted/40 mx-auto" />
            <h3 className="font-serif text-lg text-foreground">No Events Created Yet</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Draft your first collegiate competition, workshop, or festival.
            </p>
            <Link
              href="/events/new"
              className="inline-block px-4 py-2 rounded-xl bg-accent text-white text-xs font-medium uppercase tracking-wider hover:bg-accent-hover"
            >
              Draft Event
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-sunken/40 text-[11px] font-mono uppercase tracking-wider text-muted">
                <tr>
                  <th className="py-3.5 px-6">Event Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Participants</th>
                  <th className="py-3.5 px-4">Schedule</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {myEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="space-y-0.5">
                        <Link href={`/events/${evt.id}`} className="font-serif text-base text-foreground hover:text-accent font-medium block truncate max-w-xs">
                          {evt.title}
                        </Link>
                        <span className="text-xs text-muted truncate block max-w-xs">{evt.venue}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="text-xs font-mono text-muted uppercase tracking-wider">{evt.category}</span>
                    </td>

                    <td className="py-4 px-4">
                      <StatusBadge status={evt.status} availability={evt.availability} />
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-accent" />
                        <span className="text-xs font-mono font-medium text-foreground">
                          {evt.activeRegistrationCount ?? 0} {evt.capacity ? `/ ${evt.capacity}` : ''}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-xs text-muted">
                      {new Date(evt.startTime).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/events/${evt.id}/participants`}
                          title="View Participant Roster"
                          className="p-2 rounded-lg bg-surface-elevated hover:bg-surface border border-border text-foreground hover:text-accent transition-colors"
                        >
                          <Users className="w-3.5 h-3.5" />
                        </Link>

                        <Link
                          href={`/events/${evt.id}/edit`}
                          title="Edit Event"
                          className="p-2 rounded-lg bg-surface-elevated hover:bg-surface border border-border text-foreground hover:text-accent transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>

                        {evt.status === 'DRAFT' && (
                          <button
                            onClick={() => handlePublish(evt.id)}
                            disabled={actionLoadingId === evt.id}
                            title="Publish Event"
                            className="px-2.5 py-1.5 rounded-lg bg-success-soft hover:bg-success text-success hover:text-white border border-success/30 text-xs font-medium transition-colors"
                          >
                            {actionLoadingId === evt.id ? '...' : 'Publish'}
                          </button>
                        )}

                        {evt.status === 'PUBLISHED' && (
                          <button
                            onClick={() => handleCancel(evt.id)}
                            disabled={actionLoadingId === evt.id}
                            title="Cancel Event"
                            className="p-2 rounded-lg bg-danger-soft hover:bg-danger text-danger hover:text-white border border-danger/30 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <Link
                          href={`/events/${evt.id}`}
                          title="Public View"
                          className="p-2 rounded-lg bg-surface-elevated hover:bg-surface border border-border text-muted hover:text-foreground transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
