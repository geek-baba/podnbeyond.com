import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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

export default function EmailCenter() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [threadEmails, setThreadEmails] = useState<EmailDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Reply form
  const [replyForm, setReplyForm] = useState({
    subject: '',
    htmlBody: '',
    textBody: '',
  });

  // Check authorization
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      const userRoles = (session as any)?.user?.roles || [];
      const isAdmin = userRoles.some((r: any) => 
        ['ADMIN', 'SUPERADMIN', 'MANAGER'].includes(r.key || r.roleKey)
      );
      
      if (!isAdmin && session?.user?.email !== 'admin@podnbeyond.com') {
        router.push('/admin/forbidden');
      }
    }
  }, [status, session, router]);

  // Load threads
  useEffect(() => {
    if (status === 'authenticated') {
      loadThreads();
    }
  }, [status]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/api/email/threads');
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
      const response = await fetch(`http://localhost:4000/api/email/threads/${threadId}`);
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
      const response = await fetch('http://localhost:4000/api/email/send', {
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
        <title>Email Center | POD N BEYOND Admin</title>
        <meta name="description" content="Email management for POD N BEYOND" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo-podnbeyond.png" />
      </Head>

      <Header />

      {/* Email Center Header */}
      <section className="pt-24 pb-8 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
        <Container>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Email Center</h1>
              <p className="text-neutral-300">Manage guest communications</p>
            </div>
            <Button variant="primary" onClick={loadThreads}>
              Refresh
            </Button>
          </div>
        </Container>
      </section>

      {/* Email Interface */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Thread List */}
            <div className="lg:col-span-1">
              <Card variant="default" padding="lg">
                <h2 className="text-xl font-bold text-neutral-900 mb-4">
                  Conversations ({threads.length})
                </h2>

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
                          <h3 className={`font-semibold text-sm line-clamp-1 ${
                            selectedThread?.id === thread.id ? 'text-white' : 'text-neutral-900'
                          }`}>
                            {thread.subject}
                          </h3>
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
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                      {selectedThread.subject}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {selectedThread.participants.map((email, idx) => (
                        <Badge key={idx} variant="neutral">
                          {email}
                        </Badge>
                      ))}
                    </div>
                  </Card>

                  {/* Email Messages */}
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
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
                    <h3 className="text-lg font-bold text-neutral-900 mb-4">Reply</h3>
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

                      <div className="flex space-x-3">
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={sending}
                          fullWidth
                        >
                          {sending ? 'Sending...' : 'Send Reply'}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setReplyForm({ subject: replyForm.subject, htmlBody: '', textBody: '' })}
                        >
                          Clear
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
        </Container>
      </section>

      <Footer />
    </div>
  );
}

