/**
 * Booking List Page
 * Displays a list of bookings with filters, pagination, and actions
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../lib/useAuth';
import AdminShell, { BreadcrumbItem } from '../../../components/layout/AdminShell';
import PageHeader from '../../../components/layout/PageHeader';
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

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Bookings' },
  ];

  return (
    <AdminShell
      title="Bookings | POD N BEYOND Admin"
      breadcrumbs={breadcrumbs}
    >
      <PageHeader
        title="Bookings"
        subtitle="Manage all bookings across properties"
        primaryAction={
          <a href="/admin/bookings/new">
            <Button>Create Booking</Button>
          </a>
        }
        secondaryActions={
          <>
            <a href="/admin/bookings/calendar">
              <Button variant="secondary" size="sm">Calendar View</Button>
            </a>
          </>
        }
      />

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
    </AdminShell>
  );
}

