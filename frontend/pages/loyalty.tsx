import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';

// Types for loyalty data
interface TierProgress {
  currentTier: string;
  nextTier: string | null;
  progress: number;
  pointsNeeded: number;
  staysNeeded: number;
  nightsNeeded: number;
  spendNeeded: number;
  isMaxTier: boolean;
}

interface LoyaltyAccount {
  id: number;
  userId: string;
  points: number;
  tier: 'MEMBER' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  lastUpdated: string;
  createdAt: string;
  bookings: Booking[];
  redemptionHistory: RedemptionHistory[];
  activePerks?: ActivePerk[];
  activeCampaigns?: ActiveCampaign[];
  recentRedemptions?: RedemptionTransaction[];
  tierProgress?: TierProgress;
  tierConfig?: {
    name: string;
    description: string;
    basePointsPer100Rupees: number;
    benefits: any;
  };
}

interface RedemptionTransaction {
  id: number;
  pointsRedeemed: number;
  status: string;
  redeemedAt: string;
  expiresAt?: string;
  usedAt?: string;
  item?: {
    id: number;
    code: string;
    name: string;
    description?: string;
    itemType: string;
  };
  booking?: {
    id: number;
    confirmationNumber?: string;
    checkIn?: string;
    checkOut?: string;
  };
}

interface ActiveCampaign {
  id: number;
  name: string;
  description?: string;
  campaignType: string;
  rules: any;
  startDate: string;
  endDate: string;
}

interface ActivePerk {
  id: number;
  redeemedAt: string;
  status: string;
  perk?: {
    id: number;
    code: string;
    name: string;
    description?: string;
    perkType: string;
  };
  booking?: {
    id: number;
    confirmationNumber?: string;
    checkIn?: string;
    checkOut?: string;
  };
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
      
      // First, try to get loyalty account ID from user
      // For now, we'll use a simplified approach - in production, you'd get this from session
      const response = await axios.get(`/api/loyalty/${userId}`);
      
