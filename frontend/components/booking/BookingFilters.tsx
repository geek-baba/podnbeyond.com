/**
 * Booking Filters Component
 * Provides filters for booking list (date range, status, source, property, search)
 */

import React, { useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import SelectNative from '../ui/SelectNative';
import FormField from '../ui/FormField';
import DateRangePicker from '../ui/DateRangePicker';
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
    <Card variant="default" padding="md" className="mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Search */}
        <FormField label="Search">
          <Input
            type="text"
            placeholder="Name, email, confirmation number..."
            value={localFilters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
          />
        </FormField>

        {/* Property */}
        {properties.length > 0 && (
          <FormField label="Property">
            <SelectNative
              value={localFilters.propertyId || ''}
              onChange={(e) => handleFilterChange('propertyId', e.target.value ? parseInt(e.target.value) : undefined)}
            >
              <option value="">All Properties</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </SelectNative>
          </FormField>
        )}

        {/* Status */}
        <FormField label="Status">
          <SelectNative
            value={localFilters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
          >
            <option value="">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </option>
            ))}
          </SelectNative>
        </FormField>

        {/* Source */}
        <FormField label="Source">
          <SelectNative
            value={localFilters.source || ''}
            onChange={(e) => handleFilterChange('source', e.target.value || undefined)}
          >
            <option value="">All Sources</option>
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {source.replace(/_/g, ' ')}
              </option>
            ))}
          </SelectNative>
        </FormField>

        {/* Check-in Date Range */}
        <FormField label="Check-in Date Range">
          <DateRangePicker
            value={[localFilters.checkInFrom, localFilters.checkInTo]}
            onChange={([from, to]) => {
              handleFilterChange('checkInFrom', from);
              handleFilterChange('checkInTo', to);
            }}
            startPlaceholder="From"
            endPlaceholder="To"
            variant="separate"
            enforceRange={true}
          />
        </FormField>

        {/* Check-out Date Range */}
        <FormField label="Check-out Date Range">
          <DateRangePicker
            value={[localFilters.checkOutFrom, localFilters.checkOutTo]}
            onChange={([from, to]) => {
              handleFilterChange('checkOutFrom', from);
              handleFilterChange('checkOutTo', to);
            }}
            startPlaceholder="From"
            endPlaceholder="To"
            variant="separate"
            enforceRange={true}
          />
        </FormField>
      </div>

      {/* Reset Button */}
      <div className="mt-4 flex justify-end">
        <Button
          onClick={handleReset}
          variant="secondary"
          size="sm"
        >
          Reset Filters
        </Button>
      </div>
    </Card>
  );
}

