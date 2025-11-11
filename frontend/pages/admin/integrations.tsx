import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/useAuth';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import Container from '../../components/layout/Container';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

interface Integration {
  id: number;
  provider: string;
  name: string;
  category: string;
  enabled: boolean;
  config: Record<string, any>;
  description?: string;
  documentationUrl?: string;
  webhookUrl?: string;
  testMode?: boolean;
  status: string;
  lastTestedAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

const INTEGRATION_TEMPLATES = {
  RAZORPAY: {
    provider: 'RAZORPAY',
    name: 'Razorpay Payment Gateway',
    category: 'PAYMENT',
    config: {
      keyId: '',
      keySecret: '',
    },
    description: 'Payment processing via Razorpay',
    documentationUrl: 'https://razorpay.com/docs/',
  },
  POSTMARK: {
    provider: 'POSTMARK',
    name: 'Postmark Email Service',
    category: 'EMAIL',
    config: {
      serverToken: '',
      webhookSecret: '',
      mailFrom: 'support@capsulepodhotel.com',
    },
    description: 'Transactional email delivery via Postmark',
    documentationUrl: 'https://postmarkapp.com/developer',
  },
  GUPSHUP: {
    provider: 'GUPSHUP',
    name: 'Gupshup WhatsApp/SMS',
    category: 'MESSAGING',
    config: {
      apiKey: '',
      appId: '',
      appName: 'podnbeyond',
      source: '',
      webhookSecret: '',
      webhookUrl: '',
    },
    description: 'WhatsApp and SMS messaging via Gupshup',
    documentationUrl: 'https://docs.gupshup.io/',
  },
  EXOTEL: {
    provider: 'EXOTEL',
    name: 'Exotel Voice/SMS',
    category: 'VOICE',
    config: {
      sid: '',
      apiKey: '',
      apiToken: '',
      subdomain: '',
      fromNumber: '',
      webhookSecret: '',
      webhookUrl: '',
    },
    description: 'Voice calls and SMS via Exotel',
    documentationUrl: 'https://developer.exotel.com/',
  },
  GO_MMT: {
    provider: 'GO_MMT',
    name: 'Go-MMT',
    category: 'OTA',
    config: {
      apiKey: '',
      apiSecret: '',
      hotelId: '',
    },
    description: 'Go-MMT channel manager integration',
  },
  BOOKING_COM: {
    provider: 'BOOKING_COM',
    name: 'Booking.com',
    category: 'OTA',
    config: {
      apiKey: '',
      apiSecret: '',
      hotelId: '',
    },
    description: 'Booking.com channel manager integration',
  },
  EASEMYTRIP: {
    provider: 'EASEMYTRIP',
    name: 'EaseMyTrip.com',
    category: 'OTA',
    config: {
      apiKey: '',
      apiSecret: '',
      hotelId: '',
    },
    description: 'EaseMyTrip.com channel manager integration',
  },
  CLEARTRIP: {
    provider: 'CLEARTRIP',
    name: 'Cleartrip.com',
    category: 'OTA',
    config: {
      apiKey: '',
      apiSecret: '',
      hotelId: '',
    },
    description: 'Cleartrip.com channel manager integration',
  },
};

export default function IntegrationsAdmin() {
  const { data: session, status } = useAuth();
  const router = useRouter();
  
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check authorization
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      const userRoles = session?.user?.roles || [];
      const isAdmin = userRoles.some((r: any) => 
        ['ADMIN', 'SUPERADMIN', 'MANAGER'].includes(r.key)
      );
      
      if (!isAdmin && session?.user?.email !== 'admin@podnbeyond.com' && session?.user?.email !== 'shwet@thedesi.email') {
        router.push('/admin/forbidden');
      }
    }
  }, [status, session, router]);

  // Load integrations
  useEffect(() => {
    if (status === 'authenticated') {
      loadIntegrations();
    }
  }, [status]);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/integrations');
      const data = await response.json();
      if (data.success) {
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error('Failed to load integrations:', error);
      setError('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (integration: Integration) => {
    setSelectedIntegration(integration);
    setFormData({
      ...integration,
      config: { ...integration.config }
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleCreate = (provider: string) => {
    const template = INTEGRATION_TEMPLATES[provider as keyof typeof INTEGRATION_TEMPLATES];
    if (!template) return;
    
    setSelectedIntegration(null);
    setFormData({
      ...template,
      enabled: false,
      testMode: false,
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdBy: session?.user?.id || session?.user?.email,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Integration saved successfully');
        setShowForm(false);
        await loadIntegrations();
        // Clear cache on backend
        await fetch('/api/integrations/clear-cache', { method: 'POST' }).catch(() => {});
      } else {
        setError(data.error || 'Failed to save integration');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to save integration');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (provider: string, currentEnabled: boolean) => {
    try {
      const response = await fetch(`/api/integrations/${provider}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });

      const data = await response.json();
      if (data.success) {
        await loadIntegrations();
        // Clear cache on backend
        await fetch('/api/integrations/clear-cache', { method: 'POST' }).catch(() => {});
      }
    } catch (error) {
      console.error('Failed to toggle integration:', error);
    }
  };

  const handleTest = async (provider: string) => {
    setTesting(provider);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/integrations/${provider}/test`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success && data.testResult) {
        if (data.testResult.success) {
          setSuccess(`Connection test successful: ${data.testResult.message}`);
        } else {
          setError(`Connection test failed: ${data.testResult.message}`);
        }
        await loadIntegrations();
      } else {
        setError('Failed to test integration');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to test integration');
    } finally {
      setTesting(null);
    }
  };

  const getStatusBadge = (integration: Integration) => {
    if (!integration.enabled) {
      return <Badge variant="gray">Disabled</Badge>;
    }
    
    switch (integration.status) {
      case 'ACTIVE':
        return <Badge variant="green">Active</Badge>;
      case 'ERROR':
        return <Badge variant="red">Error</Badge>;
      case 'TESTING':
        return <Badge variant="yellow">Testing</Badge>;
      default:
        return <Badge variant="gray">Inactive</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      PAYMENT: 'bg-blue-100 text-blue-800',
      EMAIL: 'bg-purple-100 text-purple-800',
      MESSAGING: 'bg-green-100 text-green-800',
      VOICE: 'bg-orange-100 text-orange-800',
      OTA: 'bg-pink-100 text-pink-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Group integrations by category
  const groupedIntegrations = integrations.reduce((acc, integration) => {
    if (!acc[integration.category]) {
      acc[integration.category] = [];
    }
    acc[integration.category].push(integration);
    return acc;
  }, {} as Record<string, Integration[]>);

  // Get available providers (not yet configured)
  const configuredProviders = new Set(integrations.map(i => i.provider));
  const availableProviders = Object.keys(INTEGRATION_TEMPLATES).filter(
    p => !configuredProviders.has(p)
  );

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Third-Party Integrations - Admin</title>
      </Head>
      <Header />
      <Container>
        <div className="py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Third-Party Integrations</h1>
              <p className="text-gray-600 mt-2">
                Manage API keys, credentials, and enable/disable integrations
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          {/* Integration Form Modal */}
          {showForm && formData && (
            <Card className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {selectedIntegration ? 'Edit' : 'Create'} Integration
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setFormData(null);
                    setSelectedIntegration(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Provider</label>
                    <Input
                      type="text"
                      value={formData.provider}
                      disabled={!!selectedIntegration}
                      className="bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <Input
                      type="text"
                      value={formData.category}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      rows={2}
                    />
                  </div>

                  {/* Configuration Fields */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Configuration</h3>
                    <div className="space-y-3">
                      {Object.keys(formData.config || {}).map((key) => (
                        <div key={key}>
                          <label className="block text-sm font-medium mb-1">
                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                          </label>
                          <Input
                            type={key.toLowerCase().includes('secret') || key.toLowerCase().includes('password') || key.toLowerCase().includes('token') ? 'password' : 'text'}
                            value={formData.config[key] || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                config: { ...formData.config, [key]: e.target.value },
                              })
                            }
                            placeholder={`Enter ${key}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Fields */}
                  <div className="border-t pt-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Webhook URL</label>
                      <Input
                        type="url"
                        value={formData.webhookUrl || ''}
                        onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                        placeholder="https://your-domain.com/webhooks/..."
                      />
                    </div>

                    {formData.category === 'PAYMENT' && (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="testMode"
                          checked={formData.testMode || false}
                          onChange={(e) =>
                            setFormData({ ...formData, testMode: e.target.checked })
                          }
                          className="mr-2"
                        />
                        <label htmlFor="testMode" className="text-sm">
                          Test Mode (Sandbox)
                        </label>
                      </div>
                    )}

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enabled"
                        checked={formData.enabled || false}
                        onChange={(e) =>
                          setFormData({ ...formData, enabled: e.target.checked })
                        }
                        className="mr-2"
                      />
                      <label htmlFor="enabled" className="text-sm font-medium">
                        Enable Integration
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Integration'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowForm(false);
                        setFormData(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          )}

          {/* Available Providers to Add */}
          {availableProviders.length > 0 && (
            <Card className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Available Integrations</h2>
              <div className="flex flex-wrap gap-2">
                {availableProviders.map((provider) => {
                  const template = INTEGRATION_TEMPLATES[provider as keyof typeof INTEGRATION_TEMPLATES];
                  return (
                    <button
                      key={provider}
                      onClick={() => handleCreate(provider)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      + Add {template.name}
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Configured Integrations by Category */}
          {Object.keys(groupedIntegrations).length === 0 && integrations.length === 0 && (
            <Card>
              <p className="text-gray-500 text-center py-8">
                No integrations configured yet. Add one from the available integrations above.
              </p>
            </Card>
          )}

          {Object.entries(groupedIntegrations).map(([category, categoryIntegrations]) => (
            <Card key={category} className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  <span className={`px-2 py-1 rounded text-sm ${getCategoryColor(category)}`}>
                    {category}
                  </span>
                </h2>
              </div>

              <div className="space-y-4">
                {categoryIntegrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{integration.name}</h3>
                          {getStatusBadge(integration)}
                          {integration.testMode && (
                            <Badge variant="yellow">Test Mode</Badge>
                          )}
                        </div>
                        {integration.description && (
                          <p className="text-sm text-gray-600 mb-2">{integration.description}</p>
                        )}
                        {integration.lastError && (
                          <p className="text-sm text-red-600 mb-2">
                            Last Error: {integration.lastError}
                          </p>
                        )}
                        {integration.lastTestedAt && (
                          <p className="text-xs text-gray-500">
                            Last tested: {new Date(integration.lastTestedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEdit(integration)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant={integration.enabled ? 'danger' : 'primary'}
                          size="sm"
                          onClick={() => handleToggle(integration.provider, integration.enabled)}
                        >
                          {integration.enabled ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleTest(integration.provider)}
                          disabled={testing === integration.provider}
                        >
                          {testing === integration.provider ? 'Testing...' : 'Test'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Container>
      <Footer />
    </>
  );
}

