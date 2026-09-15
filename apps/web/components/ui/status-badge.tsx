import React from 'react';
import { EventStatus, EventAvailability, RegistrationStatus } from '@/types/api';

interface StatusBadgeProps {
  status?: EventStatus | RegistrationStatus;
  availability?: EventAvailability;
  className?: string;
}

export function StatusBadge({ status, availability, className = '' }: StatusBadgeProps) {
  if (status === 'ACTIVE') {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider bg-success-soft text-success border border-success/20 ${className}`}>
        Active Pass
      </span>
    );
  }

  if (status === 'CANCELLED' || availability === 'CANCELLED') {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider bg-danger-soft text-danger border border-danger/20 ${className}`}>
        Cancelled
      </span>
    );
  }

  if (status === 'COMPLETED' || availability === 'COMPLETED') {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider bg-surface-sunken text-muted border border-border ${className}`}>
        Completed
      </span>
    );
  }

  if (status === 'DRAFT') {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider bg-warning-soft text-warning border border-warning/20 ${className}`}>
        Draft
      </span>
    );
  }

  if (availability === 'FULL') {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider bg-warning-soft text-warning border border-warning/30 ${className}`}>
        Event Full
      </span>
    );
  }

  if (availability === 'REGISTRATION_CLOSED') {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider bg-surface-sunken text-muted border border-border ${className}`}>
        Closed
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider bg-success-soft text-success border border-success/25 ${className}`}>
      Open
    </span>
  );
}
