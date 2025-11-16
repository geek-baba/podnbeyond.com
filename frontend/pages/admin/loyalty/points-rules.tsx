/**
 * Points Rules Management Page
 * Admin interface for managing loyalty points calculation rules
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
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/toast';
import axios from 'axios';

interface PointsRule {
  id: number;
  name: string;
  description?: string;
  ruleType: 'BASE' | 'BONUS' | 'CAMPAIGN' | 'SEASONAL';
  conditions: any;
  actions: any;
  propertyIds: number[];
  tierIds: string[];
  priority: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function PointsRulesPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useAuth();
  const { toast } = useToast();
  const [rules, setRules] = useState<PointsRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<PointsRule | null>(null);
  const [deleteRuleId, setDeleteRuleId] = useState<number | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [filterRuleType, setFilterRuleType] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ruleType: 'BONUS' as 'BASE' | 'BONUS' | 'CAMPAIGN' | 'SEASONAL',
    conditions: '{}',
    actions: '{}',
    propertyIds: [] as number[],
    tierIds: [] as string[],
    priority: 0,
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

  // Fetch rules
  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchRules();
    }
  }, [authStatus, filterActive, filterRuleType]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filterActive !== null) {
        params.append('isActive', filterActive.toString());
      }
      if (filterRuleType) {
        params.append('ruleType', filterRuleType);
      }

      const response = await axios.get(`${API_URL}/api/loyalty/points-rules?${params.toString()}`, {
        withCredentials: true,
      });

      if (response.data.success) {
        setRules(response.data.data || []);
      } else {
        setError('Failed to fetch points rules');
      }
    } catch (err: any) {
      console.error('Error fetching points rules:', err);
      setError(err.response?.data?.error || 'Failed to fetch points rules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      description: '',
      ruleType: 'BONUS',
      conditions: '{}',
      actions: '{}',
      propertyIds: [],
      tierIds: [],
      priority: 0,
      startDate: '',
      endDate: '',
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEdit = (rule: PointsRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      ruleType: rule.ruleType,
      conditions: JSON.stringify(rule.conditions, null, 2),
      actions: JSON.stringify(rule.actions, null, 2),
      propertyIds: rule.propertyIds || [],
      tierIds: rule.tierIds || [],
      priority: rule.priority,
      startDate: rule.startDate ? rule.startDate.split('T')[0] : '',
      endDate: rule.endDate ? rule.endDate.split('T')[0] : '',
      isActive: rule.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/api/loyalty/points-rules/${id}`, {
        withCredentials: true,
      });
      fetchRules();
    } catch (err: any) {
      console.error('Error deleting rule:', err);
      toast({
        variant: 'error',
        title: 'Failed to delete rule',
        message: err.response?.data?.error || err.message,
      });
    }
  };

  const openDeleteModal = (id: number) => {
    setDeleteRuleId(id);
  };

  const closeDeleteModal = () => {
    setDeleteRuleId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Validate JSON
      let conditions, actions;
      try {
        conditions = JSON.parse(formData.conditions);
        actions = JSON.parse(formData.actions);
      } catch (err) {
        setError('Invalid JSON in conditions or actions');
        return;
      }

      const payload = {
        ...formData,
        conditions,
        actions,
        priority: parseInt(formData.priority.toString(), 10),
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      };

      if (editingRule) {
        await axios.put(`${API_URL}/api/loyalty/points-rules/${editingRule.id}`, payload, {
          withCredentials: true,
        });
      } else {
        await axios.post(`${API_URL}/api/loyalty/points-rules`, payload, {
          withCredentials: true,
        });
      }

      setShowModal(false);
      fetchRules();
    } catch (err: any) {
      console.error('Error saving rule:', err);
      setError(err.response?.data?.error || 'Failed to save rule');
    }
  };

  // Map rule type to Badge variant for consistent styling
  const getRuleTypeVariant = (type: string): BadgeVariant => {
    switch (type) {
      case 'BASE': return 'neutral';
      case 'BONUS': return 'success';
      case 'CAMPAIGN': return 'warning';
      case 'SEASONAL': return 'warning';
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
      title="Points Rules | POD N BEYOND Admin"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Loyalty', href: '/admin/loyalty' },
        { label: 'Points Rules' },
      ]}
    >
      <PageHeader
        title="Points Rules Management"
        subtitle="Configure loyalty points calculation rules"
        primaryAction={<Button onClick={handleCreate}>Add Rule</Button>}
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
              <label className="block text-sm font-medium text-neutral-700 mb-1">Rule Type</label>
              <select
                value={filterRuleType}
                onChange={(e) => setFilterRuleType(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              >
                <option value="">All Types</option>
                <option value="BASE">Base</option>
                <option value="BONUS">Bonus</option>
                <option value="CAMPAIGN">Campaign</option>
                <option value="SEASONAL">Seasonal</option>
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

        {/* Rules List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading rules...</p>
          </div>
        ) : rules.length === 0 ? (
          <Card variant="default" padding="lg" className="text-center">
            <p className="text-neutral-600 mb-4">No points rules found</p>
            <Button onClick={handleCreate}>Create Your First Rule</Button>
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
                    Priority
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
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-neutral-900">{rule.name}</div>
                        {rule.description && (
                          <div className="text-sm text-neutral-500">{rule.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getRuleTypeVariant(rule.ruleType)} size="sm">
                        {rule.ruleType}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {rule.priority}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={rule.isActive ? 'success' : 'neutral'} size="sm">
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {rule.startDate || rule.endDate ? (
                        <div>
                          {rule.startDate && <div>{new Date(rule.startDate).toLocaleDateString()}</div>}
                          {rule.endDate && <div>to {new Date(rule.endDate).toLocaleDateString()}</div>}
                        </div>
                      ) : (
                        <span className="text-neutral-400">No date range</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(rule)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(rule.id)}
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

      {/* Delete Rule Confirmation Modal */}
      <Modal
        open={deleteRuleId !== null}
        onClose={closeDeleteModal}
      >
        <ModalHeader
          title="Delete rule"
          subtitle="Are you sure you want to delete this rule? This action cannot be undone."
          onClose={closeDeleteModal}
        />
        <ModalBody>
          <p className="text-sm text-neutral-600">
            Deleting a points rule will remove it from the loyalty engine. Future points calculations will no longer use this rule.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            size="sm"
            onClick={closeDeleteModal}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              if (deleteRuleId !== null) {
                handleDelete(deleteRuleId);
              }
              closeDeleteModal();
            }}
          >
            Delete rule
          </Button>
        </ModalFooter>
      </Modal>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-2xl font-bold text-neutral-900">
                {editingRule ? 'Edit Points Rule' : 'Create Points Rule'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
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
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Rule Type *
                  </label>
                  <select
                    value={formData.ruleType}
                    onChange={(e) => setFormData({ ...formData, ruleType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    required
                  >
                    <option value="BASE">Base</option>
                    <option value="BONUS">Bonus</option>
                    <option value="CAMPAIGN">Campaign</option>
                    <option value="SEASONAL">Seasonal</option>
                  </select>
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
                    Priority
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Higher priority rules are evaluated first</p>
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
                    Conditions (JSON) *
                  </label>
                  <textarea
                    value={formData.conditions}
                    onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono text-sm"
                    rows={6}
                    required
                    placeholder='{"bookingSource": "WEB_DIRECT", "stayLength": {"min": 5}, "isWeekend": true}'
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    JSON object defining when this rule applies
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Actions (JSON) *
                  </label>
                  <textarea
                    value={formData.actions}
                    onChange={(e) => setFormData({ ...formData, actions: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono text-sm"
                    rows={6}
                    required
                    placeholder='{"multiplier": 1.2, "bonusPoints": 200, "type": "PERCENTAGE"}'
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    JSON object defining what this rule does (multiplier, bonusPoints, etc.)
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
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

