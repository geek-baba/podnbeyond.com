/**
 * Guest Booking Detail Page
 * Displays booking details for guests with token-based access
 * Allows guests to view, modify, and cancel their bookings
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  getGuestBooking,
  Booking,
  BookingDetailResponse,
} from '../../../lib/booking';
import GuestBookingDetail from '../../../components/guest/GuestBookingDetail';
import ModifyBookingForm from '../../../components/guest/ModifyBookingForm';
import CancelBookingForm from '../../../components/guest/CancelBookingForm';

export default function GuestBookingPage() {
  const router = useRouter();
  const { token } = router.query;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'view' | 'modify' | 'cancel'>('view');
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Fetch booking
  useEffect(() => {
    const fetchBooking = async () => {
      if (!token || typeof token !== 'string') return;

      try {
        setLoading(true);
        setError(null);
        const response = await getGuestBooking(token);
        if (response.success && response.data) {
          setBooking(response.data);
          setAccessToken(response.token || token);
        } else {
          setError('Failed to fetch booking');
        }
      } catch (err: any) {
        console.error('Error fetching booking:', err);
        if (err.message.includes('401') || err.message.includes('Invalid')) {
          setError('Invalid or expired booking link. Please use the link from your confirmation email.');
        } else if (err.message.includes('404')) {
          setError('Booking not found.');
        } else {
          setError(err.message || 'Failed to fetch booking');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [token]);

  const handleSuccess = async () => {
    // Refresh booking data after successful action
    if (!token || typeof token !== 'string') return;

    try {
      const response = await getGuestBooking(token);
      if (response.success && response.data) {
        setBooking(response.data);
        setActiveView('view');
      }
    } catch (err: any) {
      console.error('Error refreshing booking:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading booking...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Booking</h2>
            <p className="text-sm text-gray-600 mb-4">{error || 'Booking not found'}</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if booking can be modified or cancelled
  const canModify = ['PENDING', 'CONFIRMED'].includes(booking.status);
  const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Your Booking</h1>
          <p className="mt-2 text-sm text-gray-600">
            View and manage your booking details
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveView('view')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeView === 'view'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              View Booking
            </button>
            {canModify && (
              <button
                onClick={() => setActiveView('modify')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeView === 'modify'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Modify Booking
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => setActiveView('cancel')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeView === 'cancel'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel Booking
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {activeView === 'view' && <GuestBookingDetail booking={booking} />}

        {activeView === 'modify' && canModify && accessToken && (
          <ModifyBookingForm
            booking={booking}
            token={accessToken}
            onSuccess={handleSuccess}
            onCancel={() => setActiveView('view')}
          />
        )}

        {activeView === 'cancel' && canCancel && accessToken && (
          <CancelBookingForm
            booking={booking}
            token={accessToken}
            onSuccess={handleSuccess}
            onCancel={() => setActiveView('view')}
          />
        )}

        {/* Status Message */}
        {!canModify && !canCancel && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This booking cannot be modified or cancelled because it is in{' '}
              {booking.status.replace(/_/g, ' ').toLowerCase()} status.
            </p>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Need Help?</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              If you have any questions or need assistance with your booking, please contact us:
            </p>
            <p>
              <strong>Email:</strong> support@capsulepodhotel.com
            </p>
            <p>
              <strong>Phone:</strong> +91-XXX-XXX-XXXX
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

