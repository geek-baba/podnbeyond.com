/**
 * Redemption Items Management Page
 * Admin interface for managing loyalty redemption catalog
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../lib/useAuth';
import AdminShell, { BreadcrumbItem } from '../../../components/layout/AdminShell';
import PageHeader from '../../../components/layout/PageHeader';
import Container from '../../../components/layout/Container';
import Card from '../../../components/ui/Card';
import Badge, { type BadgeVariant } from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import axios from 'axios';

interface RedemptionItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  itemType: 'FREE_NIGHT' | 'UPGRADE' | 'VOUCHER' | 'DISCOUNT' | 'CASH';
  basePointsRequired: number;
  dynamicPricing?: any;
  value: any;
  propertyIds: number[];
  tierIds: string[];
  roomTypeIds: number[];
  totalQuantity?: number;
  availableQuantity?: number;
  soldQuantity: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    redemptions: number;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function RedemptionItemsPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useAuth();
  const [items, setItems] = useState<RedemptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RedemptionItem | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [filterItemType, setFilterItemType] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    itemType: 'FREE_NIGHT' as 'FREE_NIGHT' | 'UPGRADE' | 'VOUCHER' | 'DISCOUNT' | 'CASH',
    basePointsRequired: 0,
    dynamicPricing: 'null',
    value: '{}',
    propertyIds: [] as number[],
    tierIds: [] as string[],
    roomTypeIds: [] as number[],
    totalQuantity: '',
    availableQuantity: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  // Check authentication
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [authStatus, router]);

  // Fetch items
  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchItems();
    }
  }, [authStatus, filterActive, filterItemType]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filterActive !== null) {
        params.append('isActive', filterActive.toString());
      }
      if (filterItemType) {
        params.append('itemType', filterItemType);
      }

      const response = await axios.get(`${API_URL}/api/loyalty/redemption-items?${params.toString()}`, {
        withCredentials: true,
      });

      if (response.data.success) {
        setItems(response.data.data || []);
      } else {
        setError('Failed to fetch redemption items');
      }
    } catch (err: any) {
      console.error('Error fetching redemption items:', err);
      setError(err.response?.data?.error || 'Failed to fetch redemption items');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      itemType: 'FREE_NIGHT',
      basePointsRequired: 0,
      dynamicPricing: 'null',
      value: '{}',
      propertyIds: [],
      tierIds: [],
      roomTypeIds: [],
      totalQuantity: '',
      availableQuantity: '',
      startDate: '',
      endDate: '',
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEdit = (item: RedemptionItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || '',
      itemType: item.itemType,
      basePointsRequired: item.basePointsRequired,
      dynamicPricing: item.dynamicPricing ? JSON.stringify(item.dynamicPricing, null, 2) : 'null',
      value: JSON.stringify(item.value, null, 2),
      propertyIds: item.propertyIds || [],
      tierIds: item.tierIds || [],
      roomTypeIds: item.roomTypeIds || [],
      totalQuantity: item.totalQuantity?.toString() || '',
      availableQuantity: item.availableQuantity?.toString() || '',
      startDate: item.startDate ? item.startDate.split('T')[0] : '',
      endDate: item.endDate ? item.endDate.split('T')[0] : '',
      isActive: item.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this redemption item?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/loyalty/redemption-items/${id}`, {
        withCredentials: true,
      });
      fetchItems();
    } catch (err: any) {
      console.error('Error deleting redemption item:', err);
      alert(err.response?.data?.error || 'Failed to delete redemption item');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Validate JSON
      let value, dynamicPricing;
      try {
        value = JSON.parse(formData.value);
        dynamicPricing = formData.dynamicPricing === 'null' || formData.dynamicPricing === '' 
          ? null 
          : JSON.parse(formData.dynamicPricing);
      } catch (err) {
        setError('Invalid JSON in value or dynamicPricing');
        return;
      }

      const payload = {
        ...formData,
        value,
        dynamicPricing,
        basePointsRequired: parseInt(formData.basePointsRequired.toString(), 10),
        totalQuantity: formData.totalQuantity ? parseInt(formData.totalQuantity, 10) : null,
        availableQuantity: formData.availableQuantity ? parseInt(formData.availableQuantity, 10) : null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      };

      if (editingItem) {
        await axios.put(`${API_URL}/api/loyalty/redemption-items/${editingItem.id}`, payload, {
          withCredentials: true,
        });
      } else {
        await axios.post(`${API_URL}/api/loyalty/redemption-items`, payload, {
          withCredentials: true,
        });
      }

      setShowModal(false);
      fetchItems();
    } catch (err: any) {
      console.error('Error saving redemption item:', err);
      setError(err.response?.data?.error || 'Failed to save redemption item');
    }
  };

  // Map item type to Badge variant for consistent styling
  const getItemTypeVariant = (type: string): BadgeVariant => {
    switch (type) {
      case 'FREE_NIGHT': return 'neutral';
      case 'UPGRADE': return 'warning';
      case 'VOUCHER': return 'warning';
      case 'DISCOUNT': return 'success';
      case 'CASH': return 'warning';
      default: return 'neutral';
    }
  };

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

  return (
    <AdminShell
      title="Redemption Catalog | POD N BEYOND Admin"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Loyalty', href: '/admin/loyalty' },
        { label: 'Redemption Catalog' },
      ]}
    >
      <PageHeader
        title="Redemption Catalog"
        subtitle="Manage items members can redeem with points"
        primaryAction={<Button onClick={handleCreate}>Create Item</Button>}
        secondaryActions={
          <Button variant="secondary" size="sm" onClick={() => router.push('/admin/loyalty')}>
            Back to Loyalty
          </Button>
        }
      />

      <Container>
        {/* Filters */}
        <Card variant="default" padding="md" className="mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
              <select
                value={filterActive === null ? '' : filterActive.toString()}
                onChange={(e) => setFilterActive(e.target.value === '' ? null : e.target.value === 'true')}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Item Type</label>
              <select
                value={filterItemType}
                onChange={(e) => setFilterItemType(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
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
        </Card>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Items List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading redemption items...</p>
          </div>
        ) : items.length === 0 ? (
          <Card variant="default" padding="lg" className="text-center">
            <p className="text-neutral-600 mb-4">No redemption items found</p>
            <Button onClick={handleCreate}>Create Your First Item</Button>
          </Card>
        ) : (
          <Card variant="default" padding="none" className="overflow-hidden">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Code / Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Points Required
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Inventory
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-neutral-900">{item.code}</div>
                        <div className="text-sm text-neutral-500">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-neutral-400 mt-1">{item.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getItemTypeVariant(item.itemType)} size="sm">
                        {item.itemType.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      <div className="font-semibold">{item.basePointsRequired.toLocaleString()}</div>
                      {item.dynamicPricing && (
                        <div className="text-xs text-neutral-500">Dynamic pricing enabled</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {item.totalQuantity !== null ? (
                        <div>
                          <div>Sold: {item.soldQuantity}</div>
                          <div className="text-xs text-neutral-500">
                            / {item.totalQuantity} total
                            {item.availableQuantity !== null && (
                              <span> ({item.availableQuantity} available)</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-neutral-400">Unlimited</span>
                      )}
                      {item._count && (
                        <div className="text-xs text-neutral-500 mt-1">
                          {item._count.redemptions} redemptions
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={item.isActive ? 'success' : 'neutral'} size="sm">
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </Container>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-2xl font-bold text-neutral-900">
                {editingItem ? 'Edit Redemption Item' : 'Create Redemption Item'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    required
                    placeholder="FREE_NIGHT_CAT1"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Unique identifier (uppercase, underscores)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Item Type *
                  </label>
                  <select
                    value={formData.itemType}
                    onChange={(e) => setFormData({ ...formData, itemType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    required
                  >
                    <option value="FREE_NIGHT">Free Night</option>
                    <option value="UPGRADE">Upgrade</option>
                    <option value="VOUCHER">Voucher</option>
                    <option value="DISCOUNT">Discount</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Base Points Required *
                  </label>
                  <input
                    type="number"
                    value={formData.basePointsRequired}
                    onChange={(e) => setFormData({ ...formData, basePointsRequired: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Active
                  </label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Total Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.totalQuantity}
                    onChange={(e) => setFormData({ ...formData, totalQuantity: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    placeholder="Leave empty for unlimited"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Available Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.availableQuantity}
                    onChange={(e) => setFormData({ ...formData, availableQuantity: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    placeholder="Leave empty to auto-calculate"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Dynamic Pricing (JSON)
                  </label>
                  <textarea
                    value={formData.dynamicPricing}
                    onChange={(e) => setFormData({ ...formData, dynamicPricing: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono text-sm"
                    rows={6}
                    placeholder='{"dynamic": true, "rules": [{"roomTypeId": 1, "points": 5000}, {"propertyId": 2, "multiplier": 1.2}]}'
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    JSON object for dynamic pricing rules (room type, property, seasonal). Use "null" for no dynamic pricing.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Value (JSON) *
                  </label>
                  <textarea
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono text-sm"
                    rows={6}
                    required
                    placeholder='{"type": "FREE_NIGHT", "category": 1, "expiresInDays": 365}'
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    JSON object defining the redemption value/benefit
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingItem ? 'Update Item' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

