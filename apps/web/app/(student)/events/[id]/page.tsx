'use client';

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Event } from "@/types/api";
import { apiClient } from "@/lib/api";
import { EventDetailView } from "@/components/events/event-detail-view";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function loadEvent() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient.events.getById(id);
        setEvent(data);
      } catch (err: any) {
        setError(err.message || "Event not found or unavailable.");
      } finally {
        setIsLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
        <p className="text-xs font-mono text-muted uppercase tracking-widest">Loading Event Details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-danger-soft text-danger border border-danger/30">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-3xl text-foreground font-normal">Event Not Found</h2>
          <p className="text-xs sm:text-sm text-muted">
            {error || "The event you are trying to view does not exist or has been removed from publication."}
          </p>
        </div>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Catalog</span>
        </Link>
      </div>
    );
  }

  return <EventDetailView initialEvent={event} />;
}
