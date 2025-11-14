/**
 * Redemption Catalog Page
 * Member interface for browsing and redeeming points
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import { useRouter } from 'next/router';

interface RedemptionItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  itemType: 'FREE_NIGHT' | 'UPGRADE' | 'VOUCHER' | 'DISCOUNT' | 'CASH';
  basePointsRequired: number;
  pointsRequired: number;
  canAfford: boolean;
  available: boolean;
  value: any;
  dynamicPricing?: any;
}

interface LoyaltyAccount {
  id: number;
  points: number;
  tier: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function RedeemPage() {
  const router = useRouter();
  const [loyaltyAccount, setLoyaltyAccount] = useState<LoyaltyAccount | null>(null);
  const [catalog, setCatalog] = useState<RedemptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterItemType, setFilterItemType] = useState<string>('');
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RedemptionItem | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  // For demo purposes
  const demoUserId = 'demo-user-123';
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    setUserId(demoUserId);
  }, []);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId, filterItemType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get loyalty account
      const accountResponse = await axios.get(`/api/loyalty/${userId}`);
      if (!accountResponse.data.success || !accountResponse.data.account?.id) {
        setError('Loyalty account not found');
        return;
      }

      const account = accountResponse.data.account;
      setLoyaltyAccount({
        id: account.id,
        points: account.points,
        tier: account.tier,
      });

      // Get redemption catalog
      const catalogResponse = await axios.get(
        `/api/loyalty/member/${account.id}/redemption-catalog${filterItemType ? `?itemType=${filterItemType}` : ''}`
      );

      if (catalogResponse.data.success) {
        setCatalog(catalogResponse.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || 'Failed to load redemption catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = (item: RedemptionItem) => {
    if (!item.canAfford) {
      alert(`You need ${item.pointsRequired} points but only have ${loyaltyAccount?.points || 0} points.`);
      return;
    }

    if (!item.available) {
      alert('This item is currently out of stock.');
      return;
    }

    setSelectedItem(item);
    setShowRedeemModal(true);
  };

  const confirmRedeem = async () => {
    if (!selectedItem || !loyaltyAccount) return;

    try {
      setRedeeming(true);
      setError(null);

      const response = await axios.post('/api/loyalty/redemptions/process', {
        itemId: selectedItem.id,
        loyaltyAccountId: loyaltyAccount.id,
      });

      if (response.data.success) {
        alert(`Successfully redeemed ${selectedItem.name}!`);
        setShowRedeemModal(false);
        setSelectedItem(null);
        fetchData(); // Refresh catalog and account
      } else {
        setError('Failed to process redemption');
      }
    } catch (err: any) {
      console.error('Error processing redemption:', err);
      setError(err.response?.data?.error || 'Failed to process redemption');
    } finally {
      setRedeeming(false);
    }
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'FREE_NIGHT':
        return 'bg-blue-100 text-blue-800';
      case 'UPGRADE':
        return 'bg-purple-100 text-purple-800';
      case 'VOUCHER':
        return 'bg-yellow-100 text-yellow-800';
      case 'DISCOUNT':
        return 'bg-green-100 text-green-800';
      case 'CASH':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Redeem Points - Pod & Beyond Hotel</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading redemption catalog...</p>
          </div>
        </div>
      </>
    );
  }

  if (error && !loyaltyAccount) {
    return (
      <>
        <Head>
          <title>Redeem Points - Pod & Beyond Hotel</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/loyalty')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Back to Loyalty
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Redeem Points - Pod & Beyond Hotel</title>
        <meta name="description" content="Redeem your loyalty points for rewards" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Redeem Points</h1>
                <p className="text-gray-600 mt-1">Browse and redeem your loyalty points</p>
              </div>
              <div className="flex items-center gap-4">
                {loyaltyAccount && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Available Points</p>
                    <p className="text-2xl font-bold text-blue-600">{loyaltyAccount.points.toLocaleString()}</p>
                  </div>
                )}
                <a
                  href="/loyalty"
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  ← Back to Loyalty
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filter */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by Type:</label>
              <select
                value={filterItemType}
                onChange={(e) => setFilterItemType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Types</option>
                <option value="FREE_NIGHT">Free Night</option>
                <option value="UPGRADE">Upgrade</option>
                <option value="VOUCHER">Voucher</option>
                <option value="DISCOUNT">Discount</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Catalog */}
          {catalog.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">🎁</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Items Available</h3>
              <p className="text-gray-600">There are no redemption items available at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {catalog.map((item, index) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg shadow-md p-6 border-2 transition-all duration-300 transform hover:-translate-y-1 ${
                    !item.canAfford || !item.available
                      ? 'border-gray-200 opacity-60 cursor-not-allowed'
                      : 'border-transparent hover:border-blue-300 hover:shadow-xl'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getItemTypeColor(item.itemType)}`}>
                      {item.itemType.replace(/_/g, ' ')}
                    </span>
                    {!item.available && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                  )}

                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-blue-600">
                        {item.pointsRequired.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-600">points</span>
                    </div>
                    {item.pointsRequired !== item.basePointsRequired && (
                      <p className="text-xs text-gray-500 mt-1">
                        Base: {item.basePointsRequired.toLocaleString()} points
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleRedeem(item)}
                    disabled={!item.canAfford || !item.available || redeeming}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                      !item.canAfford || !item.available
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transform hover:scale-105'
                    }`}
                  >
                    {!item.canAfford
                      ? `Need ${(item.pointsRequired - (loyaltyAccount?.points || 0)).toLocaleString()} more points`
                      : !item.available
                      ? 'Out of Stock'
                      : redeeming
                      ? 'Processing...'
                      : 'Redeem Now →'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Redeem Confirmation Modal */}
      {showRedeemModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Redemption</h2>
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                You are about to redeem <strong>{selectedItem.name}</strong>
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Points Required:</span>
                  <span className="text-xl font-bold text-red-600">
                    -{selectedItem.pointsRequired.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Your Balance:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {loyaltyAccount?.points.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-gray-200 mt-3 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-medium">New Balance:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {((loyaltyAccount?.points || 0) - selectedItem.pointsRequired).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRedeemModal(false);
                  setSelectedItem(null);
                  setError(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={redeeming}
              >
                Cancel
              </button>
              <button
                onClick={confirmRedeem}
                disabled={redeeming}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {redeeming ? 'Processing...' : 'Confirm Redemption'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

