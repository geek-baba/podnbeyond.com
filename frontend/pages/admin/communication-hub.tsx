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

interface Thread {
  id: number;
  subject: string;
  participants: string[];
  lastMessageAt: string;
  isArchived: boolean;
  _count: { emails: number };
  emails: Array<{
    id: number;
    fromEmail: string;
    fromName: string | null;
    subject: string;
    textBody: string | null;
    createdAt: string;
  }>;
}

interface EmailDetail {
  id: number;
  fromEmail: string;
  fromName: string | null;
  toEmails: string[];
  subject: string;
  htmlBody: string | null;
  textBody: string | null;
  createdAt: string;
  status: string;
  direction: string;
  attachments: Array<{
    id: number;
    filename: string;
    contentType: string;
    size: number;
  }>;
  events: Array<{
    id: number;
    eventType: string;
    timestamp: string;
    recipient: string | null;
  }>;
}

export default function CommunicationHub() {
  const { data: session, status, signOut } = useAuth();
  const router = useRouter();
  
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [threadEmails, setThreadEmails] = useState<EmailDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [integrations, setIntegrations] = useState<{ gupshup?: { enabled: boolean; status: string }; exotel?: { enabled: boolean; status: string } }>({});
  
  // Reply form
  const [replyForm, setReplyForm] = useState({
    subject: '',
    htmlBody: '',
    textBody: '',
  });

  // Check authorization - ONLY redirect if definitely unauthenticated (not loading)
  useEffect(() => {
    // Don't redirect while still loading
    if (status === 'loading') {
      return;
    }
    
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

  // Load threads and integrations
  useEffect(() => {
    if (status === 'authenticated') {
      loadThreads();
      loadIntegrations();
    }
  }, [status]);

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

  const loadThreads = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/email/threads');
      const data = await response.json();
      setThreads(data.threads || []);
    } catch (error) {
      console.error('Failed to load threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadThreadDetails = async (threadId: number) => {
    try {
      const response = await fetch(`/api/email/threads/${threadId}`);
      const data = await response.json();
      setSelectedThread(data.thread);
      setThreadEmails(data.thread.emails || []);
      
      // Pre-fill reply subject
      if (data.thread.subject && !data.thread.subject.startsWith('Re:')) {
        setReplyForm(prev => ({ ...prev, subject: `Re: ${data.thread.subject}` }));
      } else {
        setReplyForm(prev => ({ ...prev, subject: data.thread.subject }));
      }
    } catch (error) {
      console.error('Failed to load thread details:', error);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread) return;

    setSending(true);
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedThread.participants.filter(p => 
            p !== (process.env.NEXT_PUBLIC_MAIL_FROM || 'support@capsulepodhotel.com')
          ),
          subject: replyForm.subject,
          htmlBody: replyForm.htmlBody || `<p>${replyForm.textBody}</p>`,
          textBody: replyForm.textBody,
          threadId: selectedThread.id,
          tag: 'admin-reply',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Reload thread details
        await loadThreadDetails(selectedThread.id);
        setReplyForm({ subject: replyForm.subject, htmlBody: '', textBody: '' });
        alert('Reply sent successfully!');
      } else {
        alert(`Failed to send: ${data.error}`);
      }
    } catch (error) {
      console.error('Reply error:', error);
      alert('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading Email Center...</p>
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
              <h1 className="text-3xl font-bold mb-1">Communication Hub</h1>
              <p className="text-neutral-300 text-sm">Centralize conversations across email, WhatsApp, and voice</p>
            </div>
          </div>

          {/* Header Tabs - Like Communication Hub */}
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
              onClick={loadThreads}
              className="px-6 py-2 rounded-button font-semibold transition-all bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900"
            >
              🔄 Refresh Inbox
            </button>
          </div>
        </Container>
      </section>

      {/* Communication Hub Body */}
      <section className="py-10">
        <Container>
          <div className="space-y-10">
            {/* Email Workspace */}
            <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm">
              <div className="px-6 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">📧 Email Inbox</h2>
                  <p className="text-neutral-600">
                    Monitor inbound messages from guests and respond with shared visibility for the whole team.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="neutral" size="sm">
                    {threads.length} Thread{threads.length === 1 ? '' : 's'}
                  </Badge>
                  {selectedThread && (
                    <Badge variant="neutral" size="sm">
                      Active Conversation
                    </Badge>
                  )}
                </div>
              </div>
              <div className="px-6 pb-6 pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Thread List */}
                  <div className="lg:col-span-1">
                    <Card variant="default" padding="lg">
                      <h3 className="text-lg font-bold text-neutral-900 mb-4">
                        Conversations ({threads.length})
                      </h3>

                      <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {threads.length === 0 ? (
                          <div className="text-center py-8 text-neutral-500">
                            <p>No email conversations yet</p>
                            <p className="text-sm mt-2">Inbound emails will appear here</p>
                          </div>
                        ) : (
                          threads.map((thread) => (
                            <div
                              key={thread.id}
                              onClick={() => loadThreadDetails(thread.id)}
                              className={`p-4 rounded-lg cursor-pointer transition-all ${
                                selectedThread?.id === thread.id
                                  ? 'bg-neutral-900 text-white'
                                  : 'bg-neutral-50 hover:bg-neutral-100'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className={`font-semibold text-sm line-clamp-1 ${
                                  selectedThread?.id === thread.id ? 'text-white' : 'text-neutral-900'
                                }`}>
                                  {thread.subject}
                                </h4>
                                <Badge variant="neutral" size="sm">
                                  {thread._count.emails}
                                </Badge>
                              </div>
                              <p className={`text-xs mb-1 ${
                                selectedThread?.id === thread.id ? 'text-neutral-300' : 'text-neutral-600'
                              }`}>
                                {thread.participants.slice(0, 2).join(', ')}
                                {thread.participants.length > 2 && ` +${thread.participants.length - 2}`}
                              </p>
                              <p className={`text-xs ${
                                selectedThread?.id === thread.id ? 'text-neutral-400' : 'text-neutral-500'
                              }`}>
                                {new Date(thread.lastMessageAt).toLocaleString()}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Email Thread View */}
                  <div className="lg:col-span-2">
                    {selectedThread ? (
                      <div className="space-y-4">
                        {/* Thread Header */}
                        <Card variant="default" padding="lg">
                          <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                            {selectedThread.subject}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedThread.participants.map((email, idx) => (
                              <Badge key={idx} variant="neutral">
                                {email}
                              </Badge>
                            ))}
                          </div>
                        </Card>

                        {/* Email Messages */}
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                          {threadEmails.map((email) => (
                            <Card
                              key={email.id}
                              variant={email.direction === 'INBOUND' ? 'bordered' : 'default'}
                              padding="lg"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className="font-bold text-neutral-900">
                                    {email.fromName || email.fromEmail}
                                  </p>
                                  <p className="text-sm text-neutral-600">{email.fromEmail}</p>
                                </div>
                                <div className="text-right">
                                  <Badge variant={email.direction === 'INBOUND' ? 'success' : 'neutral'}>
                                    {email.direction}
                                  </Badge>
                                  <p className="text-xs text-neutral-500 mt-1">
                                    {new Date(email.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              <div className="text-sm text-neutral-700 whitespace-pre-wrap">
                                {email.textBody || 'No text content'}
                              </div>

                              {email.attachments && email.attachments.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-neutral-200">
                                  <p className="text-xs font-semibold text-neutral-700 mb-2">
                                    Attachments ({email.attachments.length})
                                  </p>
                                  {email.attachments.map((att) => (
                                    <div
                                      key={att.id}
                                      className="text-xs text-neutral-600 flex items-center space-x-2"
                                    >
                                      <span>📎</span>
                                      <span>{att.filename}</span>
                                      <span className="text-neutral-400">
                                        ({(att.size / 1024).toFixed(1)} KB)
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {email.events && email.events.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-neutral-200">
                                  <p className="text-xs font-semibold text-neutral-700 mb-2">Events</p>
                                  <div className="flex flex-wrap gap-2">
                                    {email.events.map((evt) => (
                                      <Badge key={evt.id} variant="success" size="sm">
                                        {evt.eventType}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>

                        {/* Reply Form */}
                        <Card variant="default" padding="lg">
                          <h4 className="text-lg font-bold text-neutral-900 mb-4">Reply</h4>
                          <form onSubmit={handleReply} className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                Subject
                              </label>
                              <input
                                type="text"
                                value={replyForm.subject}
                                onChange={(e) => setReplyForm({...replyForm, subject: e.target.value})}
                                required
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                Message
                              </label>
                              <textarea
                                value={replyForm.textBody}
                                onChange={(e) => setReplyForm({...replyForm, textBody: e.target.value})}
                                required
                                rows={8}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                                placeholder="Type your reply..."
                              />
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setReplyForm({ subject: replyForm.subject, htmlBody: '', textBody: '' })}
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
                      </div>
                    ) : (
                      <Card variant="default" padding="lg">
                        <div className="text-center py-12">
                          <svg className="w-16 h-16 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <p className="text-neutral-600 font-semibold mb-2">No conversation selected</p>
                          <p className="text-sm text-neutral-500">Select a conversation to view and reply</p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Integrated Channels */}
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
                
                {/* Quick Actions */}
                <div className="mt-6 space-y-3">
                  {integrations.gupshup?.enabled ? (
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
                              body: JSON.stringify({
                                phone,
                                message,
                                channel: 'whatsapp',
                              }),
                            });
                            const data = await response.json();
                            if (data.success) {
                              alert('WhatsApp message sent!');
                              phoneInput.value = '';
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
                  ) : (
                    <div className="text-sm text-neutral-500 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                      <p className="mb-2">Gupshup integration is not configured.</p>
                      <a href="/admin/integrations" className="text-blue-600 hover:underline">
                        Configure Gupshup integration →
                      </a>
                    </div>
                  )}
                </div>
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
                
                {/* Quick Actions */}
                <div className="mt-6 space-y-3">
                  {integrations.exotel?.enabled ? (
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
                              body: JSON.stringify({
                                guestPhone,
                              }),
                            });
                            const data = await response.json();
                            if (data.success) {
                              alert('Call initiated! Connecting guest to reception...');
                              phoneInput.value = '';
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
                  ) : (
                    <div className="text-sm text-neutral-500 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                      <p className="mb-2">Exotel integration is not configured.</p>
                      <a href="/admin/integrations" className="text-blue-600 hover:underline">
                        Configure Exotel integration →
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Collaboration & Uptime Notes */}
            <Card variant="bordered" padding="lg">
              <h3 className="text-xl font-bold text-neutral-900 mb-3">Operational Notes</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-neutral-600">
                <div>
                  <h4 className="font-semibold text-neutral-800 mb-1">Multi-Agent Ready</h4>
                  <p>All actions are recorded server-side so multiple staff members can triage simultaneously
                    without losing thread context.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-800 mb-1">Channel Roadmap</h4>
                  <p>Email is live today. WhatsApp (Gupshup) and Voice/SMS (Exotel) are queued next with unified
                    logging and SLA tracking.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-800 mb-1">Extensibility</h4>
                  <p>Each module will expose APIs for automations (e.g., loyalty triggers, booking updates) so guest
                    communication stays in sync across systems.</p>
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}

