import { User, Event, Registration, AuthResponse, ApiErrorResponse } from '@/types/api';
import { authStorage } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export class ApiRequestError extends Error {
  status: number;
  code: string;
  details?: any;

  constructor(message: string, status: number, code: string, details?: any) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = authStorage.getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorData = data as ApiErrorResponse;
    const message = errorData?.error?.message || response.statusText || 'An error occurred';
    const code = errorData?.error?.code || 'REQUEST_FAILED';
    const details = errorData?.error?.details;

    if (response.status === 401 && endpoint !== '/api/auth/login') {
      authStorage.clearAuth();
    }

    throw new ApiRequestError(message, response.status, code, details);
  }

  return data as T;
}

export const apiClient = {
  auth: {
    async login(email: string, password: string): Promise<AuthResponse> {
      const res = await request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.user && res.accessToken) {
        authStorage.setAuth(res.user, res.accessToken, res.refreshToken);
      }
      return res;
    },

    async logout(): Promise<void> {
      const refreshToken = authStorage.getRefreshToken();
      try {
        await request<void>('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      } finally {
        authStorage.clearAuth();
      }
    },

    async me(): Promise<{ user: User }> {
      return request<{ user: User }>('/api/auth/me');
    },

    async refresh(): Promise<{ accessToken: string; refreshToken?: string }> {
      const refreshToken = authStorage.getRefreshToken();
      if (!refreshToken) {
        throw new ApiRequestError('No refresh token available', 401, 'UNAUTHORIZED');
      }
      const res = await request<{ accessToken: string; refreshToken?: string }>('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      if (res.accessToken) {
        authStorage.setAccessToken(res.accessToken);
      }
      return res;
    },
  },

  events: {
    async list(params?: {
      search?: string;
      category?: string;
      from?: string;
      to?: string;
      status?: string;
    }): Promise<Event[]> {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.append('search', params.search);
      if (params?.category) searchParams.append('category', params.category);
      if (params?.from) searchParams.append('from', params.from);
      if (params?.to) searchParams.append('to', params.to);
      if (params?.status) searchParams.append('status', params.status);

      const qs = searchParams.toString();
      const endpoint = qs ? `/api/events?${qs}` : '/api/events';
      const res = await request<{ events: Event[] }>(endpoint);
      return res.events || [];
    },

    async get(id: string): Promise<Event> {
      const res = await request<{ event: Event }>(`/api/events/${id}`);
      return res.event;
    },

    async getById(id: string): Promise<Event> {
      const res = await request<{ event: Event }>(`/api/events/${id}`);
      return res.event;
    },

    async create(eventData: any): Promise<Event> {
      const res = await request<{ event: Event }>('/api/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      });
      return res.event;
    },

    async update(id: string, eventData: any): Promise<Event> {
      const res = await request<{ event: Event }>(`/api/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(eventData),
      });
      return res.event;
    },

    async publish(id: string): Promise<Event> {
      const res = await request<{ event: Event }>(`/api/events/${id}/publish`, {
        method: 'POST',
      });
      return res.event;
    },

    async cancel(id: string): Promise<Event> {
      const res = await request<{ event: Event }>(`/api/events/${id}/cancel`, {
        method: 'POST',
      });
      return res.event;
    },

    async getParticipants(id: string): Promise<Registration[]> {
      const res = await request<{ eventId: string; registrations: Registration[] }>(`/api/events/${id}/participants`);
      return res.registrations || [];
    },
  },

  participants: {
    async getByEvent(eventId: string): Promise<Registration[]> {
      const res = await request<{ eventId: string; registrations: Registration[] }>(`/api/events/${eventId}/participants`);
      return res.registrations || [];
    },
  },

  registrations: {
    async getMyRegistrations(): Promise<Registration[]> {
      const res = await request<{ registrations: Registration[] }>('/api/registrations/me');
      return res.registrations || [];
    },

    async register(eventId: string): Promise<Registration> {
      const res = await request<{ registration: Registration }>(`/api/events/${eventId}/register`, {
        method: 'POST',
      });
      return res.registration;
    },

    async cancel(registrationId: string): Promise<Registration> {
      const res = await request<{ registration: Registration }>(`/api/registrations/${registrationId}/cancel`, {
        method: 'POST',
      });
      return res.registration;
    },
  },
};
