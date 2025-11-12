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

type ConversationStatus = 'NEW' | 'IN_PROGRESS' | 'WAITING_FOR_GUEST' | 'RESOLVED' | 'ARCHIVED';
type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
type MessageChannel = 'EMAIL' | 'WHATSAPP' | 'SMS' | 'VOICE';

interface UnifiedMessage {
  id: string;
  type: 'EMAIL' | 'MESSAGE' | 'CALL';
  channel: MessageChannel;
  direction: 'INBOUND' | 'OUTBOUND';
  content: string;
  from: string;
  fromName?: string;
  to?: string;
  timestamp: string;
  status: string;
  attachments?: Array<{ id: number; filename: string; contentType: string; size: number }>;
  events?: Array<{ id: number; eventType: string; timestamp: string }>;
  duration?: number;
  recordingUrl?: string;
  providerMessageId?: string;
  providerCallId?: string;
}

interface Conversation {
  id: number;
  subject: string;
  participants: string[];
  lastMessageAt: string;
  lastActivity: string;
  isArchived: boolean;
  status: ConversationStatus;
  assignedTo: string | null;
  assignedUser: { id: string; name: string; email: string } | null;
  priority: Priority;
  property: { id: number; name: string; slug: string } | null;
  booking: { id: number; guestName: string; checkIn: string; checkOut: string } | null;
  primaryChannel: MessageChannel;
  sla: {
    breached: boolean;
    minutesSinceCreation: number;
    targetMinutes: number;
  };
  unreadCount: number;
  _count: {
    emails: number;
    messageLogs: number;
    callLogs: number;
    notes: number;
  };
}

interface ConversationDetail extends Conversation {
  messages: UnifiedMessage[];
  notes: Array<{
    id: number;
    content: string;
    author: { id: string; name: string; email: string };
    createdAt: string;
  }>;
}

