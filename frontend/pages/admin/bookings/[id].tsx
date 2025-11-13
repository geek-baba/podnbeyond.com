/**
 * Booking Detail Page
 * Displays detailed information about a booking with tabs for summary, timeline, payments, notes, and actions
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  getBooking,
  Booking,
  BookingDetailResponse,
  formatDate,
  formatDateTime,
  formatCurrency,
  calculateOutstandingBalance,
  getStatusColor,
  getSourceColor,
} from '../../../lib/booking';
import ModifyBookingModal from '../../../components/booking/ModifyBookingModal';
import CheckInModal from '../../../components/booking/CheckInModal';
import CheckOutModal from '../../../components/booking/CheckOutModal';
import CancelBookingModal from '../../../components/booking/CancelBookingModal';
import BookingTimeline from '../../../components/booking/BookingTimeline';
import BookingPayments from '../../../components/booking/BookingPayments';
import BookingNotes from '../../../components/booking/BookingNotes';
import ChargeCardModal from '../../../components/booking/ChargeCardModal';
import RecordCashModal from '../../../components/booking/RecordCashModal';
import IssueRefundModal from '../../../components/booking/IssueRefundModal';

export default function BookingDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'timeline' | 'payments' | 'notes' | 'actions'>('summary');
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [checkOutModalOpen, setCheckOutModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [chargeCardModalOpen, setChargeCardModalOpen] = useState(false);
  const [recordCashModalOpen, setRecordCashModalOpen] = useState(false);
  const [issueRefundModalOpen, setIssueRefundModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<number | null>(null);

  // Fetch booking
  useEffect(() => {
    const fetchBooking = async () => {
      if (!id || typeof id !== 'string') return;

      try {
        setLoading(true);
        setError(null);
        const response: BookingDetailResponse = await getBooking(parseInt(id));
        if (response.success && response.data) {
          setBooking(response.data);
        } else {
          setError('Failed to fetch booking');
        }
      } catch (err: any) {
        console.error('Error fetching booking:', err);
        setError(err.message || 'Failed to fetch booking');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

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
        <div className="text-center">
          <p className="text-red-600">{error || 'Booking not found'}</p>
          <button
            onClick={() => router.push('/admin/bookings')}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  const outstandingBalance = calculateOutstandingBalance(booking);

  const handleAction = (action: string, booking: Booking) => {
    switch (action) {
      case 'modify':
        setModifyModalOpen(true);
        break;
      case 'check-in':
        setCheckInModalOpen(true);
        break;
      case 'check-out':
        setCheckOutModalOpen(true);
        break;
      case 'cancel':
        setCancelModalOpen(true);
        break;
      default:
        console.log('Action not implemented:', action);
    }
  };

  const handleModalSuccess = async () => {
    // Refresh booking data after successful action
    if (!id || typeof id !== 'string') return;
    
    try {
      const response: BookingDetailResponse = await getBooking(parseInt(id));
      if (response.success && response.data) {
        setBooking(response.data);
      }
    } catch (err: any) {
      console.error('Error refreshing booking:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/bookings')}
            className="text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Bookings
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Booking #{booking.confirmationNumber || booking.id}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {booking.guestName} • {booking.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span
                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                  booking.status
                )}`}
              >
                {booking.status.replace(/_/g, ' ')}
              </span>
              <span
                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getSourceColor(
                  booking.source
                )}`}
              >
                {booking.source.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {(['summary', 'timeline', 'payments', 'notes', 'actions'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white shadow rounded-lg p-6">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Guest Details */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Guest Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{booking.guestName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{booking.email}</p>
                  </div>
                  {booking.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{booking.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stay Details */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Stay Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Property</label>
                    <p className="mt-1 text-sm text-gray-900">{booking.property?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Room Type</label>
                    <p className="mt-1 text-sm text-gray-900">{booking.roomType?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Check-in</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(booking.checkIn)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Check-out</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(booking.checkOut)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Guests</label>
                    <p className="mt-1 text-sm text-gray-900">{booking.guests}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Rooms</label>
                    <p className="mt-1 text-sm text-gray-900">{booking.rooms}</p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Pricing</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Price</label>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {formatCurrency(booking.totalPrice, booking.currency)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Outstanding Balance</label>
                    <p
                      className={`mt-1 text-sm font-medium ${
                        outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {formatCurrency(outstandingBalance, booking.currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Source Information */}
              {booking.sourceReservationId && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Source Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Source Reservation ID</label>
                      <p className="mt-1 text-sm text-gray-900">{booking.sourceReservationId}</p>
                    </div>
                    {booking.commissionAmount && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Commission</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatCurrency(booking.commissionAmount, booking.currency)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Timeline</h2>
              <BookingTimeline
                auditLogs={booking.bookingAuditLogs || []}
                payments={booking.payments || []}
              />
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Payments</h2>
              <BookingPayments
                payments={booking.payments || []}
                outstandingBalance={outstandingBalance}
                currency={booking.currency}
                onChargeCard={() => {
                  setChargeCardModalOpen(true);
                }}
                onRecordCash={() => {
                  setRecordCashModalOpen(true);
                }}
                onIssueRefund={(paymentId) => {
                  setSelectedPayment(paymentId);
                  setIssueRefundModalOpen(true);
                }}
              />
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
              <BookingNotes
                booking={booking}
                onUpdate={handleModalSuccess}
              />
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['PENDING', 'CONFIRMED'].includes(booking.status) && (
                  <button
                    onClick={() => handleAction('modify', booking)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Modify Booking
                  </button>
                )}
                {booking.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleAction('check-in', booking)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Check-in
                  </button>
                )}
                {booking.status === 'CHECKED_IN' && (
                  <button
                    onClick={() => handleAction('check-out', booking)}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                  >
                    Check-out
                  </button>
                )}
                {['PENDING', 'CONFIRMED'].includes(booking.status) && (
                  <button
                    onClick={() => handleAction('cancel', booking)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {booking && (
        <>
          <ModifyBookingModal
            booking={booking}
            isOpen={modifyModalOpen}
            onClose={() => setModifyModalOpen(false)}
            onSuccess={handleModalSuccess}
          />
          <CheckInModal
            booking={booking}
            isOpen={checkInModalOpen}
            onClose={() => setCheckInModalOpen(false)}
            onSuccess={handleModalSuccess}
          />
          <CheckOutModal
            booking={booking}
            isOpen={checkOutModalOpen}
            onClose={() => setCheckOutModalOpen(false)}
            onSuccess={handleModalSuccess}
          />
          <CancelBookingModal
            booking={booking}
            isOpen={cancelModalOpen}
            onClose={() => setCancelModalOpen(false)}
            onSuccess={handleModalSuccess}
          />
          <ChargeCardModal
            booking={booking}
            isOpen={chargeCardModalOpen}
            onClose={() => setChargeCardModalOpen(false)}
            onSuccess={handleModalSuccess}
          />
          <RecordCashModal
            booking={booking}
            isOpen={recordCashModalOpen}
            onClose={() => setRecordCashModalOpen(false)}
            onSuccess={handleModalSuccess}
          />
          {selectedPayment && booking.payments && (
            <IssueRefundModal
              booking={booking}
              payment={booking.payments.find(p => p.id === selectedPayment)!}
              isOpen={issueRefundModalOpen}
              onClose={() => {
                setIssueRefundModalOpen(false);
                setSelectedPayment(null);
              }}
              onSuccess={handleModalSuccess}
            />
          )}
        </>
      )}
    </div>
  );
}

