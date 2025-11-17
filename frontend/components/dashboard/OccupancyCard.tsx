import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import { getBookings } from '../../lib/booking';

export default function OccupancyCard() {
  const [occupancy, setOccupancy] = useState<{
    total: number;
    occupied: number;
    percentage: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOccupancy = async () => {
      try {
        setLoading(true);
        // Fetch checked-in bookings for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [checkedInResponse, confirmedResponse] = await Promise.all([
          getBookings({
            status: 'CHECKED_IN',
            limit: 1000, // Get all for count
          }),
          getBookings({
            checkInFrom: today.toISOString(),
            checkInTo: tomorrow.toISOString(),
            status: 'CONFIRMED',
            limit: 1000,
          }),
        ]);

        // Simplified occupancy calculation
        // In a real system, this would query room inventory
        const checkedIn = checkedInResponse.success && checkedInResponse.data
          ? checkedInResponse.data.total || 0
          : 0;
        const confirmed = confirmedResponse.success && confirmedResponse.data
          ? confirmedResponse.data.total || 0
          : 0;

        // Estimate: assume 50 rooms total (this should come from property config)
        const totalRooms = 50;
        const occupied = checkedIn;
        const percentage = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0;

        setOccupancy({
          total: totalRooms,
          occupied,
          percentage,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load occupancy');
      } finally {
        setLoading(false);
      }
    };

    fetchOccupancy();
  }, []);

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      </Card>
    );
  }

  if (error || !occupancy) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Occupancy</h3>
          <p className="text-sm text-neutral-500">{error || 'No data available'}</p>
        </div>
      </Card>
    );
  }

  const getOccupancyVariant = (percentage: number): 'success' | 'warning' | 'error' => {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Occupancy</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-600">Occupied rooms</span>
              <Badge variant={getOccupancyVariant(occupancy.percentage)}>
                {occupancy.percentage}%
              </Badge>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  occupancy.percentage >= 80
                    ? 'bg-green-500'
                    : occupancy.percentage >= 50
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(occupancy.percentage, 100)}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-2xl font-bold text-neutral-900">{occupancy.occupied}</p>
              <p className="text-xs text-neutral-500">Occupied</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{occupancy.total}</p>
              <p className="text-xs text-neutral-500">Total rooms</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

