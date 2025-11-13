/**
 * Booking List Page
 * Displays a list of bookings with filters, pagination, and actions
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import BookingFilters from '../../../components/booking/BookingFilters';
import BookingList from '../../../components/booking/BookingList';
import {
  getBookings,
  BookingFilters as BookingFiltersType,
  Booking,
  BookingListResponse,
} from '../../../lib/booking';

export default function BookingsPage() {
  const router = useRouter();
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage all bookings, view details, and perform actions
          </p>
        </div>

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
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Loading bookings...</p>
          </div>
        )}

        {/* Bookings List */}
        {!loading && !error && (
          <>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <BookingList bookings={bookings} onAction={handleAction} />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((filters.page || 1) - 1) * (filters.limit || 20) + 1} to{' '}
                  {Math.min((filters.page || 1) * (filters.limit || 20), total)} of {total} bookings
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange((filters.page || 1) - 1)}
                    disabled={(filters.page || 1) === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange((filters.page || 1) + 1)}
                    disabled={(filters.page || 1) >= totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

