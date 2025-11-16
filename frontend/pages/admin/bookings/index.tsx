/**
 * Booking List Page
 * Displays a list of bookings with filters, pagination, and actions
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../lib/useAuth';
import Head from 'next/head';
import Header from '../../../components/layout/Header';
import Container from '../../../components/layout/Container';
import BookingFilters from '../../../components/booking/BookingFilters';
import BookingList from '../../../components/booking/BookingList';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import TableContainer from '../../../components/ui/TableContainer';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import Pagination from '../../../components/ui/Pagination';
import {
  getBookings,
  BookingFilters as BookingFiltersType,
  Booking,
  BookingListResponse,
} from '../../../lib/booking';

export default function BookingsPage() {
  const router = useRouter();
  const { data: session, status: authStatus, signOut } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BookingFiltersType>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [properties, setProperties] = useState<Array<{ id: number; name: string }>>([]);

  // Check authentication
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [authStatus, router]);

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response: BookingListResponse = await getBookings(filters);
        if (response.success && response.data) {
          setBookings(response.data.bookings);
          setTotal(response.data.total);
          setTotalPages(response.data.totalPages);
        } else {
          setError('Failed to fetch bookings');
        }
      } catch (err: any) {
        console.error('Error fetching bookings:', err);
        setError(err.message || 'Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [filters]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: BookingFiltersType) => {
    setFilters(newFilters);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  // Handle sorting
  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters({ ...filters, sortBy, sortOrder });
  };

  // Handle actions
  const handleAction = (action: string, booking: Booking) => {
    switch (action) {
      case 'view':
        router.push(`/admin/bookings/${booking.id}`);
        break;
      case 'check-in':
        router.push(`/admin/bookings/${booking.id}?action=check-in`);
        break;
      case 'check-out':
        router.push(`/admin/bookings/${booking.id}?action=check-out`);
        break;
      case 'cancel':
        router.push(`/admin/bookings/${booking.id}?action=cancel`);
        break;
      default:
        console.log('Action not implemented:', action);
    }
  };

  // Show loading state
  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting
  if (authStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
          <p className="text-neutral-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Head>
        <title>Bookings | POD N BEYOND Admin</title>
        <meta name="description" content="Manage bookings" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      {/* Admin Header */}
      <section className="pt-24 pb-6 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
        <Container>
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            {/* Left: User Info and Title */}
            <div className="flex items-start gap-6">
              {/* User Info - Top Left */}
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
              <h1 className="text-3xl font-bold mb-1">Bookings</h1>
              <p className="text-neutral-300 text-sm">Manage all bookings</p>
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

          {/* Filters */}
          <BookingFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            properties={properties}
          />

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <TableContainer>
              <TableSkeleton rows={8} columns={9} />
            </TableContainer>
          )}

          {/* Bookings List */}
          {!loading && !error && (
            <>
              <TableContainer>
                <BookingList bookings={bookings} onAction={handleAction} />
              </TableContainer>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={filters.page || 1}
                    totalPages={totalPages}
                    totalItems={total}
                    itemsPerPage={filters.limit || 20}
                    onPageChange={handlePageChange}
                    showItemCount={true}
                  />
                </div>
              )}
            </>
          )}
        </Container>
      </section>
    </div>
  );
}

