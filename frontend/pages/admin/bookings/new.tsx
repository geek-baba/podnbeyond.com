/**
 * Create Booking Page
 * Allows staff to create new bookings
 */

import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../lib/useAuth';
import AdminShell, { BreadcrumbItem } from '../../../components/layout/AdminShell';
import PageHeader from '../../../components/layout/PageHeader';
import Container from '../../../components/layout/Container';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import CreateBookingForm from '../../../components/booking/CreateBookingForm';

export default function CreateBookingPage() {
  const router = useRouter();
  const { data: session, status: authStatus, signOut } = useAuth();

  // Check authentication
  React.useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [authStatus, router]);

  const handleSuccess = (bookingId: number) => {
    router.push(`/admin/bookings/${bookingId}`);
  };

  const handleCancel = () => {
    router.push('/admin/bookings');
  };

  // Show loading state
  if (authStatus === 'loading' || authStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminShell
      title="Create Booking | POD N BEYOND Admin"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Bookings', href: '/admin/bookings' },
        { label: 'Create Booking' },
      ]}
    >
      <PageHeader
        title="Create Booking"
        subtitle="Create a new booking for walk-in, phone, or OTA"
        secondaryActions={
          <>
            <a href="/admin/bookings">
              <Button variant="secondary" size="sm">All Bookings</Button>
            </a>
            <a href="/admin/bookings/calendar">
              <Button variant="secondary" size="sm">Calendar View</Button>
            </a>
          </>
        }
      />

      <Container>
        <Card variant="default" padding="lg">
          <CreateBookingForm onSuccess={handleSuccess} onCancel={handleCancel} />
        </Card>
      </Container>
    </AdminShell>
  );
}

