import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';

// Types for loyalty data
interface LoyaltyAccount {
  id: number;
  userId: string;
  points: number;
  tier: 'SILVER' | 'GOLD' | 'PLATINUM';
  lastUpdated: string;
  createdAt: string;
  bookings: Booking[];
  redemptionHistory: RedemptionHistory[];
}

interface Booking {
  id: number;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: string;
  roomName: string;
  roomType: string;
  createdAt: string;
}

interface RedemptionHistory {
  id: number;
  date: string;
  type: string;
  description: string;
  pointsEarned: number;
  amount: number;
  status: string;
}

const LoyaltyPage: React.FC = () => {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');

  // For demo purposes, you can change this to any userId
  const demoUserId = 'demo-user-123';

  useEffect(() => {
    // Set demo userId for testing
    setUserId(demoUserId);
  }, []);

  useEffect(() => {
    if (userId) {
      fetchLoyaltyData();
    }
  }, [userId]);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/loyalty/${userId}`);
      
      if (response.data.success) {
        setLoyaltyData(response.data.account);
      } else {
        setError('Failed to fetch loyalty data');
      }
    } catch (error: any) {
      console.error('Error fetching loyalty data:', error);
      setError(error.response?.data?.error || 'Failed to fetch loyalty data');
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM':
        return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
      case 'GOLD':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 'SILVER':
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'PLATINUM':
        return '💎';
      case 'GOLD':
        return '🥇';
      case 'SILVER':
        return '🥈';
      default:
        return '⭐';
    }
  };

  const getTierBenefits = (tier: string) => {
    switch (tier) {
      case 'PLATINUM':
        return [
          '3x points on all bookings',
          '50% discount on room upgrades',
          'Free late checkout',
          'Priority customer support',
          'Exclusive member events'
        ];
      case 'GOLD':
        return [
          '2x points on all bookings',
          '25% discount on room upgrades',
          'Free early check-in',
          'Dedicated customer support'
        ];
      case 'SILVER':
        return [
          '1x points on all bookings',
          '10% discount on room upgrades',
          'Standard customer support'
        ];
      default:
        return ['Standard benefits'];
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loyalty Program - Pod & Beyond Hotel</title>
          <meta name="description" content="View your loyalty points, tier status, and redemption history" />
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your loyalty information...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Loyalty Program - Pod & Beyond Hotel</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Loyalty Data</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchLoyaltyData}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!loyaltyData) {
    return (
      <>
        <Head>
          <title>Loyalty Program - Pod & Beyond Hotel</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Loyalty Data Found</h2>
            <p className="text-gray-600">Unable to load your loyalty information.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Loyalty Program - Pod & Beyond Hotel</title>
        <meta name="description" content="View your loyalty points, tier status, and redemption history" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Loyalty Program</h1>
                <p className="text-gray-600 mt-1">Track your rewards and benefits</p>
              </div>
              <a
                href="/"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                ← Back to Home
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Current Tier and Points */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Current Tier Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Current Tier</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTierColor(loyaltyData.tier)}`}>
                  {getTierIcon(loyaltyData.tier)} {loyaltyData.tier}
                </span>
              </div>
              <div className="space-y-3">
                {getTierBenefits(loyaltyData.tier).map((benefit, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-600">
                    <span className="text-green-500 mr-2">✓</span>
                    {benefit}
                  </div>
                ))}
              </div>
            </div>

            {/* Points Balance Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Points Balance</h2>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {loyaltyData.points.toLocaleString()}
                </div>
                <p className="text-gray-600">Total Points</p>
                <div className="mt-4 text-sm text-gray-500">
                  Last updated: {formatDate(loyaltyData.lastUpdated)}
                </div>
              </div>
            </div>

            {/* Account Info Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Info</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">User ID:</span>
                  <span className="ml-2 font-mono text-gray-900">{loyaltyData.userId}</span>
                </div>
                <div>
                  <span className="text-gray-500">Member since:</span>
                  <span className="ml-2 text-gray-900">{formatDate(loyaltyData.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total bookings:</span>
                  <span className="ml-2 text-gray-900">{loyaltyData.bookings.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Redemption History */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Redemption History</h2>
              <p className="text-gray-600 mt-1">Your recent points earnings and redemptions</p>
            </div>
            
            <div className="overflow-x-auto">
              {loyaltyData.redemptionHistory.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points Earned
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loyaltyData.redemptionHistory.map((redemption) => (
                      <tr key={redemption.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(redemption.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {redemption.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {redemption.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          +{redemption.pointsEarned}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(redemption.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            redemption.status === 'CONFIRMED' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {redemption.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Redemption History</h3>
                  <p className="text-gray-600">Start earning points by making your first booking!</p>
                  <a
                    href="/"
                    className="inline-block mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Book Now
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Recent Bookings */}
          {loyaltyData.bookings.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
                <p className="text-gray-600 mt-1">Your booking history</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Booking ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Room
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-in
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-out
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loyaltyData.bookings.slice(0, 5).map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{booking.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{booking.roomName}</div>
                            <div className="text-gray-500">{booking.roomType}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(booking.checkIn)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(booking.checkOut)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(booking.totalPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            booking.status === 'CONFIRMED' 
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LoyaltyPage;
