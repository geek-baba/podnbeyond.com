/**
 * Booking Detail Page
 * Displays detailed information about a booking with tabs for summary, timeline, payments, notes, and actions
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminShell, { BreadcrumbItem } from '../../../components/layout/AdminShell';
import PageHeader from '../../../components/layout/PageHeader';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/Tabs';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import { useToast } from '../../../components/ui/toast';
import {
  getBooking,
  Booking,
  BookingDetailResponse,
  formatDate,
  formatDateTime,
  formatCurrency,
  calculateOutstandingBalance,
  updateBooking,
  confirmBooking,
  holdBooking,
  duplicateBooking,
} from '../../../lib/booking';
import {
  mapBookingStatusToBadgeVariant,
  mapBookingSourceToBadgeVariant,
} from '../../../lib/badge-mappers';
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
  const { toast } = useToast();
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
  const [confirmBookingModalOpen, setConfirmBookingModalOpen] = useState(false);
  const [duplicateBookingModalOpen, setDuplicateBookingModalOpen] = useState(false);
  const [holdBookingModalOpen, setHoldBookingModalOpen] = useState(false);
  const [holdExpiresAtInput, setHoldExpiresAtInput] = useState<string>('');
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);

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
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
          <p className="mt-2 text-neutral-600">Loading booking...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Booking not found'}</p>
          <Button
            onClick={() => router.push('/admin/bookings')}
            variant="primary"
            size="sm"
            className="mt-4"
          >
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  const outstandingBalance = calculateOutstandingBalance(booking);

  const handleAction = async (action: string, booking: Booking) => {
    setPendingBooking(booking);

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
      case 'confirm':
        setConfirmBookingModalOpen(true);
        break;
      case 'hold':
        setHoldBookingModalOpen(true);
        break;
      case 'duplicate':
        setDuplicateBookingModalOpen(true);
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

  const handleConfirmBooking = async () => {
    if (!pendingBooking) return;

    try {
      await confirmBooking(pendingBooking.id);
      toast({
        variant: 'success',
        title: 'Booking confirmed',
        message: 'The booking has been confirmed successfully',
        duration: 5000,
      });
      setConfirmBookingModalOpen(false);
      await handleModalSuccess();
    } catch (err: any) {
      toast({
        variant: 'error',
        title: 'Failed to confirm booking',
        message: err.message,
      });
    }
  };

  const handleHoldBooking = async () => {
    if (!pendingBooking) return;

    try {
      await holdBooking(pendingBooking.id, {
        holdExpiresAt: holdExpiresAtInput || undefined,
        notes: 'Booking placed on hold by staff',
      });
      toast({
        variant: 'warning',
        title: 'Booking held',
        message: 'This booking is now on hold',
        duration: 4000,
      });
      setHoldBookingModalOpen(false);
      setHoldExpiresAtInput('');
      await handleModalSuccess();
    } catch (err: any) {
      toast({
        variant: 'error',
        title: 'Failed to hold booking',
        message: err.message,
      });
    }
  };

  const handleDuplicateBooking = async () => {
    if (!pendingBooking) return;

    try {
      const response = await duplicateBooking(pendingBooking.id);
      if (response.success && response.data) {
        toast({
          variant: 'success',
          title: 'Booking duplicated',
          message: 'A copy of this booking has been created',
        });
        setDuplicateBookingModalOpen(false);
        router.push(`/admin/bookings/${response.data.id}`);
      }
    } catch (err: any) {
      toast({
        variant: 'error',
        title: 'Failed to duplicate booking',
        message: err.message,
      });
    }
  };

  if (!booking) {
    return null; // Loading/error states handled above
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Bookings', href: '/admin/bookings' },
    { label: `Booking #${booking.confirmationNumber || booking.id}` },
  ];

  return (
    <AdminShell
      title={`Booking #${booking.confirmationNumber || booking.id} | POD N BEYOND Admin`}
      breadcrumbs={breadcrumbs}
    >
      <PageHeader
        title={`Booking #${booking.confirmationNumber || booking.id}`}
        subtitle={`${booking.guestName} • ${booking.email}`}
        secondaryActions={
          <>
            <Badge variant={mapBookingStatusToBadgeVariant(booking.status)} size="md">
              {booking.status.replace(/_/g, ' ')}
            </Badge>
            <Badge variant={mapBookingSourceToBadgeVariant(booking.source)} size="md">
              {booking.source.replace(/_/g, ' ')}
            </Badge>
          </>
        }
      />

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <Card variant="default" padding="lg">
            <TabsContent value="summary">
            <div className="space-y-6">
              {/* Guest Details */}
              <div>
                <h2 className="text-lg font-medium text-neutral-900 mb-4">Guest Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-500">Name</label>
                    <p className="mt-1 text-sm text-neutral-900">{booking.guestName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-500">Email</label>
                    <p className="mt-1 text-sm text-neutral-900">{booking.email}</p>
                  </div>
                  {booking.phone && (
                    <div>
                      <label className="text-sm font-medium text-neutral-500">Phone</label>
                      <p className="mt-1 text-sm text-neutral-900">{booking.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stay Details */}
              <div>
                <h2 className="text-lg font-medium text-neutral-900 mb-4">Stay Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-500">Property</label>
                    <p className="mt-1 text-sm text-neutral-900">{booking.property?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-500">Room Type</label>
                    <p className="mt-1 text-sm text-neutral-900">{booking.roomType?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-500">Check-in</label>
                    <p className="mt-1 text-sm text-neutral-900">{formatDate(booking.checkIn)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-500">Check-out</label>
                    <p className="mt-1 text-sm text-neutral-900">{formatDate(booking.checkOut)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-500">Guests</label>
                    <p className="mt-1 text-sm text-neutral-900">{booking.guests}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-500">Rooms</label>
                    <p className="mt-1 text-sm text-neutral-900">{booking.rooms}</p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h2 className="text-lg font-medium text-neutral-900 mb-4">Pricing</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-500">Total Price</label>
                    <p className="mt-1 text-sm font-medium text-neutral-900">
                      {formatCurrency(booking.totalPrice, booking.currency)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-500">Outstanding Balance</label>
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
                  <h2 className="text-lg font-medium text-neutral-900 mb-4">Source Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-neutral-500">Source Reservation ID</label>
                      <p className="mt-1 text-sm text-neutral-900">{booking.sourceReservationId}</p>
                    </div>
                    {booking.commissionAmount && (
                      <div>
                        <label className="text-sm font-medium text-neutral-500">Commission</label>
                        <p className="mt-1 text-sm text-neutral-900">
                          {formatCurrency(booking.commissionAmount, booking.currency)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            </TabsContent>

            <TabsContent value="timeline">
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-neutral-900 mb-4">Timeline</h2>
                <BookingTimeline
                  auditLogs={booking.bookingAuditLogs || []}
                  payments={booking.payments || []}
                />
              </div>
            </TabsContent>

            <TabsContent value="payments">
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-neutral-900 mb-4">Payments</h2>
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
            </TabsContent>

            <TabsContent value="notes">
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-neutral-900 mb-4">Notes</h2>
                <BookingNotes
                  booking={booking}
                  onUpdate={handleModalSuccess}
                />
              </div>
            </TabsContent>

            <TabsContent value="actions">
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-neutral-900 mb-4">Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Status-based actions */}
                {booking.status === 'PENDING' && (
                  <Button
                    onClick={() => handleAction('confirm', booking)}
                    variant="primary"
                    size="sm"
                  >
                    ✓ Confirm Booking
                  </Button>
                )}
                {['PENDING', 'CONFIRMED'].includes(booking.status) && (
                  <>
                    <Button
                      onClick={() => handleAction('modify', booking)}
                      variant="primary"
                      size="sm"
                    >
                      ✏️ Modify Booking
                    </Button>
                    <Button
                      onClick={() => handleAction('hold', booking)}
                      variant="secondary"
                      size="sm"
                    >
                      ⏸️ Hold Booking
                    </Button>
                    <Button
                      onClick={() => handleAction('cancel', booking)}
                      variant="primary"
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      ✕ Cancel Booking
                    </Button>
                  </>
                )}
                {booking.status === 'CONFIRMED' && (
                  <Button
                    onClick={() => handleAction('check-in', booking)}
                    variant="primary"
                    size="sm"
                  >
                    🔑 Check-in
                  </Button>
                )}
                {booking.status === 'CHECKED_IN' && (
                  <Button
                    onClick={() => handleAction('check-out', booking)}
                    variant="primary"
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    🚪 Check-out
                  </Button>
                )}
                
                {/* Always available actions */}
                <Button
                  onClick={() => handleAction('duplicate', booking)}
                  variant="secondary"
                  size="sm"
                >
                  📋 Duplicate Booking
                </Button>
              </div>

              {/* Help text */}
              <div className="mt-6 p-4 bg-neutral-50 rounded-md">
                <p className="text-sm text-neutral-600">
                  <strong>Available Actions:</strong> Actions are shown based on the booking status. 
                  Duplicate booking creates a copy with new dates starting from today. 
                  Hold booking temporarily reserves the booking without full confirmation.
                </p>
              </div>
            </div>
            </TabsContent>
          </Card>
        </Tabs>

        {/* Confirm Booking Modal */}
        <Modal
          open={confirmBookingModalOpen}
          onClose={() => setConfirmBookingModalOpen(false)}
        >
          <ModalHeader
            title="Confirm booking"
            subtitle="Are you sure you want to confirm this booking?"
            onClose={() => setConfirmBookingModalOpen(false)}
          />
          <ModalBody>
            <p className="text-sm text-neutral-600">
              This will move the booking into a confirmed state and may trigger guest communication and payment workflows.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmBookingModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmBooking}
            >
              Confirm booking
            </Button>
          </ModalFooter>
        </Modal>

        {/* Hold Booking Modal */}
        <Modal
          open={holdBookingModalOpen}
          onClose={() => {
            setHoldBookingModalOpen(false);
            setHoldExpiresAtInput('');
          }}
        >
          <ModalHeader
            title="Place booking on hold"
            subtitle="Optionally set a hold expiration date."
            onClose={() => {
              setHoldBookingModalOpen(false);
              setHoldExpiresAtInput('');
            }}
          />
          <ModalBody>
            <div className="space-y-3">
              <p className="text-sm text-neutral-600">
                You can place this booking on hold. Optionally, set a hold expiration date. Leave blank for no expiration.
              </p>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Hold expiration date (YYYY-MM-DD)
                </label>
                <Input
                  type="date"
                  value={holdExpiresAtInput}
                  onChange={(e) => setHoldExpiresAtInput(e.target.value)}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setHoldBookingModalOpen(false);
                setHoldExpiresAtInput('');
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleHoldBooking}
            >
              Place on hold
            </Button>
          </ModalFooter>
        </Modal>

        {/* Duplicate Booking Modal */}
        <Modal
          open={duplicateBookingModalOpen}
          onClose={() => setDuplicateBookingModalOpen(false)}
        >
          <ModalHeader
            title="Duplicate booking"
            subtitle="Create a copy of this booking."
            onClose={() => setDuplicateBookingModalOpen(false)}
          />
          <ModalBody>
            <p className="text-sm text-neutral-600">
              This will create a new booking with the same guest, dates, and details. You can modify the duplicate after it is created.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDuplicateBookingModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDuplicateBooking}
            >
              Create duplicate
            </Button>
          </ModalFooter>
        </Modal>

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
    </AdminShell>
  );
}

