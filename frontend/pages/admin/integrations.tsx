import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/useAuth';
import { useRouter } from 'next/router';
import AdminShell, { BreadcrumbItem } from '../../components/layout/AdminShell';
import PageHeader from '../../components/layout/PageHeader';
import Container from '../../components/layout/Container';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useToast } from '../../components/ui/toast';

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
  const { data: session, status: authStatus } = useAuth();
  const router = useRouter();
  
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [migrating, setMigrating] = useState(false);
  const { toast } = useToast();

  // Check authorization
  useEffect(() => {
    if (authStatus === 'loading') return;
    
    if (authStatus === 'unauthenticated') {
      router.push('/admin/login');
    } else if (authStatus === 'authenticated') {
      const userRoles = session?.user?.roles || [];
      const isAdmin = userRoles.some((r: any) => 
        ['ADMIN', 'SUPERADMIN', 'MANAGER'].includes(r.key)
      );
      
      if (!isAdmin && session?.user?.email !== 'admin@podnbeyond.com' && session?.user?.email !== 'shwet@thedesi.email') {
        router.push('/admin/forbidden');
      }
    }
  }, [authStatus, session, router]);

  // Load integrations
  useEffect(() => {
    if (authStatus === 'authenticated') {
      loadIntegrations();
    } else if (authStatus === 'unauthenticated') {
      // If unauthenticated, don't try to load - redirect will happen
      setLoading(false);
    }
    // If status is 'loading', wait for it to resolve
  }, [authStatus]);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/integrations', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - redirect to login
          router.push('/admin/login');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setIntegrations(data.integrations || []);
      } else {
        toast({
          variant: 'error',
          title: 'Failed to load integrations',
          message: data.error || 'Please refresh the page',
        });
      }
    } catch (error: any) {
      console.error('Failed to load integrations:', error);
      if (error.name === 'AbortError') {
        toast({
          variant: 'error',
          title: 'Request timeout',
          message: 'Please refresh the page',
        });
      } else {
        toast({
          variant: 'error',
          title: 'Failed to load integrations',
          message: error.message || 'Unknown error',
        });
      }
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
  };

  const handleCreate = (provider: string) => {
    const template = INTEGRATION_TEMPLATES[provider as keyof typeof INTEGRATION_TEMPLATES];
    if (!template) return;
    
    // Create a temporary integration object for new integrations
    const tempIntegration: Integration = {
      id: -1, // Temporary ID for new integrations
      provider: template.provider,
      name: template.name,
      category: template.category,
      enabled: false,
      config: template.config,
      description: template.description,
      documentationUrl: (template as any).documentationUrl,
      webhookUrl: '',
      testMode: false,
      status: 'INACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setSelectedIntegration(tempIntegration);
    setFormData({
      ...template,
      enabled: false,
      testMode: false,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setSaving(true);

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
        toast({
          variant: 'success',
          title: 'Integration saved',
          message: 'Configuration updated successfully',
        });
        setShowForm(false);
        setFormData(null);
        setSelectedIntegration(null);
        await loadIntegrations();
        // Clear cache on backend
        await fetch('/api/integrations/clear-cache', { method: 'POST' }).catch(() => {});
      } else {
        toast({
          variant: 'error',
          title: 'Save failed',
          message: data.error || 'Failed to save integration',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'error',
        title: 'Save failed',
        message: error.message || 'Failed to save integration',
      });
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

    try {
      const response = await fetch(`/api/integrations/${provider}/test`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success && data.testResult) {
        if (data.testResult.success) {
          toast({
            variant: 'success',
            title: 'Connection test successful',
            message: data.testResult.message,
          });
        } else {
          toast({
            variant: 'error',
            title: 'Connection test failed',
            message: data.testResult.message,
          });
        }
        await loadIntegrations();
      } else {
        toast({
          variant: 'error',
          title: 'Test failed',
          message: 'Failed to test integration',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'error',
        title: 'Test failed',
        message: error.message || 'Failed to test integration',
      });
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
    return colors[category] || 'bg-neutral-100 text-neutral-800';
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

  // Group available providers by category
  const groupedAvailableProviders = availableProviders.reduce((acc, provider) => {
    const template = INTEGRATION_TEMPLATES[provider as keyof typeof INTEGRATION_TEMPLATES];
    if (!template) return acc;
    
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push({ 
      providerKey: provider,
      name: template.name,
      description: template.description,
      category: template.category,
      provider: template.provider,
      config: template.config,
      ...((template as any).documentationUrl && { documentationUrl: (template as any).documentationUrl })
    });
    return acc;
  }, {} as Record<string, Array<{ providerKey: string; provider: string; name: string; category: string; config: Record<string, any>; description?: string; documentationUrl?: string }>>);

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
          <p className="text-neutral-600">
            {authStatus === 'loading' ? 'Checking authentication...' : 'Loading integrations...'}
          </p>
        </div>
      </div>
    );
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Integrations' },
  ];

  return (
    <AdminShell
      title="Integrations | POD N BEYOND Admin"
      breadcrumbs={breadcrumbs}
    >
      <PageHeader
        title="Integrations"
        subtitle="Manage API keys, credentials, and enable or disable integrations."
        secondaryActions={
          <a href="/admin/communication-hub">
            <Button variant="secondary" size="sm">
              Communication Hub
            </Button>
          </a>
        }
      />

      <Container>
        <div className="py-8">

          {/* Error and success messages now use toast notifications */}

          {/* Available Providers to Add - Redesigned as List */}
          {Object.keys(groupedAvailableProviders).length > 0 && (
            <>
              {Object.entries(groupedAvailableProviders).map(([category, providers]) => (
                <Card key={`available-${category}`} className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">
                      <span className={`px-2 py-1 rounded text-sm ${getCategoryColor(category)}`}>
                        {category}
                      </span>
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {providers.map(({ providerKey, name, description }) => {
                      const isEditing = selectedIntegration?.provider === providerKey && selectedIntegration.id === -1;
                      return (
                        <div key={providerKey}>
                          <div
                            className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg text-neutral-900">{name}</h3>
                                  <Badge variant="neutral">Not Configured</Badge>
                                </div>
                                {description && (
                                  <p className="text-sm text-neutral-600">{description}</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => {
                                    if (isEditing) {
                                      setShowForm(false);
                                      setFormData(null);
                                      setSelectedIntegration(null);
                                    } else {
                                      handleCreate(providerKey);
                                    }
                                  }}
                                >
                                  {isEditing ? 'Cancel' : 'Enable & Configure'}
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Inline Configure Form for New Integrations */}
                          {isEditing && showForm && formData && (
                            <div className="mt-4 border-t border-neutral-200 pt-4">
                              <Card className="border-2 border-blue-200 bg-blue-50/30">
                                <div className="flex justify-between items-center mb-4 pb-3 border-b border-neutral-200">
                                  <div>
                                    <h3 className="text-lg font-bold text-neutral-900">
                                      Configure {formData.name}
                                    </h3>
                                    <p className="text-sm text-neutral-500 mt-0.5">
                                      {formData.category} • {formData.provider}
                                    </p>
                                  </div>
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
                                      {saving ? 'Saving...' : 'Save & Enable'}
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
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </>
          )}

          {/* Empty State */}
          {Object.keys(groupedIntegrations).length === 0 && integrations.length === 0 && !loading && (
            <Card>
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Integrations Configured</h3>
                <p className="text-neutral-500 mb-4">
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
                  <div key={integration.id}>
                    <div
                      className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors"
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
                            <p className="text-sm text-neutral-600 mb-2">{integration.description}</p>
                          )}
                          {integration.lastError && (
                            <p className="text-sm text-red-600 mb-2">
                              Last Error: {integration.lastError}
                            </p>
                          )}
                          {integration.lastTestedAt && (
                            <p className="text-xs text-neutral-500">
                              Last tested: {new Date(integration.lastTestedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              if (selectedIntegration?.id === integration.id) {
                                setShowForm(false);
                                setFormData(null);
                                setSelectedIntegration(null);
                              } else {
                                handleEdit(integration);
                              }
                            }}
                          >
                            {selectedIntegration?.id === integration.id ? 'Cancel' : 'Edit'}
                          </Button>
                          <Button
                            variant={integration.enabled ? 'secondary' : 'primary'}
                            size="sm"
                            onClick={() => handleToggle(integration.provider, integration.enabled)}
                            disabled={selectedIntegration?.id === integration.id}
                          >
                            {integration.enabled ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleTest(integration.provider)}
                            disabled={testing === integration.provider || selectedIntegration?.id === integration.id}
                          >
                            {testing === integration.provider ? 'Testing...' : 'Test'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Inline Edit Form */}
                    {selectedIntegration?.id === integration.id && showForm && formData && (
                      <div className="mt-4 border-t border-neutral-200 pt-4">
                        <Card className="border-2 border-blue-200 bg-blue-50/30">
                          <div className="flex justify-between items-center mb-4 pb-3 border-b border-neutral-200">
                            <div>
                              <h3 className="text-lg font-bold text-neutral-900">
                                Edit {formData.name}
                              </h3>
                              <p className="text-sm text-neutral-500 mt-0.5">
                                {formData.category} • {formData.provider}
                              </p>
                            </div>
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
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </AdminShell>
  );
}

