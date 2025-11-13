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
  const [conversationDetailsLoading, setConversationDetailsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [properties, setProperties] = useState<Array<{ id: number; name: string; slug: string }>>([]);
  const [selectedConversationIds, setSelectedConversationIds] = useState<Set<number>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '' as ConversationStatus | '',
    assignedTo: '',
    propertyId: '',
    search: '',
    channel: '' as MessageChannel | '',
  });
  const [integrations, setIntegrations] = useState<{ 
    postmark?: { enabled: boolean; status?: string };
    gupshup?: { enabled: boolean; status?: string };
    exotel?: { enabled: boolean; status?: string };
  }>({});
  const [quickReplyTemplates, setQuickReplyTemplates] = useState<Array<{ id: number; name: string; type: string; channel: MessageChannel; body: string; subject: string | null }>>([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  
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

  // Real-time updates setup
  useEffect(() => {
    if (authStatus !== 'authenticated' || !session?.user?.id) return;

    // Close existing connection if any
    if (eventSource) {
      eventSource.close();
    }

    // Create new EventSource connection
    // Note: EventSource doesn't support custom headers, so we use query param for auth
    // In production, the cookie should work, but for development we need the token in URL
    const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('pod-session-token') : null;
    const eventUrl = sessionToken 
      ? `/api/realtime/events?userId=${session.user.id}&token=${encodeURIComponent(sessionToken)}`
      : `/api/realtime/events?userId=${session.user.id}`;
    const es = new EventSource(eventUrl);
    setEventSource(es);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'conversation_updated') {
          // Reload conversations if current conversation was updated
          if (selectedConversation?.id === data.conversationId) {
            loadConversationDetails(data.conversationId);
          }
          loadConversations();
          
          // Show desktop notification for new messages
          if (data.unreadCount > 0 && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('New Message', {
              body: `You have ${data.unreadCount} unread message(s)`,
              icon: '/logo-podnbeyond.png',
            });
          }
        } else if (data.type === 'new_conversation') {
          // Reload conversations to show new one
          loadConversations();
          
          // Show desktop notification if assigned to current user
          if (data.assignedTo === session?.user?.id && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('New Conversation', {
              body: 'A new conversation has been assigned to you',
              icon: '/logo-podnbeyond.png',
            });
          }
        } else if (data.type === 'unread_count') {
          // Update unread count - handled by reloading conversations
        }
      } catch (error) {
        console.error('Error parsing real-time event:', error);
      }
    };

    es.onerror = (error) => {
      console.error('EventSource error:', error);
      // Reconnect after 5 seconds
      setTimeout(() => {
        if (authStatus === 'authenticated' && session?.user?.id) {
          es.close();
          const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('pod-session-token') : null;
          const eventUrl = sessionToken 
            ? `/api/realtime/events?userId=${session.user.id}&token=${encodeURIComponent(sessionToken)}`
            : `/api/realtime/events?userId=${session.user.id}`;
          const newEs = new EventSource(eventUrl);
          setEventSource(newEs);
        }
      }, 5000);
    };

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Cleanup on unmount
    return () => {
      es.close();
    };
  }, [authStatus, session?.user?.id]);

  // Load conversations and integrations
  useEffect(() => {
    if (authStatus === 'authenticated') {
      loadConversations();
      loadIntegrations();
      loadProperties();
    }
  }, [authStatus, filters]);

  useEffect(() => {
    // Auto-select first conversation only once when conversations first load
    // Don't re-trigger if already loading, if there's a selection, or if we've already auto-selected
    if (
      !loading &&
      !conversationDetailsLoading &&
      conversations.length > 0 &&
      !selectedConversation &&
      !hasAutoSelected
    ) {
      const firstConversationId = conversations[0]?.id;
      if (firstConversationId) {
        console.log('Auto-selecting first conversation:', firstConversationId);
        setHasAutoSelected(true); // Mark as auto-selected to prevent re-triggering
        loadConversationDetails(firstConversationId, false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loading,
    conversationDetailsLoading,
    conversations.length, // Only depend on length to avoid re-triggering when array reference changes
  ]);

  // Helper function to get auth headers
  const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (typeof window !== 'undefined') {
      const sessionToken = localStorage.getItem('pod-session-token');
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
    }
    return headers;
  };

  const loadIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations', {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success && data.integrations) {
        const postmark = data.integrations.find((i: any) => i.provider === 'POSTMARK');
        const gupshup = data.integrations.find((i: any) => i.provider === 'GUPSHUP');
        const exotel = data.integrations.find((i: any) => i.provider === 'EXOTEL');
        setIntegrations({
          postmark: postmark ? { enabled: postmark.enabled, status: postmark.status } : undefined,
          gupshup: gupshup ? { enabled: gupshup.enabled, status: gupshup.status } : undefined,
          exotel: exotel ? { enabled: exotel.enabled, status: exotel.status } : undefined,
        });
      }
    } catch (error) {
      console.error('Failed to load integrations:', error);
    }
  };

  const loadProperties = async () => {
    try {
      const response = await fetch('/api/properties', {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success && data.properties) {
        setProperties(data.properties.map((p: any) => ({ id: p.id, name: p.name, slug: p.slug })));
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
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
      
      // Note: userId is not needed in query params as it's extracted from the authenticated session
      // The backend gets userId from req.user.id (set by authenticate middleware)
      
      console.log('Loading conversations with params:', params.toString());
      const response = await fetch(`/api/conversations?${params.toString()}`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
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

  const loadConversationDetails = async (conversationId: number, showErrors = true) => {
    try {
      // Note: userId is not needed in query params as it's extracted from the authenticated session
      // The backend gets userId from req.user.id (set by authenticate middleware)
      setConversationDetailsLoading(true);

      console.log(`Loading conversation details for ID: ${conversationId}`);
      const response = await fetch(`/api/conversations/${conversationId}`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      
      console.log(`Response status: ${response.status}, ok: ${response.ok}`);
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        throw new Error(`Invalid response from server (HTTP ${response.status})`);
      }
      
      if (!response.ok) {
        const errorMessage = data.error || data.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('API error response:', { status: response.status, data });
        throw new Error(errorMessage);
      }
      
      if (!data.success) {
        const errorMessage = data.error || data.message || 'Failed to load conversation';
        console.error('API returned success: false:', data);
        throw new Error(errorMessage);
      }

      console.log('Conversation loaded successfully:', data.conversation?.id);
      setSelectedConversation(data.conversation);
      // Mark as auto-selected if this was the first auto-selection
      if (!hasAutoSelected) {
        setHasAutoSelected(true);
      }
      
      // Mark as read when viewing
      if (data.conversation.unreadCount > 0) {
        try {
          await fetch(`/api/conversations/${conversationId}/mark-read`, {
            method: 'POST',
            credentials: 'include',
            headers: getAuthHeaders(),
          });
          // Update local state
          setConversations(prev => prev.map(c => 
            c.id === conversationId ? { ...c, unreadCount: 0 } : c
          ));
        } catch (error) {
          console.error('Failed to mark as read:', error);
        }
      }
      
      // Load guest context if we have a participant email or booking
      const identifier = data.conversation.participants[0] || 
                        (data.conversation.booking?.email) ||
                        (data.conversation.messages.find((m: any) => m.from)?.from);
      if (identifier) {
        loadGuestContext(identifier);
      }
      
      // Load quick reply templates for this conversation
      loadQuickReplyTemplates(data.conversation);
    } catch (error) {
      console.error('Failed to load conversation details:', error);
      console.error('Error details:', {
        conversationId,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : typeof error,
      });
      
      // Don't update selectedConversation on error - keep current selection if any
      // setSelectedConversation(null); // Commented out to prevent clearing current selection
      
      if (showErrors) {
        // Only show alert for actual errors, not for intentional silent failures
        const errorMessage = error instanceof Error
          ? error.message
          : 'Failed to load conversation details. Please try again.';
        
        // Check if it's a network error
        if (error instanceof TypeError && error.message.includes('fetch')) {
          alert('Network error: Could not connect to the server. Please check your connection and try again.');
        } else {
          alert(errorMessage);
        }
      }
    } finally {
      setConversationDetailsLoading(false);
    }
  };

  const loadGuestContext = async (identifier: string) => {
    try {
      const response = await fetch(`/api/guest-context/${encodeURIComponent(identifier)}`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setGuestContext(data.guest);
      }
    } catch (error) {
      console.error('Failed to load guest context:', error);
    }
  };

  const loadQuickReplyTemplates = async (conversation: ConversationDetail) => {
    try {
      const params = new URLSearchParams();
      params.append('isActive', 'true');
      
      // Filter by property if conversation has one
      if (conversation.property?.id) {
        params.append('propertyId', conversation.property.id.toString());
      }
      
      // Filter by channel based on conversation's primary channel
      const channelMap: Record<MessageChannel, string> = {
        EMAIL: 'EMAIL',
        WHATSAPP: 'WHATSAPP',
        SMS: 'SMS',
        VOICE: 'WHATSAPP', // Voice conversations can use WhatsApp templates
      };
      params.append('channel', channelMap[conversation.primaryChannel] || 'WHATSAPP');
      
      const response = await fetch(`/api/templates?${params.toString()}`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        // Get templates that are relevant for quick replies (FAQ, CUSTOM, or matching type)
        const relevantTemplates = data.templates.filter((t: any) => 
          t.type === 'FAQ' || 
          t.type === 'CUSTOM' ||
          (conversation.booking && t.type === 'BOOKING_CONFIRMATION')
        ).slice(0, 5); // Limit to 5 quick replies
        setQuickReplyTemplates(relevantTemplates);
      }
    } catch (error) {
      console.error('Failed to load quick reply templates:', error);
    }
  };

  const useQuickReply = async (template: { id: number; body: string; subject: string | null; channel: MessageChannel }) => {
    if (!selectedConversation?.booking?.id) {
      alert('This template requires a booking. Please select a conversation with a booking.');
      return;
    }
    
    try {
      setLoadingTemplate(true);
      const response = await fetch(`/api/templates/${template.id}/preview`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({ bookingId: selectedConversation.booking.id }),
      });
      
      const data = await response.json();
      if (data.success) {
        // Set the channel based on template
        const channelMap: Record<MessageChannel, 'whatsapp' | 'sms' | 'email'> = {
          WHATSAPP: 'whatsapp',
          SMS: 'sms',
          EMAIL: 'email',
          VOICE: 'whatsapp',
        };
        
        setReplyForm({
          message: data.preview.body,
          channel: channelMap[template.channel] || 'whatsapp',
        });
        
        // If email, we might want to set subject too, but for now just the body
        // The subject will be handled in the sendReply function
      } else {
        alert(`Failed to load template: ${data.error}`);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Failed to load template');
    } finally {
      setLoadingTemplate(false);
    }
  };

  const updateStatus = async (conversationId: number, status: ConversationStatus) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/status`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
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
      const response = await fetch(`/api/conversations/${conversationId}/priority`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
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
      const response = await fetch(`/api/conversations/${conversationId}/assign`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
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

  const toggleConversationSelection = (id: number) => {
    setSelectedConversationIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllConversations = () => {
    if (selectedConversationIds.size === conversations.length) {
      setSelectedConversationIds(new Set());
    } else {
      setSelectedConversationIds(new Set(conversations.map(c => c.id)));
    }
  };

  const performBulkAction = async (action: 'assign' | 'status' | 'archive', value?: string) => {
    if (selectedConversationIds.size === 0) {
      alert('Please select at least one conversation');
      return;
    }

    if (!confirm(`Are you sure you want to ${action} ${selectedConversationIds.size} conversation(s)?`)) {
      return;
    }

    try {
      setBulkActionLoading(true);
      const response = await fetch('/api/conversations/bulk', {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          conversationIds: Array.from(selectedConversationIds),
          action,
          value: value || (action === 'assign' ? session?.user?.id : undefined),
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadConversations();
        setSelectedConversationIds(new Set());
        if (selectedConversation?.id && selectedConversationIds.has(selectedConversation.id)) {
          await loadConversationDetails(selectedConversation.id);
        }
        alert(`Successfully ${action}ed ${data.updated} conversation(s)`);
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      alert('Failed to perform bulk action');
    } finally {
      setBulkActionLoading(false);
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
          credentials: 'include',
          headers: getAuthHeaders(),
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
          credentials: 'include',
          headers: getAuthHeaders(),
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
      const response = await fetch(`/api/conversations/${selectedConversation.id}/notes`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
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

  const getStatusColor = (status: ConversationStatus): 'neutral' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'NEW': return 'neutral';
      case 'IN_PROGRESS': return 'neutral'; // Changed from 'primary' to 'neutral'
      case 'WAITING_FOR_GUEST': return 'warning';
      case 'RESOLVED': return 'success';
      case 'ARCHIVED': return 'neutral';
      default: return 'neutral';
    }
  };

  const getPriorityColor = (priority: Priority): 'neutral' | 'success' | 'warning' | 'error' => {
    switch (priority) {
      case 'LOW': return 'neutral';
      case 'NORMAL': return 'neutral'; // Changed from 'primary' to 'neutral'
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
              <p className="text-neutral-300 text-sm mb-3">Unified conversations across email, WhatsApp, SMS, and voice</p>
              {/* Integration Status Indicators */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <a href="/admin/integrations" className="text-neutral-300 hover:text-white transition-colors flex items-center gap-1">
                    <span>📧</span>
                    <span>Email</span>
                  </a>
                  <span className="text-neutral-400">(</span>
                  <a 
                    href="https://account.postmarkapp.com/servers" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-neutral-300 hover:text-white transition-colors"
                  >
                    Postmark
                  </a>
                  <span className="text-neutral-400">)</span>
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    integrations.postmark?.enabled ? 'bg-green-500' : 'bg-amber-500'
                  }`} title={integrations.postmark?.enabled ? 'Active' : 'Not Configured'}></span>
                </div>
                <div className="flex items-center gap-2">
                  <a href="/admin/integrations" className="text-neutral-300 hover:text-white transition-colors flex items-center gap-1">
                    <span>💬</span>
                    <span>WhatsApp</span>
                  </a>
                  <span className="text-neutral-400">(</span>
                  <a 
                    href="https://apps.gupshup.io/whatsapp/dashboard" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-neutral-300 hover:text-white transition-colors"
                  >
                    Gupshup
                  </a>
                  <span className="text-neutral-400">)</span>
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    integrations.gupshup?.enabled ? 'bg-green-500' : 'bg-amber-500'
                  }`} title={integrations.gupshup?.enabled ? 'Active' : 'Not Configured'}></span>
                </div>
                <div className="flex items-center gap-2">
                  <a href="/admin/integrations" className="text-neutral-300 hover:text-white transition-colors flex items-center gap-1">
                    <span>📞</span>
                    <span>Voice & SMS</span>
                  </a>
                  <span className="text-neutral-400">(</span>
                  <a 
                    href="https://my.exotel.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-neutral-300 hover:text-white transition-colors"
                  >
                    Exotel
                  </a>
                  <span className="text-neutral-400">)</span>
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    integrations.exotel?.enabled ? 'bg-green-500' : 'bg-amber-500'
                  }`} title={integrations.exotel?.enabled ? 'Active' : 'Not Configured'}></span>
                </div>
              </div>
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
            <a href="/admin/templates">
              <button className={`px-6 py-2 rounded-button font-semibold transition-all ${
                router.asPath?.startsWith('/admin/templates')
                  ? 'bg-white text-neutral-900'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900'
              }`}>
                📝 Templates
              </button>
            </a>
            <a href="/admin/analytics">
              <button className={`px-6 py-2 rounded-button font-semibold transition-all ${
                router.asPath?.startsWith('/admin/analytics')
                  ? 'bg-white text-neutral-900'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900'
              }`}>
                📊 Analytics
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <select
                      value={filters.propertyId}
                      onChange={(e) => setFilters({...filters, propertyId: e.target.value})}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                    >
                      <option value="">All Properties</option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id.toString()}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            {/* 3-Column Layout: Conversations List | Main View | Guest Context */}
            {/* Mobile: Stacked, Desktop: 3 columns */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              {/* Left Sidebar: Conversation List */}
              <div className="xl:col-span-3 order-1">
                <Card variant="default" padding="lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-neutral-900">
                      Conversations ({conversations.length})
                    </h3>
                    {conversations.length > 0 && (
                      <button
                        onClick={selectAllConversations}
                        className="text-sm text-neutral-600 hover:text-neutral-900"
                      >
                        {selectedConversationIds.size === conversations.length ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>

                  {/* Bulk Actions Bar */}
                  {selectedConversationIds.size > 0 && (
                    <div className="mb-4 p-3 bg-neutral-100 rounded-lg flex flex-wrap gap-2">
                      <span className="text-sm font-semibold text-neutral-700 w-full">
                        {selectedConversationIds.size} selected
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => performBulkAction('assign')}
                        disabled={bulkActionLoading}
                      >
                        Assign to Me
                      </Button>
                      <select
                        onChange={(e) => e.target.value && performBulkAction('status', e.target.value)}
                        className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        defaultValue=""
                        disabled={bulkActionLoading}
                      >
                        <option value="">Change Status</option>
                        <option value="NEW">New</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="WAITING_FOR_GUEST">Waiting for Guest</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="ARCHIVED">Archive</option>
                      </select>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => performBulkAction('archive')}
                        disabled={bulkActionLoading}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Archive
                      </Button>
                    </div>
                  )}

                  <div className="space-y-3 max-h-[400px] xl:max-h-[700px] overflow-y-auto">
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
                          className={`p-4 rounded-lg transition-all border cursor-pointer ${
                            selectedConversation?.id === conv.id
                              ? 'bg-neutral-900 text-white border-neutral-900'
                              : 'bg-white hover:bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selectedConversationIds.has(conv.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleConversationSelection(conv.id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1 w-4 h-4 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-900 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`font-semibold text-sm line-clamp-1 flex-1 ${
                                      selectedConversation?.id === conv.id ? 'text-white' : 'text-neutral-900'
                                    }`}>
                                      {getChannelIcon(conv.primaryChannel)} {conv.subject}
                                    </h4>
                                    {conv.unreadCount > 0 && (
                                      <Badge variant="warning" size="sm">
                                        {conv.unreadCount}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant={getStatusColor(conv.status)} size="sm">
                                      {conv.status.replace(/_/g, ' ')}
                                    </Badge>
                                    <Badge variant={getPriorityColor(conv.priority)} size="sm">
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
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>

              {/* Center: Main Conversation View */}
              <div className="xl:col-span-6 order-2">
                {conversationDetailsLoading && !selectedConversation ? (
                  <Card variant="default" padding="lg">
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-neutral-900 mx-auto mb-4"></div>
                      <p className="text-neutral-600 font-semibold mb-2">
                        Loading conversation...
                      </p>
                      <p className="text-sm text-neutral-500">
                        Please wait while we fetch the conversation details.
                      </p>
                    </div>
                  </Card>
                ) : selectedConversation ? (
                  <div className="space-y-4">
                    {/* Conversation Header */}
                    <Card variant="default" padding="lg">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                            {getChannelIcon(selectedConversation.primaryChannel)} {selectedConversation.subject}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant={getStatusColor(selectedConversation.status)}>
                              {selectedConversation.status.replace(/_/g, ' ')}
                            </Badge>
                            <Badge variant={getPriorityColor(selectedConversation.priority)}>
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
                      <div className="space-y-4 max-h-[300px] xl:max-h-[400px] overflow-y-auto pr-1">
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

                    {/* Quick Reply Templates */}
                    {quickReplyTemplates.length > 0 && (
                      <Card variant="default" padding="md">
                        <h4 className="text-sm font-semibold text-neutral-700 mb-3">Quick Replies</h4>
                        <div className="flex flex-wrap gap-2">
                          {quickReplyTemplates.map((template) => (
                            <Button
                              key={template.id}
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => useQuickReply(template)}
                              disabled={loadingTemplate || !selectedConversation?.booking?.id}
                              title={selectedConversation?.booking?.id ? `Use template: ${template.name}` : 'Requires a booking'}
                            >
                              {template.name}
                            </Button>
                          ))}
                        </div>
                      </Card>
                    )}

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
              <div className="xl:col-span-3 order-3">
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

          </div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}
