/**
 * Create Booking Page
 * Allows staff to create new bookings
 */

import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../lib/useAuth';
import Head from 'next/head';
import Header from '../../../components/layout/Header';
import Container from '../../../components/layout/Container';
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
    <div className="min-h-screen bg-neutral-50">
      <Head>
        <title>Create Booking | POD N BEYOND Admin</title>
        <meta name="description" content="Create a new booking" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      {/* Admin Header */}
      <section className="pt-24 pb-6 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
        <Container>
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            {/* Left: User Info */}
            <div className="flex items-start gap-6">
              <div className="flex items-center gap-4">
                <div className="text-left">
                  <p className="text-xs text-neutral-400 uppercase tracking-wide">Signed in as</p>
                  <p className="text-white font-semibold text-sm mt-0.5">
                    {session?.user?.email || 'Not signed in'}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {(session as any)?.user?.roles?.[0]?.key?.replace(/_/g, ' ') || 'MEMBER'}
                  </p>
                </div>
                <div className="h-12 w-px bg-neutral-700"></div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-button text-sm font-semibold hover:bg-white hover:text-neutral-900 transition-all"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Right: Title */}
            <div className="text-right">
              <h1 className="text-3xl font-bold mb-1">Create Booking</h1>
              <p className="text-neutral-300 text-sm">Create a new booking for walk-in, phone, or OTA</p>
            </div>
          </div>

          {/* Booking Navigation - Only booking-related actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <a href="/admin/bookings">
              <button className={`px-6 py-2 rounded-button font-semibold transition-all ${
                router.asPath === '/admin/bookings'
                  ? 'bg-white text-neutral-900'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900'
              }`}>
                📋 All Bookings
              </button>
            </a>
            <a href="/admin/bookings/new">
              <button className={`px-6 py-2 rounded-button font-semibold transition-all ${
                router.asPath === '/admin/bookings/new'
                  ? 'bg-white text-neutral-900'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900'
              }`}>
                ➕ Create Booking
              </button>
            </a>
            <a href="/admin/bookings/calendar">
              <button className={`px-6 py-2 rounded-button font-semibold transition-all ${
                router.asPath === '/admin/bookings/calendar'
                  ? 'bg-white text-neutral-900'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900'
              }`}>
                📅 Calendar View
              </button>
            </a>
            <a href="/admin">
              <button className="px-6 py-2 rounded-button font-semibold transition-all bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900">
                ← Admin Dashboard
              </button>
            </a>
          </div>
        </Container>
      </section>

      {/* Content */}
      <section className="py-12">
        <Container>
          <div className="bg-white shadow rounded-lg p-8">
            <CreateBookingForm onSuccess={handleSuccess} onCancel={handleCancel} />
          </div>
        </Container>
      </section>
    </div>
  );
}

