import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Booking {
  id: number;
  guestName: string;
  email: string;
  phone?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  roomType: string;
  createdAt: string;
  externalBookingId?: string;
  externalChannel?: string;
}

interface Room {
  id: number;
  type: string;
  price: number;
  capacity: number;
  createdAt: string;
}

interface LoyaltyAccount {
  id: number;
  guestName: string;
  email: string;
  phone?: string;
  pointsBalance: number;
  tier: 'SILVER' | 'GOLD' | 'PLATINUM';
  lastActivityDate: string;
  totalSpent: number;
  totalBookings: number;
  isActive: boolean;
}

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'rooms' | 'loyalty'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loyaltyAccounts, setLoyaltyAccounts] = useState<LoyaltyAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      switch (activeTab) {
        case 'bookings':
          const bookingsResponse = await axios.get('/api/booking/bookings');
          setBookings(bookingsResponse.data.bookings || []);
          break;
        case 'rooms':
          const roomsResponse = await axios.get('/api/booking/rooms');
          setRooms(roomsResponse.data.rooms || []);
          break;
        case 'loyalty':
          const loyaltyResponse = await axios.get('/api/loyalty/accounts');
          setLoyaltyAccounts(loyaltyResponse.data.accounts || []);
          break;
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM':
        return 'bg-purple-100 text-purple-800';
      case 'GOLD':
        return 'bg-yellow-100 text-yellow-800';
      case 'SILVER':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'bookings', name: 'Bookings', icon: '📋' },
    { id: 'rooms', name: 'Rooms', icon: '🏨' },
    { id: 'loyalty', name: 'Loyalty Accounts', icon: '⭐' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage bookings, rooms, and loyalty accounts</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-500 text-lg mb-2">⚠️</div>
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchData}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="p-6">
              {/* Bookings Tab */}
              {activeTab === 'bookings' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">All Bookings</h2>
                    <div className="text-sm text-gray-500">
                      {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  {bookings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📋</div>
                      <p>No bookings found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Guest
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Room
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Dates
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Source
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {bookings.map((booking) => (
                            <tr key={booking.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {booking.guestName}
                                  </div>
                                  <div className="text-sm text-gray-500">{booking.email}</div>
                                  {booking.phone && (
                                    <div className="text-sm text-gray-500">{booking.phone}</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{booking.roomType}</div>
                                <div className="text-sm text-gray-500">{booking.guests} guest{booking.guests !== 1 ? 's' : ''}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatDate(booking.checkIn)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  to {formatDate(booking.checkOut)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(booking.totalPrice)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                                  {booking.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {booking.externalChannel ? (
                                  <div>
                                    <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      {booking.externalChannel}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                      {booking.externalBookingId}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">Direct</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Rooms Tab */}
              {activeTab === 'rooms' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Room Inventory</h2>
                    <div className="text-sm text-gray-500">
                      {rooms.length} room{rooms.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  {rooms.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🏨</div>
                      <p>No rooms found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {rooms.map((room) => (
                        <div key={room.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">{room.type}</h3>
                            <span className="text-2xl">🏨</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Price per night:</span>
                              <span className="font-semibold text-gray-900">{formatCurrency(room.price)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Capacity:</span>
                              <span className="font-semibold text-gray-900">{room.capacity} guest{room.capacity !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Added:</span>
                              <span className="text-sm text-gray-500">{formatDate(room.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Loyalty Accounts Tab */}
              {activeTab === 'loyalty' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Loyalty Accounts</h2>
                    <div className="text-sm text-gray-500">
                      {loyaltyAccounts.length} account{loyaltyAccounts.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  {loyaltyAccounts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">⭐</div>
                      <p>No loyalty accounts found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Guest
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tier
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Points
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Spent
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Bookings
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Last Activity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {loyaltyAccounts.map((account) => (
                            <tr key={account.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {account.guestName}
                                  </div>
                                  <div className="text-sm text-gray-500">{account.email}</div>
                                  {account.phone && (
                                    <div className="text-sm text-gray-500">{account.phone}</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTierColor(account.tier)}`}>
                                  {account.tier}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-900">
                                  {account.pointsBalance.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">points</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(account.totalSpent)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {account.totalBookings}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(account.lastActivityDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  account.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {account.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 