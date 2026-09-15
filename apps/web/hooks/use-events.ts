'use client';

import { useState, useEffect, useCallback } from 'react';
import { Event } from '@/types/api';
import { apiClient } from '@/lib/api';

interface UseEventsParams {
  search?: string;
  category?: string;
  from?: string;
  to?: string;
  status?: string;
}

export function useEvents(params?: UseEventsParams) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.events.list(params);
      setEvents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  }, [params?.search, params?.category, params?.from, params?.to, params?.status]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, isLoading, error, refetch: fetchEvents };
}
