/**
 * Booking Timeline Component
 * Displays audit log timeline with status changes, payments, and communications
 */

import React from 'react';
import Badge from '../ui/Badge';
import { mapBookingStatusToBadgeVariant } from '../../lib/badge-mappers';
import {
  BookingAuditLog,
  Payment,
  formatDateTime,
  formatCurrency,
  getPaymentMethod,
  getPaymentCurrency,
} from '../../lib/booking';

interface BookingTimelineProps {
  auditLogs: BookingAuditLog[];
  payments?: Payment[];
}

export default function BookingTimeline({ auditLogs, payments = [] }: BookingTimelineProps) {
  // Combine audit logs and payments into a timeline
  const timelineItems = [
    ...auditLogs.map((log) => ({
      type: 'audit' as const,
      id: log.id,
      timestamp: log.timestamp,
      action: log.action,
      performedBy: log.performedBy,
      meta: log.meta,
    })),
    ...payments.map((payment) => ({
      type: 'payment' as const,
      id: payment.id,
      timestamp: payment.createdAt,
      action: `Payment ${payment.status}`,
      performedBy: 'system',
      meta: {
        amount: payment.amount,
        currency: getPaymentCurrency(payment),
        method: getPaymentMethod(payment),
        status: payment.status,
      },
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getActionIcon = (action: string) => {
    if (action.includes('CREATE')) {
      return (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      );
    }
    if (action.includes('CHECK_IN')) {
      return (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    }
    if (action.includes('CHECK_OUT')) {
      return (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
      );
    }
    if (action.includes('CANCEL')) {
      return (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    }
    if (action.includes('TRANSITION')) {
      return (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
      );
    }
    if (action.includes('Payment')) {
      return (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      );
    }
    // Default icon
    return (
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
        <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'text-blue-600';
    if (action.includes('CHECK_IN')) return 'text-green-600';
    if (action.includes('CHECK_OUT')) return 'text-purple-600';
    if (action.includes('CANCEL')) return 'text-red-600';
    if (action.includes('TRANSITION')) return 'text-yellow-600';
    if (action.includes('Payment')) return 'text-indigo-600';
    return 'text-neutral-600';
  };

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/TRANSITION /g, 'Status changed to ')
      .replace(/Payment /g, '')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatMeta = (meta: any, type: 'audit' | 'payment') => {
    if (type === 'payment' && meta.amount) {
      // Map payment status to booking status badge variant for consistency
      const statusVariant = meta.status === 'COMPLETED' 
        ? 'completed' 
        : meta.status === 'PENDING' 
        ? 'pending' 
        : 'failed';
      
      return (
        <div className="mt-2 text-sm text-neutral-600">
          <div>
            Amount: {formatCurrency(meta.amount, meta.currency || 'INR')}
          </div>
          <div>Method: {meta.method || 'N/A'}</div>
          {meta.status && (
            <div className="mt-1">
              Status:{' '}
              <Badge variant={statusVariant} size="sm">
                {meta.status}
              </Badge>
            </div>
          )}
        </div>
      );
    }

    if (meta.fromState && meta.toState) {
      return (
        <div className="mt-2 text-sm text-neutral-600">
          <div className="flex items-center gap-2">
            <span>Status:</span>
            <Badge variant={mapBookingStatusToBadgeVariant(meta.fromState)} size="sm">
              {meta.fromState.replace(/_/g, ' ')}
            </Badge>
            <span>→</span>
            <Badge variant={mapBookingStatusToBadgeVariant(meta.toState)} size="sm">
              {meta.toState.replace(/_/g, ' ')}
            </Badge>
          </div>
          {meta.reason && <div className="mt-1">Reason: {meta.reason}</div>}
        </div>
      );
    }

    if (meta.changes) {
      return (
        <div className="mt-2 text-sm text-neutral-600">
          <div>Changes:</div>
          <pre className="mt-1 text-xs bg-neutral-50 p-2 rounded">
            {JSON.stringify(meta.changes, null, 2)}
          </pre>
        </div>
      );
    }

    if (meta && Object.keys(meta).length > 0) {
      return (
        <div className="mt-2 text-sm text-neutral-600">
          <pre className="text-xs bg-neutral-50 p-2 rounded">
            {JSON.stringify(meta, null, 2)}
          </pre>
        </div>
      );
    }

    return null;
  };

  if (timelineItems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">No timeline entries found</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {timelineItems.map((item, idx) => (
          <li key={`${item.type}-${item.id}`}>
            <div className="relative pb-8">
              {idx !== timelineItems.length - 1 && (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-neutral-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                {getActionIcon(item.action)}
                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${getActionColor(item.action)}`}>
                          {formatAction(item.action)}
                        </p>
                        <p className="mt-0.5 text-sm text-neutral-500">
                          by {item.performedBy === 'system' ? 'System' : item.performedBy}
                        </p>
                      </div>
                      <time className="flex-shrink-0 whitespace-nowrap text-sm text-neutral-500">
                        {formatDateTime(item.timestamp)}
                      </time>
                    </div>
                    {formatMeta(item.meta, item.type)}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

