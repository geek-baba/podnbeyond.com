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

type MessageTemplateType = 'BOOKING_CONFIRMATION' | 'CHECK_IN' | 'CHECK_OUT' | 'CANCELLATION' | 'FAQ' | 'CUSTOM';
type MessageChannel = 'WHATSAPP' | 'SMS' | 'EMAIL';

interface Template {
  id: number;
  name: string;
  type: MessageTemplateType;
  channel: MessageChannel;
  subject: string | null;
  body: string;
  variables: string[];
  propertyId: number | null;
  property: { id: number; name: string; slug: string } | null;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TemplateVariable {
  name: string;
  description: string;
}

export default function TemplatesPage() {
  const { data: session, status: authStatus, signOut } = useAuth();
  const router = useRouter();
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [properties, setProperties] = useState<Array<{ id: number; name: string }>>([]);
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewData, setPreviewData] = useState<{ subject: string | null; body: string } | null>(null);
  const [previewBookingId, setPreviewBookingId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'BOOKING_CONFIRMATION' as MessageTemplateType,
    channel: 'WHATSAPP' as MessageChannel,
    subject: '',
    body: '',
    propertyId: '',
    description: '',
    isActive: true,
  });

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

  // Load data
  useEffect(() => {
    if (authStatus === 'authenticated') {
      loadTemplates();
      loadProperties();
      loadVariables();
    }
  }, [authStatus]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      const response = await fetch('/api/properties');
      const data = await response.json();
      if (data.success) {
        setProperties(data.properties.map((p: any) => ({ id: p.id, name: p.name })));
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
    }
  };

  const loadVariables = async () => {
    try {
      const response = await fetch('/api/templates/variables');
      const data = await response.json();
      if (data.success) {
        setVariables(data.variables);
      }
    } catch (error) {
      console.error('Failed to load variables:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTemplate 
        ? `/api/templates/${editingTemplate.id}`
        : '/api/templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          propertyId: formData.propertyId || null,
          createdBy: session?.user?.id,
          updatedBy: session?.user?.id,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        await loadTemplates();
        setShowModal(false);
        resetForm();
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      if (data.success) {
        await loadTemplates();
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      channel: template.channel,
      subject: template.subject || '',
      body: template.body,
      propertyId: template.propertyId?.toString() || '',
      description: template.description || '',
      isActive: template.isActive,
    });
    setShowModal(true);
  };

  const handlePreview = async () => {
    if (!previewBookingId || !editingTemplate) {
      alert('Please enter a booking ID for preview');
      return;
    }
    
    try {
      const response = await fetch(`/api/templates/${editingTemplate.id}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: parseInt(previewBookingId) }),
      });
      
      const data = await response.json();
      if (data.success) {
        setPreviewData(data.preview);
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error previewing template:', error);
      alert('Failed to preview template');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'BOOKING_CONFIRMATION',
      channel: 'WHATSAPP',
      subject: '',
      body: '',
      propertyId: '',
      description: '',
      isActive: true,
    });
    setEditingTemplate(null);
    setPreviewData(null);
    setPreviewBookingId('');
  };

  const insertVariable = (variableName: string) => {
    const textarea = document.getElementById('template-body') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const variable = `{{${variableName}}}`;
      textarea.value = before + variable + after;
      textarea.selectionStart = textarea.selectionEnd = start + variable.length;
      textarea.focus();
      setFormData({ ...formData, body: textarea.value });
    }
  };

  const getTypeColor = (type: MessageTemplateType) => {
    switch (type) {
      case 'BOOKING_CONFIRMATION': return 'success';
      case 'CHECK_IN': return 'neutral';
      case 'CHECK_OUT': return 'neutral';
      case 'CANCELLATION': return 'error';
      case 'FAQ': return 'warning';
      default: return 'neutral';
    }
  };

  const getChannelIcon = (channel: MessageChannel) => {
    switch (channel) {
      case 'WHATSAPP': return '💬';
      case 'SMS': return '📱';
      case 'EMAIL': return '📧';
      default: return '📨';
    }
  };

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Message Templates | POD</title>
      </Head>
      
      <div className="min-h-screen bg-neutral-50">
        <Header session={session} signOut={signOut} />
        
        <Container>
          <div className="py-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Message Templates</h1>
                <p className="text-neutral-600 mt-1">Manage reusable message templates for bookings and communications</p>
              </div>
              <Button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
              >
                + New Template
              </Button>
            </div>

            {/* Templates List */}
            <Card variant="default" padding="lg">
              <div className="space-y-4">
                {templates.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500">
                    No templates yet. Create your first template to get started.
                  </div>
                ) : (
                  templates.map((template) => (
                    <div
                      key={template.id}
                      className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-neutral-900">
                              {getChannelIcon(template.channel)} {template.name}
                            </h3>
                            <Badge variant={getTypeColor(template.type) as any} size="sm">
                              {template.type.replace(/_/g, ' ')}
                            </Badge>
                            <Badge variant={template.isActive ? 'success' : 'neutral'} size="sm">
                              {template.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {template.property && (
                              <Badge variant="neutral" size="sm">
                                {template.property.name}
                              </Badge>
                            )}
                          </div>
                          {template.description && (
                            <p className="text-sm text-neutral-600 mb-2">{template.description}</p>
                          )}
                          <p className="text-sm text-neutral-500 font-mono line-clamp-2">
                            {template.body.substring(0, 150)}...
                          </p>
                          {template.variables && template.variables.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {template.variables.map((varName) => (
                                <span
                                  key={varName}
                                  className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded"
                                >
                                  {`{{${varName}}}`}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="neutral"
                            size="sm"
                            onClick={() => handleEdit(template)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="error"
                            size="sm"
                            onClick={() => handleDelete(template.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </Container>
        
        <Footer />
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-neutral-900">
                  {editingTemplate ? 'Edit Template' : 'New Template'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-neutral-500 hover:text-neutral-900"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      placeholder="e.g., Booking Confirmation - Standard"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Type *
                    </label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as MessageTemplateType })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    >
                      <option value="BOOKING_CONFIRMATION">Booking Confirmation</option>
                      <option value="CHECK_IN">Check-In</option>
                      <option value="CHECK_OUT">Check-Out</option>
                      <option value="CANCELLATION">Cancellation</option>
                      <option value="FAQ">FAQ</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Channel *
                    </label>
                    <select
                      required
                      value={formData.channel}
                      onChange={(e) => setFormData({ ...formData, channel: e.target.value as MessageChannel })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    >
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="SMS">SMS</option>
                      <option value="EMAIL">Email</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Property (optional)
                    </label>
                    <select
                      value={formData.propertyId}
                      onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    >
                      <option value="">Global (All Properties)</option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id.toString()}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.channel === 'EMAIL' && (
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      required={formData.channel === 'EMAIL'}
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      placeholder="e.g., Booking Confirmation - {{bookingId}}"
                    />
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-neutral-700">
                      Message Body *
                    </label>
                    <div className="text-xs text-neutral-500">
                      Click a variable below to insert it
                    </div>
                  </div>
                  <textarea
                    id="template-body"
                    required
                    rows={8}
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono text-sm"
                    placeholder="Enter your message template. Use {{variableName}} for dynamic content."
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {variables.map((variable) => (
                      <button
                        key={variable.name}
                        type="button"
                        onClick={() => insertVariable(variable.name)}
                        className="text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2 py-1 rounded transition-colors"
                        title={variable.description}
                      >
                        {`{{${variable.name}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    placeholder="Brief description of when to use this template"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isActive" className="text-sm text-neutral-700">
                    Active (template will be available for use)
                  </label>
                </div>

                {editingTemplate && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-neutral-900 mb-2">Preview Template</h3>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="number"
                        value={previewBookingId}
                        onChange={(e) => setPreviewBookingId(e.target.value)}
                        placeholder="Enter Booking ID"
                        className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                      <Button type="button" onClick={handlePreview}>
                        Preview
                      </Button>
                    </div>
                    {previewData && (
                      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                        {previewData.subject && (
                          <div className="mb-2">
                            <strong>Subject:</strong> {previewData.subject}
                          </div>
                        )}
                        <div>
                          <strong>Body:</strong>
                          <pre className="mt-1 whitespace-pre-wrap text-sm">{previewData.body}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="neutral"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

