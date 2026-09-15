'use client';

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api";
import { Event, Registration } from "@/types/api";
import { Users, Search, ArrowLeft, Mail, School, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

export default function EventParticipantsPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!id) return;
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [evt, parts] = await Promise.all([
          apiClient.events.getById(id),
          apiClient.participants.getByEvent(id),
        ]);
        setEvent(evt);
        setParticipants(parts);
      } catch (err: any) {
        setError(err.message || "Failed to load participants. Verify your organizer ownership permissions.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  const filteredParticipants = participants.filter((p) => {
    const student = p.student;
    if (!student) return true;
    const q = searchQuery.toLowerCase();
    return (
      student.name.toLowerCase().includes(q) ||
      student.email.toLowerCase().includes(q) ||
      student.college.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
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
          <span>Attendee Registry</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-foreground font-normal tracking-tight">
          {event?.title ? `${event.title} — Participants` : "Participant Roster"}
        </h1>
        <p className="text-xs sm:text-sm text-muted">
          Verified student attendance records and registered participant directory.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger-soft border border-danger/30 text-danger text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Roster Summary Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted block">Total Roster</span>
          <p className="font-serif text-3xl text-foreground">{participants.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted block">Capacity Limit</span>
          <p className="font-serif text-3xl text-accent">{event?.capacity || "Unlimited"}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted block">Event Status</span>
          <div className="pt-1">
            {event && <StatusBadge status={event.status} availability={event.availability} />}
          </div>
        </div>
      </div>

      {/* Roster Table Card */}
      <div className="rounded-3xl border border-border bg-surface overflow-hidden shadow-sm space-y-4">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-foreground">Registered Students</h2>
            <p className="text-xs text-muted">Cross-institution participant listings.</p>
          </div>

          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student, email, college..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface pl-10 pr-3.5 py-2 text-xs text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 text-center text-xs font-mono text-muted uppercase tracking-widest">
            Loading Attendee Directory...
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="p-16 text-center text-xs text-muted">
            No registered attendees found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated/60 text-muted border-b border-border uppercase font-mono tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-6">Participant</th>
                  <th className="py-3 px-6">Institutional Affiliation</th>
                  <th className="py-3 px-6">Registered At</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredParticipants.map((reg) => (
                  <tr key={reg.id} className="hover:bg-surface-elevated/30 transition-colors">
                    <td className="py-4 px-6 font-medium text-foreground">
                      <div className="space-y-0.5">
                        <span className="block text-sm">{reg.student?.name || "Student Participant"}</span>
                        <span className="block text-[11px] text-muted font-mono">{reg.student?.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted">
                      <div className="flex items-center gap-1.5">
                        <School className="w-3.5 h-3.5 text-accent" />
                        <span>{reg.student?.college || "Affiliated Institution"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted font-mono text-[11px]">
                      {new Date(reg.registeredAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={reg.status} />
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
