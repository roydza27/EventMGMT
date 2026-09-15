'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Event } from '@/types/api';
import { apiClient } from '@/lib/api';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  ShieldAlert,
  Search,
  Users,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  PlusCircle,
  Sparkles
} from 'lucide-react';

export function AdminDashboard({ user }: { user: User }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.events.list({
        search: searchTerm.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [statusFilter]);

  const handlePublish = async (id: string) => {
    setActionLoadingId(id);
    setNotification(null);
    try {
      await apiClient.events.publish(id);
      setNotification({ type: 'success', message: 'Event successfully published.' });
      await fetchEvents();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to publish event.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this event across the system?')) return;
    setActionLoadingId(id);
    setNotification(null);
    try {
      await apiClient.events.cancel(id);
      setNotification({ type: 'success', message: 'Event marked as cancelled.' });
      await fetchEvents();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to cancel event.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const totalEvents = events.length;
  const publishedCount = events.filter((e) => e.status === 'PUBLISHED').length;
  const draftCount = events.filter((e) => e.status === 'DRAFT').length;
  const cancelledCount = events.filter((e) => e.status === 'CANCELLED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft text-accent border border-accent/20 text-xs font-mono uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Administrative Governance</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground font-normal tracking-tight">
            System Administration
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Platform governance, cross-college catalog moderation, and audit controls.
          </p>
        </div>

        <Link
          href="/events/new"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-white text-xs font-semibold uppercase tracking-wider hover:bg-accent-hover transition-colors shadow-glow-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Event</span>
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
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted block">Total Catalog</span>
          <p className="font-serif text-3xl text-foreground">{totalEvents}</p>
          <span className="text-[11px] text-muted">All institutions</span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted block">Published</span>
          <p className="font-serif text-3xl text-success">{publishedCount}</p>
          <span className="text-[11px] text-muted">Active public events</span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted block">Drafts</span>
          <p className="font-serif text-3xl text-warning">{draftCount}</p>
          <span className="text-[11px] text-muted">In preparation</span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted block">Cancelled</span>
          <p className="font-serif text-3xl text-danger">{cancelledCount}</p>
          <span className="text-[11px] text-muted">Archived / Cancelled</span>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-surface overflow-hidden shadow-sm space-y-4">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-foreground">Global Events Directory</h2>
            <p className="text-xs text-muted">Inspect and manage all collegiate event entries.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input
                type="text"
                placeholder="Filter events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchEvents()}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:border-accent focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs font-mono text-muted uppercase tracking-widest">
            Loading Directory...
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted">No events found matching current criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-sunken/40 text-[11px] font-mono uppercase tracking-wider text-muted">
                <tr>
                  <th className="py-3.5 px-6">Event Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Active Regs</th>
                  <th className="py-3.5 px-4">Schedule</th>
                  <th className="py-3.5 px-6 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="space-y-0.5">
                        <Link href={`/events/${evt.id}`} className="font-serif text-base text-foreground hover:text-accent font-medium block truncate max-w-xs">
                          {evt.title}
                        </Link>
                        <span className="text-xs text-muted truncate block max-w-xs">{evt.venue}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-xs font-mono text-muted uppercase">
                      {evt.category}
                    </td>

                    <td className="py-4 px-4">
                      <StatusBadge status={evt.status} availability={evt.availability} />
                    </td>

                    <td className="py-4 px-4 text-xs font-mono">
                      {evt.activeRegistrationCount ?? 0} {evt.capacity ? `/ ${evt.capacity}` : ''}
                    </td>

                    <td className="py-4 px-4 text-xs text-muted">
                      {new Date(evt.startTime).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {evt.status === 'DRAFT' && (
                          <button
                            onClick={() => handlePublish(evt.id)}
                            disabled={actionLoadingId === evt.id}
                            title="Publish Event"
                            className="px-2.5 py-1.5 rounded-lg bg-success-soft hover:bg-success text-success hover:text-white border border-success/30 text-xs font-medium transition-colors"
                          >
                            Publish
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
                          title="View Details"
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
