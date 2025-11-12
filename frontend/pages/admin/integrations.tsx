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
  const { data: session, status, signOut } = useAuth();
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
  const [migrating, setMigrating] = useState(false);

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
      setError(null);
      const response = await fetch('/api/integrations', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setIntegrations(data.integrations || []);
      } else {
        setError(data.error || 'Failed to load integrations');
      }
    } catch (error: any) {
      console.error('Failed to load integrations:', error);
      setError(`Failed to load integrations: ${error.message || 'Unknown error'}`);
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
      return <Badge variant="neutral">Disabled</Badge>;
    }
    
    switch (integration.status) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>;
      case 'ERROR':
        return <Badge variant="error">Error</Badge>;
      case 'TESTING':
        return <Badge variant="warning">Testing</Badge>;
      default:
        return <Badge variant="neutral">Inactive</Badge>;
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

      {/* Admin Header - Matching Admin Dashboard */}
      <section className="pt-24 pb-6 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
        <Container>
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            {/* Left: User Info */}
            <div className="flex items-start gap-6">
              {/* User Info - Top Left */}
              <div className="flex items-center gap-4">
                <div className="text-left">
                  <p className="text-xs text-neutral-400 uppercase tracking-wide">Signed in as</p>
                  <p className="text-white font-semibold text-sm mt-0.5">{session?.user?.email || 'Loading...'}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {(session as any)?.user?.roles?.[0]?.key?.replace(/_/g, ' ') || 'MEMBER'}
                  </p>
                </div>
                <div className="h-12 w-px bg-neutral-700"></div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-button text-sm font-semibold hover:bg-white hover:text-neutral-900 transition-all"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Right: Title */}
            <div className="text-right">
              <h1 className="text-3xl font-bold mb-1">Third-Party Integrations</h1>
              <p className="text-neutral-300 text-sm">Manage API keys, credentials, and enable/disable integrations</p>
            </div>
          </div>

          {/* Header Tabs - Like Communication Hub */}
          <div className="flex items-center gap-3 flex-wrap">
            <a href="/admin/email">
              <button className={`px-6 py-2 rounded-button font-semibold transition-all ${
                router.asPath?.startsWith('/admin/email')
                  ? 'bg-white text-neutral-900'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900'
              }`}>
                💬 Communication Hub
              </button>
            </a>
            <a href="/admin/integrations">
              <button className={`px-6 py-2 rounded-button font-semibold transition-all ${
                router.asPath?.startsWith('/admin/integrations')
                  ? 'bg-white text-neutral-900'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900'
              }`}>
                ⚙️ Integrations
              </button>
            </a>
            <a href="/admin">
              <button className="px-6 py-2 rounded-button font-semibold transition-all bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900">
                ← Admin Dashboard
              </button>
            </a>
          </div>
        </Container>
      </section>

      <Container>
        <div className="py-8">

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
              <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">
                    {selectedIntegration ? 'Edit' : 'Configure'} {formData.name}
                  </h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    {formData.category} • {formData.provider}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setFormData(null);
                    setSelectedIntegration(null);
                  }}
                  className="text-neutral-400 hover:text-neutral-600 text-2xl font-light leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSave}>
                {/* Basic Info - Compact Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wide">
                      Display Name
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wide">
                      Description
                    </label>
                    <Input
                      type="text"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description (optional)"
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Configuration Fields - Compact Grid */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px bg-neutral-200 flex-1"></div>
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Credentials & Configuration</span>
                    <div className="h-px bg-neutral-200 flex-1"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(formData.config || {}).map((key) => {
                      const isSecret = key.toLowerCase().includes('secret') || 
                                      key.toLowerCase().includes('password') || 
                                      key.toLowerCase().includes('token');
                      return (
                        <div key={key} className={isSecret ? 'md:col-span-2' : ''}>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                            {isSecret && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <div className="relative">
                            <Input
                              type={isSecret ? 'password' : 'text'}
                              value={formData.config[key] || ''}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  config: { ...formData.config, [key]: e.target.value },
                                })
                              }
                              placeholder={`Enter ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                              className="text-sm pr-10"
                              required={isSecret}
                            />
                            {isSecret && formData.config[key] && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                                🔒
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Settings - Compact Row */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px bg-neutral-200 flex-1"></div>
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Settings</span>
                    <div className="h-px bg-neutral-200 flex-1"></div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        Webhook URL
                      </label>
                      <Input
                        type="url"
                        value={formData.webhookUrl || ''}
                        onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                        placeholder="https://your-domain.com/webhooks/..."
                        className="text-sm"
                      />
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {formData.category === 'PAYMENT' && (
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.testMode || false}
                            onChange={(e) =>
                              setFormData({ ...formData, testMode: e.target.checked })
                            }
                            className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
                            Test Mode (Sandbox)
                          </span>
                        </label>
                      )}
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.enabled || false}
                          onChange={(e) =>
                            setFormData({ ...formData, enabled: e.target.checked })
                          }
                          className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900">
                          Enable Integration
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowForm(false);
                      setFormData(null);
                      setSelectedIntegration(null);
                    }}
                  >
                    Cancel
                  </Button>
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

          {/* Empty State */}
          {Object.keys(groupedIntegrations).length === 0 && integrations.length === 0 && !loading && (
            <Card>
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Integrations Configured</h3>
                <p className="text-gray-500 mb-4">
                  You haven't configured any integrations yet. Add one from the available integrations above, or migrate existing configurations from environment variables.
                </p>
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 Migrate Existing Configurations</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    If you have integrations configured via environment variables (Razorpay, Postmark, etc.), you can migrate them to the database:
                  </p>
                  <code className="block text-xs bg-blue-100 p-2 rounded mb-2">
                    cd backend && node scripts/migrate-integrations-from-env.js
                  </code>
                  <p className="text-xs text-blue-700">
                    This will automatically import your existing configurations into this unified management system.
                  </p>
                </div>
              </div>
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
                            <Badge variant="warning">Test Mode</Badge>
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
                          variant={integration.enabled ? 'secondary' : 'primary'}
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