      if (response.data.success) {
        const account = response.data.account;
        // If we have an account ID, fetch the full member profile with perks
        if (account.id) {
          try {
            const profileResponse = await axios.get(`/api/loyalty/member/${account.id}`);
            if (profileResponse.data.success) {
              // Merge profile data with account data
              setLoyaltyData({
                ...account,
                activePerks: profileResponse.data.data?.activePerks || [],
                activeCampaigns: profileResponse.data.data?.activeCampaigns || [],
                recentRedemptions: profileResponse.data.data?.recentRedemptions || [],
                tierProgress: profileResponse.data.data?.tierProgress || null,
                tierConfig: profileResponse.data.data?.tierConfig || null,
              });
            } else {
              setLoyaltyData(account);
            }
          } catch (profileError) {
            // Fallback to account data if profile fetch fails
            setLoyaltyData(account);
          }
        } else {
          setLoyaltyData(account);
        }
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
      case 'MEMBER':
        return 'bg-gradient-to-r from-gray-200 to-gray-400 text-white';
      case 'DIAMOND':
        return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white';
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
      case 'MEMBER':
        return '⭐';
      case 'DIAMOND':
        return '💎';
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
          {/* Hero Section - Tier and Points */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl">
                    {getTierIcon(loyaltyData.tier)}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-1">{loyaltyData.tier}</h1>
                    <p className="text-blue-100 text-sm">Member #{loyaltyData.userId}</p>
                  </div>
                </div>
                {loyaltyData.tierConfig && (
                  <p className="text-blue-100 mb-4">{loyaltyData.tierConfig.description}</p>
                )}
                
                {/* Tier Progress Bar */}
                {loyaltyData.tierProgress && !loyaltyData.tierProgress.isMaxTier && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progress to {loyaltyData.tierProgress.nextTier}</span>
                      <span className="text-sm font-bold">{loyaltyData.tierProgress.progress}%</span>
                    </div>
                    <div className="w-full bg-blue-500/30 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-white h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${loyaltyData.tierProgress.progress}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                      {loyaltyData.tierProgress.pointsNeeded > 0 && (
                        <div>
                          <span className="text-blue-200">Points:</span>
                          <span className="ml-2 font-semibold">{loyaltyData.tierProgress.pointsNeeded.toLocaleString()}</span>
                        </div>
                      )}
                      {loyaltyData.tierProgress.staysNeeded > 0 && (
                        <div>
                          <span className="text-blue-200">Stays:</span>
                          <span className="ml-2 font-semibold">{loyaltyData.tierProgress.staysNeeded}</span>
                        </div>
                      )}
                      {loyaltyData.tierProgress.nightsNeeded > 0 && (
                        <div>
                          <span className="text-blue-200">Nights:</span>
                          <span className="ml-2 font-semibold">{loyaltyData.tierProgress.nightsNeeded}</span>
                        </div>
                      )}
                      {loyaltyData.tierProgress.spendNeeded > 0 && (
                        <div>
                          <span className="text-blue-200">Spend:</span>
                          <span className="ml-2 font-semibold">{formatCurrency(loyaltyData.tierProgress.spendNeeded)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {loyaltyData.tierProgress?.isMaxTier && (
                  <div className="mt-4 px-4 py-2 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
                    <p className="text-sm font-medium">🏆 You've reached the highest tier!</p>
                  </div>
                )}
              </div>
              
              <div className="text-center md:text-right">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <p className="text-blue-100 text-sm mb-2">Available Points</p>
                  <div className="text-5xl font-bold mb-2">{loyaltyData.points.toLocaleString()}</div>
                  <a
                    href="/loyalty/redeem"
                    className="inline-block mt-4 bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    Redeem Points →
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{loyaltyData.bookings.length}</p>
                </div>
                <div className="text-3xl">📅</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Lifetime Nights</p>
                  <p className="text-2xl font-bold text-gray-900">{(loyaltyData as any).lifetimeNights || 0}</p>
                </div>
                <div className="text-3xl">🌙</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Lifetime Spend</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency((loyaltyData as any).lifetimeSpend || 0)}
                  </p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Member Since</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(loyaltyData.createdAt)}</p>
                </div>
                <div className="text-3xl">⭐</div>
              </div>
            </div>
          </div>

          {/* Active Campaigns */}
          {loyaltyData.activeCampaigns && loyaltyData.activeCampaigns.length > 0 && (
            <div className="bg-white rounded-lg shadow-md mb-8 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <h2 className="text-xl font-semibold text-gray-900">Active Campaigns</h2>
                <p className="text-gray-600 mt-1">Current promotions and special offers</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {loyaltyData.activeCampaigns.map((campaign: ActiveCampaign, index: number) => (
                    <div
                      key={campaign.id}
                      className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-purple-50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 whitespace-nowrap">
                          {campaign.campaignType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {campaign.description && (
                        <p className="text-sm text-gray-600 mb-2">{campaign.description}</p>
                      )}
                      {campaign.rules?.multiplier && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">⚡</span>
                          <p className="text-sm font-medium text-green-700">
                            {campaign.rules.multiplier}x Points Multiplier
                          </p>
                        </div>
                      )}
                      {campaign.rules?.bonusPoints && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">🎁</span>
                          <p className="text-sm font-medium text-green-700">
                            +{campaign.rules.bonusPoints} Bonus Points
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                        Valid until {formatDate(campaign.endDate)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Perks */}
          {loyaltyData.activePerks && loyaltyData.activePerks.length > 0 && (
            <div className="bg-white rounded-lg shadow-md mb-8 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <h2 className="text-xl font-semibold text-gray-900">Active Perks</h2>
                <p className="text-gray-600 mt-1">Your current perks and benefits</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {loyaltyData.activePerks.map((perk: any, index: number) => (
                    <div
                      key={perk.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-white"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">✨</span>
                          <h3 className="font-semibold text-gray-900">{perk.perk?.name || 'Perk'}</h3>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 whitespace-nowrap">
                          Active
                        </span>
                      </div>
                      {perk.perk?.description && (
                        <p className="text-sm text-gray-600 mb-3">{perk.perk.description}</p>
                      )}
                      {perk.booking && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Booking:</span> #{perk.booking.confirmationNumber || perk.booking.id}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                        Redeemed: {formatDate(perk.redeemedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Redemptions */}
          {loyaltyData.recentRedemptions && loyaltyData.recentRedemptions.length > 0 && (
            <div className="bg-white rounded-lg shadow-md mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Recent Redemptions</h2>
                <p className="text-gray-600 mt-1">Your recent point redemptions</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {loyaltyData.recentRedemptions.map((redemption: RedemptionTransaction) => (
                    <div key={redemption.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{redemption.item?.name || 'Redemption'}</h3>
                          {redemption.item?.description && (
                            <p className="text-sm text-gray-600 mt-1">{redemption.item.description}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          redemption.status === 'USED' ? 'bg-green-100 text-green-800' :
                          redemption.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                          redemption.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {redemption.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3 text-sm">
                        <div>
                          <span className="text-gray-600">Points Redeemed: </span>
                          <span className="font-semibold text-red-600">-{redemption.pointsRedeemed.toLocaleString()}</span>
                        </div>
                        <div className="text-gray-500">
                          {formatDate(redemption.redeemedAt)}
                        </div>
                      </div>
                      {redemption.expiresAt && (
                        <div className="text-xs text-gray-500 mt-2">
                          Expires: {formatDate(redemption.expiresAt)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <a
                    href="/loyalty/redeem"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Full Redemption Catalog →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Redemption History */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Points History</h2>
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