export default function CommunicationHub() {
  const { data: session, status: authStatus, signOut } = useAuth();
  const router = useRouter();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
  const [guestContext, setGuestContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filters, setFilters] = useState({
    status: '' as ConversationStatus | '',
    assignedTo: '',
    propertyId: '',
    search: '',
    channel: '' as MessageChannel | '',
  });
  const [integrations, setIntegrations] = useState<{ gupshup?: { enabled: boolean; status: string }; exotel?: { enabled: boolean; status: string } }>({});
  
  // Reply form
  const [replyForm, setReplyForm] = useState({
    message: '',
    channel: 'whatsapp' as 'whatsapp' | 'sms' | 'email',
  });

  // Note form
  const [noteForm, setNoteForm] = useState({
    content: '',
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

  // Load conversations and integrations
  useEffect(() => {
    if (authStatus === 'authenticated') {
      loadConversations();
      loadIntegrations();
    }
  }, [authStatus, filters]);

  const loadIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations');
      const data = await response.json();
      if (data.success && data.integrations) {
        const gupshup = data.integrations.find((i: any) => i.provider === 'GUPSHUP');
        const exotel = data.integrations.find((i: any) => i.provider === 'EXOTEL');
        setIntegrations({
          gupshup: gupshup ? { enabled: gupshup.enabled, status: gupshup.status } : undefined,
          exotel: exotel ? { enabled: exotel.enabled, status: exotel.status } : undefined,
        });
      }
    } catch (error) {
      console.error('Failed to load integrations:', error);
    }
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
      if (filters.propertyId) params.append('propertyId', filters.propertyId);
      if (filters.search) params.append('search', filters.search);
      if (filters.channel) params.append('channel', filters.channel);
      
      // Get user ID from session - try multiple possible locations
      const userId = (session as any)?.user?.id || (session as any)?.id || session?.user?.email;
      if (userId) {
        params.append('userId', userId);
      } else {
        console.warn('No user ID found in session:', session);
      }

      console.log('Loading conversations with params:', params.toString());
      const response = await fetch(`/api/conversations?${params.toString()}`);
      const data = await response.json();
      console.log('Conversations API response:', data);
      if (data.success) {
        setConversations(data.conversations || []);
      } else {
        console.error('Failed to load conversations:', data.error);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversationDetails = async (conversationId: number) => {
    try {
      const params = new URLSearchParams();
      if (session?.user?.id) params.append('userId', session.user.id);
      const response = await fetch(`/api/conversations/${conversationId}?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setSelectedConversation(data.conversation);
        
        // Load guest context if we have a participant email or booking
        const identifier = data.conversation.participants[0] || 
                          (data.conversation.booking?.email) ||
                          (data.conversation.messages.find((m: any) => m.from)?.from);
        if (identifier) {
          loadGuestContext(identifier);
        }
      } else {
        console.error('Failed to load conversation details:', data.error);
      }
    } catch (error) {
      console.error('Failed to load conversation details:', error);
    }
  };

  const loadGuestContext = async (identifier: string) => {
    try {
      const response = await fetch(`/api/guest-context/${encodeURIComponent(identifier)}`);
      const data = await response.json();
      if (data.success) {
        setGuestContext(data.guest);
      }
    } catch (error) {
      console.error('Failed to load guest context:', error);
    }
  };

  const updateStatus = async (conversationId: number, status: ConversationStatus) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/status?userId=${session?.user?.id || ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) {
        await loadConversationDetails(conversationId);
        await loadConversations();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    }
  };

  const updatePriority = async (conversationId: number, priority: Priority) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/priority?userId=${session?.user?.id || ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority }),
      });
      const data = await response.json();
      if (data.success) {
        await loadConversationDetails(conversationId);
        await loadConversations();
      }
    } catch (error) {
      console.error('Failed to update priority:', error);
      alert('Failed to update priority');
    }
  };

  const assignConversation = async (conversationId: number, assignedTo: string | null) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/assign?userId=${session?.user?.id || ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo }),
      });
      const data = await response.json();
      if (data.success) {
        await loadConversationDetails(conversationId);
        await loadConversations();
      }
    } catch (error) {
      console.error('Failed to assign conversation:', error);
      alert('Failed to assign conversation');
    }
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !replyForm.message) return;

    setSending(true);
    try {
      if (replyForm.channel === 'email') {
        // Email reply
        const response = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: selectedConversation.participants.filter(p => 
              p !== (process.env.NEXT_PUBLIC_MAIL_FROM || 'support@capsulepodhotel.com')
            ),
            subject: selectedConversation.subject.startsWith('Re:') 
              ? selectedConversation.subject 
              : `Re: ${selectedConversation.subject}`,
            textBody: replyForm.message,
            threadId: selectedConversation.id,
            tag: 'admin-reply',
          }),
        });
        const data = await response.json();
        if (data.success) {
          await loadConversationDetails(selectedConversation.id);
          setReplyForm({ message: '', channel: 'whatsapp' });
        } else {
          alert(`Failed: ${data.error}`);
        }
      } else {
        // WhatsApp/SMS
        const phone = selectedConversation.participants.find(p => /\+?\d/.test(p)) || 
                     selectedConversation.messages.find(m => m.type === 'MESSAGE' || m.type === 'CALL')?.from;
        if (!phone) {
          alert('No phone number found for this conversation');
          return;
        }

        const response = await fetch('/api/notify/booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone,
            message: replyForm.message,
            channel: replyForm.channel,
            bookingId: selectedConversation.booking?.id,
            propertyId: selectedConversation.property?.id,
          }),
        });
        const data = await response.json();
        if (data.success) {
          await loadConversationDetails(selectedConversation.id);
          setReplyForm({ message: '', channel: 'whatsapp' });
        } else {
          alert(`Failed: ${data.error}`);
        }
      }
    } catch (error) {
      console.error('Reply error:', error);
      alert('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !noteForm.content) return;

    try {
      const response = await fetch(`/api/conversations/${selectedConversation.id}/notes?userId=${session?.user?.id || ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteForm.content }),
      });
      const data = await response.json();
      if (data.success) {
        await loadConversationDetails(selectedConversation.id);
        setNoteForm({ content: '' });
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Note error:', error);
      alert('Failed to add note');
    }
  };

  const getStatusColor = (status: ConversationStatus) => {
    switch (status) {
      case 'NEW': return 'neutral';
      case 'IN_PROGRESS': return 'primary';
      case 'WAITING_FOR_GUEST': return 'warning';
      case 'RESOLVED': return 'success';
      case 'ARCHIVED': return 'neutral';
      default: return 'neutral';
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'LOW': return 'neutral';
      case 'NORMAL': return 'primary';
      case 'HIGH': return 'warning';
      case 'URGENT': return 'error';
      default: return 'neutral';
    }
  };

  const getChannelIcon = (channel: MessageChannel) => {
    switch (channel) {
      case 'EMAIL': return '📧';
      case 'WHATSAPP': return '💬';
      case 'SMS': return '📱';
      case 'VOICE': return '📞';
      default: return '💬';
    }
  };

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
          <p className="text-neutral-600">
            {authStatus === 'loading' ? 'Checking authentication...' : 'Loading Communication Hub...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Head>
        <title>Communication Hub | POD N BEYOND Admin</title>
        <meta name="description" content="Unified guest communications for POD N BEYOND" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo-podnbeyond.png" />
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

            <div className="text-right">
              <h1 className="text-3xl font-bold mb-1">Communication Hub</h1>
              <p className="text-neutral-300 text-sm">Unified conversations across email, WhatsApp, SMS, and voice</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <a href="/admin/communication-hub">
              <button className={`px-6 py-2 rounded-button font-semibold transition-all ${
                router.asPath?.startsWith('/admin/communication-hub')
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
            <button 
              onClick={loadConversations}
              className="px-6 py-2 rounded-button font-semibold transition-all bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900"
            >
              🔄 Refresh
            </button>
          </div>
        </Container>
      </section>

      {/* Communication Hub Body */}
      <section className="py-10">
        <Container>
          <div className="space-y-6">
            {/* Filters & Search */}
            <Card variant="default" padding="lg">
              <div className="space-y-4">
                {/* Search Bar */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Search</label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    placeholder="Search conversations, guests, subjects..."
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                
                {/* Filter Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value as ConversationStatus | ''})}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    >
                      <option value="">All Statuses</option>
                      <option value="NEW">New</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="WAITING_FOR_GUEST">Waiting for Guest</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Channel</label>
                    <select
                      value={filters.channel}
                      onChange={(e) => setFilters({...filters, channel: e.target.value as MessageChannel | ''})}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    >
                      <option value="">All Channels</option>
                      <option value="EMAIL">Email</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="SMS">SMS</option>
                      <option value="VOICE">Voice</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Assignment</label>
                    <select
                      value={filters.assignedTo}
                      onChange={(e) => setFilters({...filters, assignedTo: e.target.value})}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    >
                      <option value="">All</option>
                      <option value="me">Assigned to Me</option>
                      <option value="unassigned">Unassigned</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Property</label>
                    <input
                      type="number"
                      value={filters.propertyId}
                      onChange={(e) => setFilters({...filters, propertyId: e.target.value})}
                      placeholder="Property ID"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* 3-Column Layout: Conversations List | Main View | Guest Context */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Sidebar: Conversation List */}
              <div className="lg:col-span-3">
                <Card variant="default" padding="lg">
                  <h3 className="text-lg font-bold text-neutral-900 mb-4">
                    Conversations ({conversations.length})
                  </h3>

                  <div className="space-y-3 max-h-[700px] overflow-y-auto">
                    {conversations.length === 0 ? (
                      <div className="text-center py-8 text-neutral-500">
                        <p>No conversations yet</p>
                        <p className="text-sm mt-2">Inbound messages will appear here</p>
                      </div>
                    ) : (
                      conversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => loadConversationDetails(conv.id)}
                          className={`p-4 rounded-lg cursor-pointer transition-all border ${
                            selectedConversation?.id === conv.id
                              ? 'bg-neutral-900 text-white border-neutral-900'
                              : 'bg-white hover:bg-neutral-50 border-neutral-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={`font-semibold text-sm line-clamp-1 flex-1 ${
                                  selectedConversation?.id === conv.id ? 'text-white' : 'text-neutral-900'
                                }`}>
                                  {getChannelIcon(conv.primaryChannel)} {conv.subject}
                                </h4>
                                {conv.unreadCount > 0 && (
                                  <Badge variant="primary" size="sm">
                                    {conv.unreadCount}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant={getStatusColor(conv.status) as any} size="sm">
                                  {conv.status.replace(/_/g, ' ')}
                                </Badge>
                                <Badge variant={getPriorityColor(conv.priority) as any} size="sm">
                                  {conv.priority}
                                </Badge>
                                {conv.sla.breached && (
                                  <Badge variant="error" size="sm">SLA Breached</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className={`text-xs mb-1 ${
                            selectedConversation?.id === conv.id ? 'text-neutral-300' : 'text-neutral-600'
                          }`}>
                            {conv.property?.name || 'No Property'} • {conv.participants[0] || 'Unknown'}
                          </p>
                          <p className={`text-xs ${
                            selectedConversation?.id === conv.id ? 'text-neutral-400' : 'text-neutral-500'
                          }`}>
                            {new Date(conv.lastActivity).toLocaleString()}
                          </p>
                          {conv.assignedUser && (
                            <p className={`text-xs mt-1 ${
                              selectedConversation?.id === conv.id ? 'text-neutral-400' : 'text-neutral-500'
                            }`}>
                              👤 {conv.assignedUser.name}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>

              {/* Center: Main Conversation View */}
              <div className="lg:col-span-6">
                {selectedConversation ? (
                  <div className="space-y-4">
                    {/* Conversation Header */}
                    <Card variant="default" padding="lg">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                            {getChannelIcon(selectedConversation.primaryChannel)} {selectedConversation.subject}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant={getStatusColor(selectedConversation.status) as any}>
                              {selectedConversation.status.replace(/_/g, ' ')}
                            </Badge>
                            <Badge variant={getPriorityColor(selectedConversation.priority) as any}>
                              {selectedConversation.priority}
                            </Badge>
                            {selectedConversation.sla.breached && (
                              <Badge variant="error">⚠️ SLA Breached ({selectedConversation.sla.minutesSinceCreation}m / {selectedConversation.sla.targetMinutes}m)</Badge>
                            )}
                            {selectedConversation.property && (
                              <Badge variant="neutral">{selectedConversation.property.name}</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedConversation.participants.map((email, idx) => (
                              <Badge key={idx} variant="neutral" size="sm">
                                {email}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 pt-4 border-t border-neutral-200">
                        <select
                          value={selectedConversation.status}
                          onChange={(e) => updateStatus(selectedConversation.id, e.target.value as ConversationStatus)}
                          className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        >
                          <option value="NEW">New</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="WAITING_FOR_GUEST">Waiting for Guest</option>
                          <option value="RESOLVED">Resolved</option>
                        </select>
                        <select
                          value={selectedConversation.priority}
                          onChange={(e) => updatePriority(selectedConversation.id, e.target.value as Priority)}
                          className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        >
                          <option value="LOW">Low</option>
                          <option value="NORMAL">Normal</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => assignConversation(selectedConversation.id, selectedConversation.assignedTo ? null : (session?.user?.id || null))}
                        >
                          {selectedConversation.assignedTo ? 'Unassign' : 'Assign to Me'}
                        </Button>
                      </div>
                    </Card>

                    {/* Unified Message Timeline */}
                    <Card variant="default" padding="lg">
                      <h4 className="text-lg font-bold text-neutral-900 mb-4">Message Timeline</h4>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                        {selectedConversation.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`p-4 rounded-lg border ${
                              message.direction === 'INBOUND'
                                ? 'bg-neutral-50 border-neutral-200'
                                : 'bg-white border-neutral-300'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{getChannelIcon(message.channel)}</span>
                                  <p className="font-bold text-neutral-900">
                                    {message.fromName || message.from}
                                  </p>
                                  <Badge variant={message.direction === 'INBOUND' ? 'success' : 'neutral'} size="sm">
                                    {message.direction}
                                  </Badge>
                                </div>
                                {message.to && (
                                  <p className="text-sm text-neutral-600 mt-1">To: {message.to}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-neutral-500">
                                  {new Date(message.timestamp).toLocaleString()}
                                </p>
                                {message.duration && (
                                  <p className="text-xs text-neutral-500 mt-1">Duration: {message.duration}s</p>
                                )}
                              </div>
                            </div>

                            <div className="text-sm text-neutral-700 whitespace-pre-wrap mb-2">
                              {message.content}
                            </div>

                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-neutral-200">
                                <p className="text-xs font-semibold text-neutral-700 mb-1">
                                  Attachments ({message.attachments.length})
                                </p>
                                {message.attachments.map((att) => (
                                  <div key={att.id} className="text-xs text-neutral-600 flex items-center space-x-2">
                                    <span>📎</span>
                                    <span>{att.filename}</span>
                                    <span className="text-neutral-400">({(att.size / 1024).toFixed(1)} KB)</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {message.recordingUrl && (
                              <div className="mt-2">
                                <a href={message.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                  🎙️ Listen to Recording
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Reply Form */}
                    <Card variant="default" padding="lg">
                      <h4 className="text-lg font-bold text-neutral-900 mb-4">Send Reply</h4>
                      <form onSubmit={sendReply} className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-neutral-700 mb-2">Channel</label>
                          <select
                            value={replyForm.channel}
                            onChange={(e) => setReplyForm({...replyForm, channel: e.target.value as 'whatsapp' | 'sms' | 'email'})}
                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          >
                            <option value="whatsapp">WhatsApp</option>
                            <option value="sms">SMS</option>
                            <option value="email">Email</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-neutral-700 mb-2">Message</label>
                          <textarea
                            value={replyForm.message}
                            onChange={(e) => setReplyForm({...replyForm, message: e.target.value})}
                            required
                            rows={6}
                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                            placeholder="Type your reply..."
                          />
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setReplyForm({ message: '', channel: 'whatsapp' })}
                          >
                            Clear
                          </Button>
                          <Button
                            type="submit"
                            variant="primary"
                            disabled={sending}
                          >
                            {sending ? 'Sending...' : 'Send Reply'}
                          </Button>
                        </div>
                      </form>
                    </Card>

                    {/* Internal Notes */}
                    <Card variant="default" padding="lg">
                      <h4 className="text-lg font-bold text-neutral-900 mb-4">
                        Internal Notes ({selectedConversation.notes.length})
                      </h4>
                      <div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto">
                        {selectedConversation.notes.map((note) => (
                          <div key={note.id} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                            <div className="flex items-start justify-between mb-2">
                              <p className="font-semibold text-sm text-neutral-900">{note.author.name}</p>
                              <p className="text-xs text-neutral-500">
                                {new Date(note.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <p className="text-sm text-neutral-700 whitespace-pre-wrap">{note.content}</p>
                          </div>
                        ))}
                      </div>
                      <form onSubmit={addNote} className="space-y-3">
                        <textarea
                          value={noteForm.content}
                          onChange={(e) => setNoteForm({ content: e.target.value })}
                          required
                          rows={3}
                          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          placeholder="Add an internal note (not visible to guest)..."
                        />
                        <div className="flex justify-end">
                          <Button type="submit" variant="secondary" size="sm">
                            Add Note
                          </Button>
                        </div>
                      </form>
                    </Card>
                  </div>
                ) : (
                  <Card variant="default" padding="lg">
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-neutral-600 font-semibold mb-2">No conversation selected</p>
                      <p className="text-sm text-neutral-500">Select a conversation to view and reply</p>
                    </div>
                  </Card>
                )}
              </div>

              {/* Right Sidebar: Guest Context Panel */}
              <div className="lg:col-span-3">
                {guestContext ? (
                  <div className="space-y-4">
                    {/* Contact Info */}
                    <Card variant="default" padding="lg">
                      <h4 className="text-lg font-bold text-neutral-900 mb-4">Guest Information</h4>
                      {guestContext.contact && (
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-semibold text-neutral-700">Name</p>
                            <p className="text-neutral-900">{guestContext.contact.name || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-neutral-700">Email</p>
                            <p className="text-neutral-900">{guestContext.contact.email || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-neutral-700">Phone</p>
                            <p className="text-neutral-900">{guestContext.contact.phone || 'Not provided'}</p>
                          </div>
                        </div>
                      )}
                    </Card>

                    {/* Active Bookings */}
                    {guestContext.bookings && guestContext.bookings.length > 0 && (
                      <Card variant="default" padding="lg">
                        <h4 className="text-lg font-bold text-neutral-900 mb-4">
                          Bookings ({guestContext.stats?.totalBookings || 0})
                        </h4>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                          {guestContext.bookings.slice(0, 5).map((booking: any) => (
                            <div key={booking.id} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="font-semibold text-sm text-neutral-900">{booking.property?.name}</p>
                                  <p className="text-xs text-neutral-600">
                                    {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge variant={booking.status === 'CONFIRMED' ? 'success' : 'neutral'} size="sm">
                                  {booking.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => window.open(`/admin/bookings/${booking.id}`, '_blank')}
                                >
                                  View Booking
                                </Button>
                                {booking.status === 'CONFIRMED' && (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={async () => {
                                      const phone = booking.phone || guestContext.contact?.phone;
                                      if (!phone) {
                                        alert('No phone number available');
                                        return;
                                      }
                                      const message = `Hi ${booking.guestName}, your booking #${booking.id} is confirmed. Check-in: ${new Date(booking.checkIn).toLocaleDateString()}. We look forward to hosting you!`;
                                      try {
                                        const response = await fetch('/api/notify/booking', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            bookingId: booking.id,
                                            message,
                                            channel: 'whatsapp',
                                          }),
                                        });
                                        const data = await response.json();
                                        if (data.success) {
                                          alert('Confirmation sent!');
                                        } else {
                                          alert(`Failed: ${data.error}`);
                                        }
                                      } catch (error) {
                                        alert('Failed to send confirmation');
                                      }
                                    }}
                                  >
                                    Send Confirmation
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Statistics */}
                    {guestContext.stats && (
                      <Card variant="default" padding="lg">
                        <h4 className="text-lg font-bold text-neutral-900 mb-4">Statistics</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-neutral-50 rounded-lg">
                            <p className="text-xs text-neutral-600">Total Bookings</p>
                            <p className="text-2xl font-bold text-neutral-900">{guestContext.stats.totalBookings}</p>
                          </div>
                          <div className="p-3 bg-neutral-50 rounded-lg">
                            <p className="text-xs text-neutral-600">Active</p>
                            <p className="text-2xl font-bold text-neutral-900">{guestContext.stats.activeBookings}</p>
                          </div>
                          <div className="p-3 bg-neutral-50 rounded-lg">
                            <p className="text-xs text-neutral-600">Conversations</p>
                            <p className="text-2xl font-bold text-neutral-900">{guestContext.stats.totalConversations}</p>
                          </div>
                          <div className="p-3 bg-neutral-50 rounded-lg">
                            <p className="text-xs text-neutral-600">Open</p>
                            <p className="text-2xl font-bold text-neutral-900">{guestContext.stats.openConversations}</p>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Recent Activity */}
                    {guestContext.recentActivity && (
                      <Card variant="default" padding="lg">
                        <h4 className="text-lg font-bold text-neutral-900 mb-4">Recent Activity (30 days)</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-neutral-600">Messages</span>
                            <span className="font-semibold">{guestContext.recentActivity.messages}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-neutral-600">Calls</span>
                            <span className="font-semibold">{guestContext.recentActivity.calls}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-neutral-600">Emails</span>
                            <span className="font-semibold">{guestContext.recentActivity.emails}</span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                ) : selectedConversation ? (
                  <Card variant="default" padding="lg">
                    <div className="text-center py-8 text-neutral-500">
                      <p className="text-sm">Loading guest context...</p>
                    </div>
                  </Card>
                ) : (
                  <Card variant="default" padding="lg">
                    <div className="text-center py-8 text-neutral-500">
                      <p className="text-sm">Select a conversation to view guest context</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>

            {/* Quick Actions - Integrated Channels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* WhatsApp via Gupshup */}
              <Card variant="default" padding="lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900">💬 WhatsApp (Gupshup)</h3>
                    <p className="text-neutral-600 mt-1">
                      Send WhatsApp messages and SMS via Gupshup. Track delivery status and manage guest conversations.
                    </p>
                  </div>
                  {integrations.gupshup?.enabled ? (
                    <Badge variant="success" size="sm">Active</Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">Not Configured</Badge>
                  )}
                </div>
                
                {integrations.gupshup?.enabled && (
                  <div className="mt-6 space-y-3">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="tel"
                          id="whatsapp-phone"
                          placeholder="+91 98765 43210"
                          className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={async () => {
                            const phoneInput = document.getElementById('whatsapp-phone') as HTMLInputElement;
                            const phone = phoneInput?.value;
                            if (!phone) {
                              alert('Please enter a phone number');
                              return;
                            }
                            const message = prompt('Enter message:');
                            if (!message) return;
                            
                            try {
                              const response = await fetch('/api/notify/booking', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ phone, message, channel: 'whatsapp' }),
                              });
                              const data = await response.json();
                              if (data.success) {
                                alert('WhatsApp message sent!');
                                phoneInput.value = '';
                                loadConversations();
                              } else {
                                alert(`Failed: ${data.error}`);
                              }
                            } catch (error) {
                              alert('Failed to send message');
                            }
                          }}
                        >
                          Send WhatsApp
                        </Button>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.open('https://apps.gupshup.io/whatsapp/dashboard', '_blank')}
                      >
                        Open Gupshup Dashboard
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Voice & SMS via Exotel */}
              <Card variant="default" padding="lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900">📞 Voice & SMS (Exotel)</h3>
                    <p className="text-neutral-600 mt-1">
                      Initiate bridged calls between guests and reception. Track call logs and manage voice communications.
                    </p>
                  </div>
                  {integrations.exotel?.enabled ? (
                    <Badge variant="success" size="sm">Active</Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">Not Configured</Badge>
                  )}
                </div>
                
                {integrations.exotel?.enabled && (
                  <div className="mt-6 space-y-3">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="tel"
                          id="call-phone"
                          placeholder="+91 98765 43210"
                          className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={async () => {
                            const phoneInput = document.getElementById('call-phone') as HTMLInputElement;
                            const guestPhone = phoneInput?.value;
                            if (!guestPhone) {
                              alert('Please enter a guest phone number');
                              return;
                            }
                            
                            try {
                              const response = await fetch('/api/voice/call-reception', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ guestPhone }),
                              });
                              const data = await response.json();
                              if (data.success) {
                                alert('Call initiated! Connecting guest to reception...');
                                phoneInput.value = '';
                                loadConversations();
                              } else {
                                alert(`Failed: ${data.error}`);
                              }
                            } catch (error) {
                              alert('Failed to initiate call');
                            }
                          }}
                        >
                          📞 Call Reception
                        </Button>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.open('https://my.exotel.com/', '_blank')}
                      >
                        Open Exotel Console
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}
