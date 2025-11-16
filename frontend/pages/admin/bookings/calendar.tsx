/**
 * Booking Calendar View Page
 * Displays bookings in a calendar format for easy visual management
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../lib/useAuth';
import AdminShell, { BreadcrumbItem } from '../../../components/layout/AdminShell';
import PageHeader from '../../../components/layout/PageHeader';
import Container from '../../../components/layout/Container';
import Button from '../../../components/ui/Button';
import {
  getBookings,
  Booking,
  BookingListResponse,
  formatDate,
  formatCurrency,
  getStatusColor,
  getSourceColor,
} from '../../../lib/booking';

export default function BookingCalendarPage() {
  const router = useRouter();
  const { status: authStatus } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedProperty, setSelectedProperty] = useState<number | ''>('');
  const [properties, setProperties] = useState<Array<{ id: number; name: string }>>([]);

  // Check authentication
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [authStatus, router]);

  // Fetch bookings for the current month
  useEffect(() => {
    const fetchBookings = async () => {
      if (authStatus !== 'authenticated') return;

      try {
        setLoading(true);
        setError(null);

        // Calculate date range for current month
        const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        const filters: any = {
          checkInFrom: firstDay.toISOString().split('T')[0],
          checkInTo: lastDay.toISOString().split('T')[0],
          page: 1,
          limit: 500, // Get all bookings for the month
        };

        if (selectedProperty) {
          filters.propertyId = Number(selectedProperty);
        }

        const response: BookingListResponse = await getBookings(filters);
        if (response.success && response.data) {
          setBookings(response.data.bookings);
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
  }, [currentMonth, selectedProperty, authStatus]);

  // Load properties
  useEffect(() => {
    const loadProperties = async () => {
      try {
        const response = await fetch('/api/properties', {
          credentials: 'include',
        });
        const data = await response.json();
        if (data.success && data.properties) {
          setProperties(data.properties.map((p: any) => ({ id: p.id, name: p.name })));
        }
      } catch (err) {
        console.error('Failed to load properties:', err);
      }
    };

    if (authStatus === 'authenticated') {
      loadProperties();
    }
  }, [authStatus]);

  // Navigate months
  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Generate calendar days
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter((booking) => {
      const checkIn = new Date(booking.checkIn).toISOString().split('T')[0];
      const checkOut = new Date(booking.checkOut).toISOString().split('T')[0];
      return dateStr >= checkIn && dateStr < checkOut;
    });
  };

  // Check if date is today
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Format month/year for display
  const monthYearString = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Show loading / unauthenticated state
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

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Bookings', href: '/admin/bookings' },
    { label: 'Booking Calendar' },
  ];

  return (
    <AdminShell
      title="Booking Calendar | POD N BEYOND Admin"
      breadcrumbs={breadcrumbs}
    >
      <PageHeader
        title="Booking Calendar"
        subtitle="Visual calendar view of all bookings"
        secondaryActions={
          <>
            <a href="/admin/bookings">
              <Button variant="secondary" size="sm">
                All Bookings
              </Button>
            </a>
            <a href="/admin/bookings/new">
              <Button size="sm">
                Create Booking
              </Button>
            </a>
          </>
        }
      />

      <Container>
          {/* Calendar Controls */}
          <div className="bg-white shadow-card rounded-card p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={previousMonth}
                  className="px-4 py-2 border border-neutral-300 rounded-button hover:bg-neutral-50 text-neutral-700"
                >
                  ← Previous
                </button>
                <h2 className="text-2xl font-bold text-neutral-900">{monthYearString}</h2>
                <button
                  onClick={nextMonth}
                  className="px-4 py-2 border border-neutral-300 rounded-button hover:bg-neutral-50 text-neutral-700"
                >
                  Next →
                </button>
                <button
                  onClick={goToToday}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Today
                </button>
              </div>

              {/* Property Filter */}
              {properties.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Property</label>
                  <select
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value ? Number(e.target.value) : '')}
                    className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Properties</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
              <p className="mt-2 text-neutral-600">Loading calendar...</p>
            </div>
          )}

          {/* Calendar Grid */}
          {!loading && !error && (
            <div className="bg-white shadow-card rounded-card overflow-hidden">
              {/* Calendar Header - Days of week */}
              <div className="grid grid-cols-7 border-b border-neutral-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="px-4 py-3 text-center text-sm font-semibold text-neutral-700 bg-neutral-50"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7">
                {getCalendarDays().map((date, index) => {
                  const dayBookings = getBookingsForDate(date);
                  const isTodayDate = isToday(date);

                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] border-b border-r border-neutral-200 p-2 ${
                        !date ? 'bg-neutral-50' : isTodayDate ? 'bg-blue-50' : 'bg-white'
                      } ${date ? 'hover:bg-neutral-50' : ''}`}
                    >
                      {date && (
                        <>
                          <div className={`text-sm font-semibold mb-1 ${isTodayDate ? 'text-blue-600' : 'text-neutral-900'}`}>
                            {date.getDate()}
                          </div>
                          <div className="space-y-1 max-h-[80px] overflow-y-auto">
                            {dayBookings.slice(0, 3).map((booking) => (
                              <div
                                key={booking.id}
                                onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                                className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${getStatusColor(booking.status)}`}
                                title={`${booking.guestName} - ${booking.property?.name || 'Unknown Property'}`}
                              >
                                <div className="truncate font-medium">{booking.guestName}</div>
                                <div className="truncate text-xs opacity-75">
                                  {booking.property?.name || 'Unknown'}
                                </div>
                              </div>
                            ))}
                            {dayBookings.length > 3 && (
                              <div className="text-xs text-neutral-500 font-medium">
                                +{dayBookings.length - 3} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legend */}
          {!loading && !error && (
            <div className="mt-6 bg-white shadow-card rounded-card p-4">
              <h3 className="text-sm font-semibold text-neutral-700 mb-2">Legend</h3>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded"></div>
                  <span>Today</span>
                </div>
                {['CONFIRMED', 'CHECKED_IN', 'PENDING'].map((status) => (
                  <div key={status} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${getStatusColor(status as any)}`}></div>
                    <span>{status.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Container>
    </AdminShell>
  );
}

