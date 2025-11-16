/**
 * Campaigns Management Page
 * Admin interface for managing loyalty campaigns
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../lib/useAuth';
import AdminShell, { BreadcrumbItem } from '../../../components/layout/AdminShell';
import PageHeader from '../../../components/layout/PageHeader';
import Container from '../../../components/layout/Container';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import DateRangePicker from '../../../components/ui/DateRangePicker';
import FormField from '../../../components/ui/FormField';
import { useToast } from '../../../components/ui/toast';
import axios from 'axios';

interface Campaign {
  id: number;
  name: string;
  description?: string;
  campaignType: 'POINTS_MULTIPLIER' | 'BONUS_POINTS' | 'PERK_GIVEAWAY';
  rules: any;
  propertyIds: number[];
  tierIds: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    pointsLedgerEntries: number;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function CampaignsPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [filterCampaignType, setFilterCampaignType] = useState<string>('');
  const [analytics, setAnalytics] = useState<Record<number, any>>({});
  const [loadingAnalytics, setLoadingAnalytics] = useState<Record<number, boolean>>({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    campaignType: 'POINTS_MULTIPLIER' as 'POINTS_MULTIPLIER' | 'BONUS_POINTS' | 'PERK_GIVEAWAY',
    rules: '{"multiplier": 2.0}',
    propertyIds: [] as number[],
    tierIds: [] as string[],
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

  // Fetch campaigns
  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchCampaigns();
    }
  }, [authStatus, filterActive, filterCampaignType]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filterActive !== null) {
        params.append('isActive', filterActive.toString());
      }
      if (filterCampaignType) {
        params.append('campaignType', filterCampaignType);
      }

      const response = await axios.get(`${API_URL}/api/loyalty/campaigns?${params.toString()}`, {
        withCredentials: true,
      });

      if (response.data.success) {
        setCampaigns(response.data.data || []);
      } else {
        setError('Failed to fetch campaigns');
      }
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
      setError(err.response?.data?.error || 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (campaignId: number) => {
    if (loadingAnalytics[campaignId] || analytics[campaignId]) return;

    try {
      setLoadingAnalytics({ ...loadingAnalytics, [campaignId]: true });
      const response = await axios.get(`${API_URL}/api/loyalty/campaigns/${campaignId}/analytics`, {
        withCredentials: true,
      });

      if (response.data.success) {
        setAnalytics({ ...analytics, [campaignId]: response.data.data });
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoadingAnalytics({ ...loadingAnalytics, [campaignId]: false });
    }
  };

  const handleCreate = () => {
    setEditingCampaign(null);
    setFormData({
      name: '',
      description: '',
      campaignType: 'POINTS_MULTIPLIER',
      rules: '{"multiplier": 2.0}',
      propertyIds: [],
      tierIds: [],
      startDate: '',
      endDate: '',
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      campaignType: campaign.campaignType,
      rules: JSON.stringify(campaign.rules, null, 2),
      propertyIds: campaign.propertyIds || [],
      tierIds: campaign.tierIds || [],
      startDate: campaign.startDate ? campaign.startDate.split('T')[0] : '',
      endDate: campaign.endDate ? campaign.endDate.split('T')[0] : '',
      isActive: campaign.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/loyalty/campaigns/${id}`, {
        withCredentials: true,
      });
      toast({
        variant: 'success',
        title: 'Campaign deleted',
        message: 'The campaign has been removed',
      });
      fetchCampaigns();
    } catch (err: any) {
      console.error('Error deleting campaign:', err);
      toast({
        variant: 'error',
        title: 'Failed to delete campaign',
        message: err.response?.data?.error || err.message,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Validate JSON
      let rules;
      try {
        rules = JSON.parse(formData.rules);
      } catch (err) {
        toast({
          variant: 'error',
          title: 'Invalid JSON',
          message: 'Please check the rules JSON format',
          duration: null, // Persistent until dismissed
        });
        return;
      }

      const payload = {
        ...formData,
        rules,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      };

      if (editingCampaign) {
        await axios.put(`${API_URL}/api/loyalty/campaigns/${editingCampaign.id}`, payload, {
          withCredentials: true,
        });
      } else {
        await axios.post(`${API_URL}/api/loyalty/campaigns`, payload, {
          withCredentials: true,
        });
      }

      toast({
        variant: 'success',
        title: 'Campaign saved',
        message: editingCampaign ? 'Campaign updated successfully' : 'Campaign created successfully',
      });
      setShowModal(false);
      fetchCampaigns();
    } catch (err: any) {
      console.error('Error saving campaign:', err);
      toast({
        variant: 'error',
        title: 'Failed to save campaign',
        message: err.response?.data?.error || err.message,
      });
    }
  };

  const getCampaignTypeColor = (type: string) => {
    switch (type) {
      case 'POINTS_MULTIPLIER':
        return 'bg-blue-100 text-blue-800';
      case 'BONUS_POINTS':
        return 'bg-green-100 text-green-800';
      case 'PERK_GIVEAWAY':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isActive = (campaign: Campaign) => {
    const now = new Date();
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    return campaign.isActive && now >= start && now <= end;
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
      title="Campaigns Management | POD N BEYOND Admin"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Loyalty', href: '/admin/loyalty' },
        { label: 'Campaigns' },
      ]}
    >
      <PageHeader
        title="Campaigns Management"
        subtitle="Configure seasonal campaigns and promotions"
        primaryAction={<Button onClick={handleCreate}>Create Campaign</Button>}
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
              <label className="block text-sm font-medium text-neutral-700 mb-1">Campaign Type</label>
              <select
                value={filterCampaignType}
                onChange={(e) => setFilterCampaignType(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              >
                <option value="">All Types</option>
                <option value="POINTS_MULTIPLIER">Points Multiplier</option>
                <option value="BONUS_POINTS">Bonus Points</option>
                <option value="PERK_GIVEAWAY">Perk Giveaway</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Error messages now use toast notifications */}

        {/* Campaigns List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <Card variant="default" padding="lg" className="text-center">
            <p className="text-neutral-600 mb-4">No campaigns found</p>
            <Button onClick={handleCreate}>Create Your First Campaign</Button>
          </Card>
        ) : (
          <Card variant="default" padding="none" className="overflow-hidden">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Date Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Analytics
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-neutral-900">{campaign.name}</div>
                        {campaign.description && (
                          <div className="text-sm text-neutral-500">{campaign.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCampaignTypeColor(campaign.campaignType)}`}>
                        {campaign.campaignType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      <div>
                        <div>{new Date(campaign.startDate).toLocaleDateString()}</div>
                        <div>to {new Date(campaign.endDate).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        isActive(campaign) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isActive(campaign) ? 'Active Now' : campaign.isActive ? 'Scheduled' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => fetchAnalytics(campaign.id)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        {loadingAnalytics[campaign.id] ? 'Loading...' : 'View Analytics'}
                      </button>
                      {analytics[campaign.id] && (
                        <div className="mt-2 text-xs text-neutral-600">
                          <div>Redemptions: {analytics[campaign.id].analytics.totalRedemptions}</div>
                          <div>Points: {analytics[campaign.id].analytics.totalPointsAwarded}</div>
                          <div>Members: {analytics[campaign.id].analytics.uniqueMembers}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(campaign)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(campaign.id)}
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
                {editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                    Campaign Type *
                  </label>
                  <select
                    value={formData.campaignType}
                    onChange={(e) => {
                      const type = e.target.value as any;
                      setFormData({ 
                        ...formData, 
                        campaignType: type,
                        rules: type === 'POINTS_MULTIPLIER' 
                          ? '{"multiplier": 2.0}'
                          : type === 'BONUS_POINTS'
                          ? '{"bonusPoints": 500}'
                          : '{"perkId": 1}'
                      });
                    }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    required
                  >
                    <option value="POINTS_MULTIPLIER">Points Multiplier</option>
                    <option value="BONUS_POINTS">Bonus Points</option>
                    <option value="PERK_GIVEAWAY">Perk Giveaway</option>
                  </select>
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
                  <FormField label="Campaign Period" required>
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
                      minDate={new Date().toISOString().split('T')[0]}
                      enforceRange={true}
                      required
                    />
                  </FormField>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Rules (JSON) *
                  </label>
                  <textarea
                    value={formData.rules}
                    onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono text-sm"
                    rows={6}
                    required
                    placeholder='{"multiplier": 2.0} or {"bonusPoints": 500} or {"perkId": 1}'
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    JSON object defining campaign rules (multiplier, bonusPoints, perkId, etc.)
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
                  {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

