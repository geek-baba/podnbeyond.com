import { useState, useEffect } from 'react';
import { useAuth } from '../lib/useAuth';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

export default function MemberAccount() {
  const { data: session, status, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState<any[]>([]);
  const [pointsLedger, setPointsLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Don't redirect while still loading
    if (status === 'loading') {
      return;
    }
    
    if (status === 'unauthenticated') {
      router.push('/admin/login?callbackUrl=/account');
    } else if (status === 'authenticated') {
      fetchAccountData();
    }
  }, [status]);

  const fetchAccountData = async () => {
    try {
      // Fetch user's bookings
      const bookingsRes = await fetch('/api/account/bookings');
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(data.bookings || []);
      }

      // Fetch points ledger
      const ledgerRes = await fetch('/api/account/points-ledger');
      if (ledgerRes.ok) {
        const data = await ledgerRes.json();
        setPointsLedger(data.ledger || []);
      }
    } catch (error) {
      console.error('Error fetching account data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const loyaltyAccount = (session as any).user?.loyaltyAccount;

  return (
    <>
      <Head>
        <title>My Account | POD N BEYOND</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo-podnbeyond.png" />
      </Head>

      <div className="min-h-screen bg-neutral-50">
        <Header />

        {/* Header Section */}
        <section className="bg-gradient-to-r from-neutral-900 to-neutral-800 py-12">
          <Container>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">My Account</h1>
                <p className="text-neutral-300">Welcome back, {session.user?.name || session.user?.email}</p>
              </div>
              <Button variant="secondary" onClick={() => signOut({ callbackUrl: '/' })}>
                Sign Out
              </Button>
            </div>
          </Container>
        </section>

        {/* Loyalty Status Card */}
        {loyaltyAccount && (
          <section className="py-8 bg-white border-b border-neutral-200">
            <Container>
              <Card variant="elevated" padding="lg">
                <div className="space-y-6">
                  {/* Member Number */}
                  {loyaltyAccount.memberNumber && (
                    <div className="text-center pb-4 border-b border-neutral-200">
                      <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Member Number</p>
                      <p className="text-lg font-mono font-bold text-neutral-900">{loyaltyAccount.memberNumber}</p>
                    </div>
                  )}
                  
                  {/* Tier, Points, Action */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center md:text-left">
                      <p className="text-sm text-neutral-600 mb-1">Membership Tier</p>
                      <Badge 
                        variant={loyaltyAccount.tier === 'PLATINUM' ? 'neutral' : loyaltyAccount.tier === 'GOLD' ? 'smart' : 'capsule'}
                        size="lg"
                      >
                        {loyaltyAccount.tier}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-neutral-600 mb-1">Points Balance</p>
                      <p className="text-3xl font-bold text-neutral-900">{loyaltyAccount.points?.toLocaleString()}</p>
                    </div>
                    <div className="text-center md:text-right">
                      <a href="/membership">
                        <Button variant="primary">View Benefits</Button>
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            </Container>
          </section>
        )}

        {/* Tabs */}
        <section className="bg-white border-b border-neutral-200 sticky top-0 z-10">
          <Container>
            <div className="flex space-x-8 overflow-x-auto py-4">
              {['overview', 'bookings', 'points', 'profile'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 px-1 font-semibold capitalize whitespace-nowrap transition-colors border-b-2 ${
                    activeTab === tab
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </Container>
        </section>

        {/* Content */}
        <section className="py-12">
          <Container>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-neutral-900">Account Overview</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card variant="default" padding="lg">
                    <p className="text-sm text-neutral-600 mb-2">Total Bookings</p>
                    <p className="text-3xl font-bold text-neutral-900">{bookings.length}</p>
                  </Card>
                  <Card variant="default" padding="lg">
                    <p className="text-sm text-neutral-600 mb-2">Points Earned</p>
                    <p className="text-3xl font-bold text-neutral-900">
                      {pointsLedger.filter(p => p.points > 0).reduce((sum, p) => sum + p.points, 0)}
                    </p>
                  </Card>
                  <Card variant="default" padding="lg">
                    <p className="text-sm text-neutral-600 mb-2">Next Tier</p>
                    <p className="text-lg font-semibold text-neutral-900">
                      {loyaltyAccount?.tier === 'SILVER' ? 'GOLD (2,500 pts)' : 
                       loyaltyAccount?.tier === 'GOLD' ? 'PLATINUM (5,000 pts)' : 
                       'PLATINUM (Achieved!)'}
                    </p>
                  </Card>
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">My Bookings</h2>
                
                {bookings.length === 0 ? (
                  <Card variant="default" padding="lg">
                    <div className="text-center py-12">
                      <p className="text-neutral-600 mb-4">No bookings yet</p>
                      <a href="/book">
                        <Button variant="primary">Book Your First Stay</Button>
                      </a>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking: any) => (
                      <Card key={booking.id} variant="default" padding="lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-lg text-neutral-900">{booking.room?.property?.name}</h3>
                            <p className="text-sm text-neutral-600">{booking.room?.name}</p>
                            <p className="text-sm text-neutral-500 mt-1">
                              {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={
                              booking.status === 'CONFIRMED' ? 'success' :
                              booking.status === 'PENDING' ? 'warning' :
                              booking.status === 'COMPLETED' ? 'neutral' : 'neutral'
                            }>
                              {booking.status}
                            </Badge>
                            <p className="text-lg font-bold text-neutral-900 mt-2">₹{booking.totalPrice.toLocaleString()}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Points Tab */}
            {activeTab === 'points' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-neutral-900">Points History</h2>
                  <p className="text-lg">
                    <span className="text-neutral-600">Current Balance:</span>{' '}
                    <span className="font-bold text-neutral-900">{loyaltyAccount?.points?.toLocaleString()}</span>
                  </p>
                </div>
                
                {pointsLedger.length === 0 ? (
                  <Card variant="default" padding="lg">
                    <div className="text-center py-12 text-neutral-600">
                      No points activity yet. Book a stay to start earning!
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {pointsLedger.map((entry: any) => (
                      <Card key={entry.id} variant="default" padding="md">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-neutral-900">{entry.reason}</p>
                            <p className="text-sm text-neutral-500">{new Date(entry.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${entry.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {entry.points > 0 ? '+' : ''}{entry.points}
                            </p>
                            <p className="text-xs text-neutral-500">Balance: {entry.balanceAfter}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">Profile Information</h2>
                
                <Card variant="default" padding="lg">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={session.user?.name || ''}
                        readOnly
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg bg-neutral-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={session.user?.email || ''}
                        readOnly
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg bg-neutral-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={(session.user as any)?.phone || ''}
                        readOnly
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg bg-neutral-50"
                      />
                    </div>
                    <p className="text-sm text-neutral-600">
                      To update your profile, please contact support at{' '}
                      <a href="mailto:info@podnbeyond.com" className="text-neutral-900 hover:underline">
                        info@podnbeyond.com
                      </a>
                    </p>
                  </div>
                </Card>
              </div>
            )}
          </Container>
        </section>

        <Footer />
      </div>
    </>
  );
}

