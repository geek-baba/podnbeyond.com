/**
 * Perks Management Page
 * Admin interface for managing loyalty perks
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../lib/useAuth';
import Head from 'next/head';
import Header from '../../../components/layout/Header';
import Container from '../../../components/layout/Container';
import DateRangePicker from '../../../components/ui/DateRangePicker';
import FormField from '../../../components/ui/FormField';
import { useToast } from '../../../components/ui/toast';
import axios from 'axios';

interface Perk {
  id: number;
  code: string;
  name: string;
  description?: string;
  perkType: 'BENEFIT' | 'DISCOUNT' | 'UPGRADE' | 'VOUCHER' | 'POINTS_BONUS';
  conditions: any;
  value: any;
  propertyIds: number[];
  tierIds: string[];
  maxUsagePerMember?: number;
  maxUsagePerStay?: number;
  totalCapacity?: number;
  currentUsage: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    perkRedemptions: number;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function PerksPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useAuth();
  const { toast } = useToast();
  const [perks, setPerks] = useState<Perk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPerk, setEditingPerk] = useState<Perk | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [filterPerkType, setFilterPerkType] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    perkType: 'BENEFIT' as 'BENEFIT' | 'DISCOUNT' | 'UPGRADE' | 'VOUCHER' | 'POINTS_BONUS',
    conditions: '{}',
    value: '{}',
    propertyIds: [] as number[],
    tierIds: [] as string[],
    maxUsagePerMember: '',
    maxUsagePerStay: '',
    totalCapacity: '',
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

  // Fetch perks
  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchPerks();
    }
  }, [authStatus, filterActive, filterPerkType]);

  const fetchPerks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filterActive !== null) {
        params.append('isActive', filterActive.toString());
      }
      if (filterPerkType) {
        params.append('perkType', filterPerkType);
      }

      const response = await axios.get(`${API_URL}/api/loyalty/perks?${params.toString()}`, {
        withCredentials: true,
      });

      if (response.data.success) {
        setPerks(response.data.data || []);
      } else {
        setError('Failed to fetch perks');
      }
    } catch (err: any) {
      console.error('Error fetching perks:', err);
      setError(err.response?.data?.error || 'Failed to fetch perks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPerk(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      perkType: 'BENEFIT',
      conditions: '{}',
      value: '{}',
      propertyIds: [],
      tierIds: [],
      maxUsagePerMember: '',
      maxUsagePerStay: '',
      totalCapacity: '',
      startDate: '',
      endDate: '',
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEdit = (perk: Perk) => {
    setEditingPerk(perk);
    setFormData({
      code: perk.code,
      name: perk.name,
      description: perk.description || '',
      perkType: perk.perkType,
      conditions: JSON.stringify(perk.conditions, null, 2),
      value: JSON.stringify(perk.value, null, 2),
      propertyIds: perk.propertyIds || [],
      tierIds: perk.tierIds || [],
      maxUsagePerMember: perk.maxUsagePerMember?.toString() || '',
      maxUsagePerStay: perk.maxUsagePerStay?.toString() || '',
      totalCapacity: perk.totalCapacity?.toString() || '',
      startDate: perk.startDate ? perk.startDate.split('T')[0] : '',
      endDate: perk.endDate ? perk.endDate.split('T')[0] : '',
      isActive: perk.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this perk?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/loyalty/perks/${id}`, {
        withCredentials: true,
      });
      toast({
        variant: 'success',
        title: 'Perk deleted',
        message: 'The perk has been removed',
      });
      fetchPerks();
    } catch (err: any) {
      console.error('Error deleting perk:', err);
      toast({
        variant: 'error',
        title: 'Failed to delete perk',
        message: err.response?.data?.error || err.message,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Validate JSON
      let conditions, value;
      try {
        conditions = JSON.parse(formData.conditions);
        value = JSON.parse(formData.value);
      } catch (err) {
        toast({
          variant: 'error',
          title: 'Invalid JSON',
          message: 'Please check the conditions or value JSON format',
          duration: null, // Persistent until dismissed
        });
        return;
      }

      const payload = {
        ...formData,
        conditions,
        value,
        maxUsagePerMember: formData.maxUsagePerMember ? parseInt(formData.maxUsagePerMember, 10) : null,
        maxUsagePerStay: formData.maxUsagePerStay ? parseInt(formData.maxUsagePerStay, 10) : null,
        totalCapacity: formData.totalCapacity ? parseInt(formData.totalCapacity, 10) : null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      };

      if (editingPerk) {
        await axios.put(`${API_URL}/api/loyalty/perks/${editingPerk.id}`, payload, {
          withCredentials: true,
        });
      } else {
        await axios.post(`${API_URL}/api/loyalty/perks`, payload, {
          withCredentials: true,
        });
      }

      toast({
        variant: 'success',
        title: 'Perk saved',
        message: editingPerk ? 'Perk updated successfully' : 'Perk created successfully',
      });
      setShowModal(false);
      fetchPerks();
    } catch (err: any) {
      console.error('Error saving perk:', err);
      toast({
        variant: 'error',
        title: 'Failed to save perk',
        message: err.response?.data?.error || err.message,
      });
    }
  };

  const getPerkTypeColor = (type: string) => {
    switch (type) {
      case 'BENEFIT':
        return 'bg-blue-100 text-blue-800';
      case 'DISCOUNT':
        return 'bg-green-100 text-green-800';
      case 'UPGRADE':
        return 'bg-purple-100 text-purple-800';
      case 'VOUCHER':
        return 'bg-yellow-100 text-yellow-800';
      case 'POINTS_BONUS':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <div className="min-h-screen bg-neutral-50">
      <Head>
        <title>Perks Management | POD N BEYOND Admin</title>
        <meta name="description" content="Manage loyalty perks" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      {/* Admin Header */}
      <section className="pt-24 pb-6 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
        <Container>
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div className="flex items-start gap-6">
              <div className="flex items-center gap-4">
                <div className="text-left">
                  <p className="text-xs text-neutral-400 uppercase tracking-wide">Signed in as</p>
                  <p className="text-white font-semibold text-sm mt-0.5">
                    {session?.user?.email || 'Not signed in'}
                  </p>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Perks Management</h1>
                <p className="text-neutral-300">Configure loyalty perks and benefits</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin/loyalty')}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors text-sm"
              >
                ← Back to Loyalty Program
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium"
              >
                + Create Perk
              </button>
            </div>
          </div>
        </Container>
      </section>

      <Container>
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
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
              <label className="block text-sm font-medium text-neutral-700 mb-1">Perk Type</label>
              <select
                value={filterPerkType}
                onChange={(e) => setFilterPerkType(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              >
                <option value="">All Types</option>
                <option value="BENEFIT">Benefit</option>
                <option value="DISCOUNT">Discount</option>
                <option value="UPGRADE">Upgrade</option>
                <option value="VOUCHER">Voucher</option>
                <option value="POINTS_BONUS">Points Bonus</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error messages now use toast notifications */}

        {/* Perks List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading perks...</p>
          </div>
        ) : perks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-neutral-600 mb-4">No perks found</p>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create Your First Perk
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Date Range
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {perks.map((perk) => (
                  <tr key={perk.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-neutral-900">{perk.code}</div>
                        <div className="text-sm text-neutral-500">{perk.name}</div>
                        {perk.description && (
                          <div className="text-xs text-neutral-400 mt-1">{perk.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPerkTypeColor(perk.perkType)}`}>
                        {perk.perkType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      <div>
                        <div>Used: {perk.currentUsage}</div>
                        {perk.totalCapacity && (
                          <div className="text-xs text-neutral-500">
                            / {perk.totalCapacity} total
                          </div>
                        )}
                        {perk._count && (
                          <div className="text-xs text-neutral-500">
                            {perk._count.perkRedemptions} redemptions
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        perk.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {perk.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {perk.startDate || perk.endDate ? (
                        <div>
                          {perk.startDate && <div>{new Date(perk.startDate).toLocaleDateString()}</div>}
                          {perk.endDate && <div>to {new Date(perk.endDate).toLocaleDateString()}</div>}
                        </div>
                      ) : (
                        <span className="text-neutral-400">No date range</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(perk)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(perk.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Container>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-2xl font-bold text-neutral-900">
                {editingPerk ? 'Edit Perk' : 'Create Perk'}
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
                    placeholder="FREE_BREAKFAST"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Unique identifier (uppercase, underscores)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Perk Type *
                  </label>
                  <select
                    value={formData.perkType}
                    onChange={(e) => setFormData({ ...formData, perkType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    required
                  >
                    <option value="BENEFIT">Benefit</option>
                    <option value="DISCOUNT">Discount</option>
                    <option value="UPGRADE">Upgrade</option>
                    <option value="VOUCHER">Voucher</option>
                    <option value="POINTS_BONUS">Points Bonus</option>
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
                    Max Usage Per Member
                  </label>
                  <input
                    type="number"
                    value={formData.maxUsagePerMember}
                    onChange={(e) => setFormData({ ...formData, maxUsagePerMember: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Max Usage Per Stay
                  </label>
                  <input
                    type="number"
                    value={formData.maxUsagePerStay}
                    onChange={(e) => setFormData({ ...formData, maxUsagePerStay: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Total Capacity
                  </label>
                  <input
                    type="number"
                    value={formData.totalCapacity}
                    onChange={(e) => setFormData({ ...formData, totalCapacity: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    placeholder="Leave empty for unlimited"
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
                <div className="md:col-span-2">
                  <FormField label="Validity Period">
                    <DateRangePicker
                      value={[formData.startDate, formData.endDate]}
                      onChange={([start, end]) => {
                        setFormData({
                          ...formData,
                          startDate: start || '',
                          endDate: end || '',
                        });
                      }}
                      startPlaceholder="Start Date"
                      endPlaceholder="End Date"
                      variant="connected"
                      enforceRange={true}
                    />
                  </FormField>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Conditions (JSON) *
                  </label>
                  <textarea
                    value={formData.conditions}
                    onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono text-sm"
                    rows={6}
                    required
                    placeholder='{"minTier": "GOLD", "stayLength": {"min": 2}, "bookingSource": "WEB_DIRECT"}'
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    JSON object defining when this perk is available
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
                    placeholder='{"type": "FREE_BREAKFAST", "quantity": 1, "description": "Free breakfast for 1 morning"}'
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    JSON object defining the perk value/benefit
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
                  {editingPerk ? 'Update Perk' : 'Create Perk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

