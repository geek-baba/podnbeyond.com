/**
 * Booking Filters Component
 * Provides filters for booking list (date range, status, source, property, search)
 */

import React, { useState } from 'react';
import { BookingFilters as BookingFiltersType, BookingStatus, BookingSource } from '../../lib/booking';

interface BookingFiltersProps {
  filters: BookingFiltersType;
  onFiltersChange: (filters: BookingFiltersType) => void;
  properties?: Array<{ id: number; name: string }>;
}

export default function BookingFilters({ filters, onFiltersChange, properties = [] }: BookingFiltersProps) {
  const [localFilters, setLocalFilters] = useState<BookingFiltersType>(filters);

  const handleFilterChange = (key: keyof BookingFiltersType, value: any) => {
    const newFilters = { ...localFilters, [key]: value, page: 1 }; // Reset to page 1 when filters change
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: BookingFiltersType = { page: 1, limit: 20 };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const statusOptions: BookingStatus[] = [
    'HOLD',
    'PENDING',
    'CONFIRMED',
    'CHECKED_IN',
    'CHECKED_OUT',
    'CANCELLED',
    'NO_SHOW',
    'REJECTED',
  ];

  const sourceOptions: BookingSource[] = [
    'WEB_DIRECT',
    'OTA_BOOKING_COM',
    'OTA_MMT',
    'OTA_GOIBIBO',
    'OTA_YATRA',
    'OTA_AGODA',
    'WALK_IN',
    'PHONE',
    'CORPORATE',
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            placeholder="Name, email, confirmation number..."
            value={localFilters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Property */}
        {properties.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property
            </label>
            <select
              value={localFilters.propertyId || ''}
              onChange={(e) => handleFilterChange('propertyId', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={localFilters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source
          </label>
          <select
            value={localFilters.source || ''}
            onChange={(e) => handleFilterChange('source', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sources</option>
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {source.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Check-in From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Check-in From
          </label>
          <input
            type="date"
            value={localFilters.checkInFrom || ''}
            onChange={(e) => handleFilterChange('checkInFrom', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Check-in To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Check-in To
          </label>
          <input
            type="date"
            value={localFilters.checkInTo || ''}
            onChange={(e) => handleFilterChange('checkInTo', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Check-out From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Check-out From
          </label>
          <input
            type="date"
            value={localFilters.checkOutFrom || ''}
            onChange={(e) => handleFilterChange('checkOutFrom', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Check-out To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Check-out To
          </label>
          <input
            type="date"
            value={localFilters.checkOutTo || ''}
            onChange={(e) => handleFilterChange('checkOutTo', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Reset Button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}

