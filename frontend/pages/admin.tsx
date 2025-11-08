import { useState, useEffect } from 'react';
import { useAuth } from '../lib/useAuth';
import Head from 'next/head';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

interface AdminDashboardProps {
  brands: any[];
  properties: any[];
  bookings: any[];
  loyalty: any[];
  users: any[];
  stats: {
    brands: number;
    properties: number;
    bookings: number;
    loyalty: number;
    users: number;
  };
}

export default function AdminDashboard({ brands, properties, bookings, loyalty, users, stats }: AdminDashboardProps) {
  const { data: session, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTime, setCurrentTime] = useState('');
  const defaultPropertyId = properties?.[0]?.id || null;
  const defaultBrandId = brands?.[0]?.id || null;
  const defaultScopeType: 'PROPERTY' | 'BRAND' | 'ORG' = defaultPropertyId ? 'PROPERTY' : defaultBrandId ? 'BRAND' : 'ORG';
  const defaultScopeId = defaultScopeType === 'PROPERTY' ? defaultPropertyId : defaultScopeType === 'BRAND' ? defaultBrandId : null;
  
  // Payment Gateway Settings
  const [paymentSettings, setPaymentSettings] = useState({
    razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
    isTestMode: true,
    autoCapture: true
  });

  // OTA Channels
  const [otaChannels, setOtaChannels] = useState([
    { id: 1, name: 'Booking.com', enabled: false, connected: false, apiKey: '' },
    { id: 2, name: 'MakeMyTrip', enabled: false, connected: false, apiKey: '' },
    { id: 3, name: 'Airbnb', enabled: false, connected: false, apiKey: '' },
    { id: 4, name: 'Goibibo', enabled: false, connected: false, apiKey: '' },
  ]);

  // User Management - Invite Form
  const [inviteForm, setInviteForm] = useState({
    email: '',
    roleKey: 'STAFF_FRONTDESK',
    scopeType: defaultScopeType,
    scopeId: defaultScopeId
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Loyalty Management
  const [loyaltySearch, setLoyaltySearch] = useState('');
  const [editingMember, setEditingMember] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [bonusStays, setBonusStays] = useState(0);
  const [bonusReason, setBonusReason] = useState('');

  // Users Management
  const [usersList, setUsersList] = useState(users || []);
  const [userSearch, setUserSearch] = useState('');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userRole, setUserRole] = useState('STAFF_FRONTDESK');
  const [userScopeType, setUserScopeType] = useState<'PROPERTY' | 'BRAND' | 'ORG'>('ORG');
  const [userScopeId, setUserScopeId] = useState<number | null>(null);
  const [userPhone, setUserPhone] = useState('');
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    roleKey: 'STAFF_FRONTDESK',
    scopeType: 'PROPERTY',
    scopeId: properties?.[0]?.id || null,
  });

  // Filter loyalty members based on search
  const filteredLoyalty = loyalty.filter(account => {
    if (!loyaltySearch) return true;
    const search = loyaltySearch.toLowerCase();
    return (
      account.userName?.toLowerCase().includes(search) ||
      account.userEmail?.toLowerCase().includes(search) ||
      account.memberNumber?.includes(search)
    );
  });

  const filteredUsers = usersList.filter(user => {
    if (!userSearch) return true;
    const search = userSearch.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(search)) ||
      user.email?.toLowerCase().includes(search) ||
      (user.phone && user.phone.toLowerCase().includes(search)) ||
      user.roleName?.toLowerCase().includes(search)
    );
  });

  // Update time on client side only to avoid hydration mismatch
  useEffect(() => {
    setCurrentTime(new Date().toLocaleString());
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Debug: Log received data
  useEffect(() => {
    console.log('Admin Data Received:', {
      brands: brands?.length,
      properties: properties?.length,
      bookings: bookings?.length,
      loyalty: loyalty?.length,
      users: users?.length,
      stats
    });
  }, [brands, properties, bookings, loyalty, users, stats]);

  useEffect(() => {
    setUsersList(users || []);
  }, [users]);

useEffect(() => {
  if (inviteForm.scopeType === 'PROPERTY') {
    if ((!inviteForm.scopeId || !properties.find(p => p.id === inviteForm.scopeId)) && properties.length > 0) {
      setInviteForm(prev => ({ ...prev, scopeId: properties[0].id }));
    }
  } else if (inviteForm.scopeType === 'BRAND') {
    if ((!inviteForm.scopeId || !brands.find(b => b.id === inviteForm.scopeId)) && brands.length > 0) {
      setInviteForm(prev => ({ ...prev, scopeId: brands[0].id }));
    }
  } else {
    if (inviteForm.scopeId !== null) {
      setInviteForm(prev => ({ ...prev, scopeId: null }));
    }
  }
}, [inviteForm.scopeType, inviteForm.scopeId, properties, brands]);

useEffect(() => {
  if (newUserForm.scopeType === 'PROPERTY') {
    if ((!newUserForm.scopeId || !properties.find(p => p.id === newUserForm.scopeId)) && properties.length > 0) {
      setNewUserForm(prev => ({ ...prev, scopeId: properties[0].id }));
    }
  } else if (newUserForm.scopeType === 'BRAND') {
    if ((!newUserForm.scopeId || !brands.find(b => b.id === newUserForm.scopeId)) && brands.length > 0) {
      setNewUserForm(prev => ({ ...prev, scopeId: brands[0].id }));
    }
  } else {
    if (newUserForm.scopeId !== null) {
      setNewUserForm(prev => ({ ...prev, scopeId: null }));
    }
  }
}, [newUserForm.scopeType, newUserForm.scopeId, properties, brands]);

  // Handle Invite Submission
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteMessage(null);

    try {
      const response = await fetch('http://localhost:4000/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm)
      });

      const data = await response.json();

      if (response.ok) {
        setInviteMessage({ type: 'success', text: `Invite sent to ${inviteForm.email}! Token: ${data.invite.token}` });
        setInviteForm({ email: '', roleKey: 'STAFF_FRONTDESK', scopeType: defaultScopeType, scopeId: defaultScopeId });
      } else {
        setInviteMessage({ type: 'error', text: data.error || 'Failed to send invite' });
      }
    } catch (error) {
      setInviteMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Head>
        <title>Admin Dashboard | POD N BEYOND</title>
        <meta name="description" content="POD N BEYOND Admin Dashboard" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo-podnbeyond.png" />
      </Head>

      <Header />

      {/* Admin Header */}
      <section className="pt-24 pb-8 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
        <Container>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-neutral-300">POD N BEYOND Group Management</p>
            </div>
            <div className="flex items-center space-x-6">
              {/* User Info */}
              <div className="text-right">
                <p className="text-sm text-neutral-400">Signed in as</p>
                <p className="text-white font-semibold">{session?.user?.email || 'Loading...'}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  {(session as any)?.user?.roles?.[0]?.key?.replace(/_/g, ' ') || 'MEMBER'}
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3">
                <a href="/admin/email">
                  <button className="px-6 py-2 bg-white text-neutral-900 rounded-button font-semibold hover:bg-neutral-100 transition-all">
                    📧 Email Center
                  </button>
                </a>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-6 py-2 bg-white/10 border-2 border-white text-white rounded-button font-semibold hover:bg-white hover:text-neutral-900 transition-all"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Tabs */}
      <section className="bg-white border-b border-neutral-200 sticky top-0 z-20">
        <Container>
          <div className="flex space-x-8 overflow-x-auto py-4">
            {['overview', 'brands', 'properties', 'bookings', 'loyalty', 'users', 'cms', 'payment', 'ota'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-1 font-semibold capitalize whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {tab === 'cms' ? 'CMS' : tab === 'ota' ? 'OTA' : tab}
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
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">Dashboard Overview</h2>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <Card variant="default" padding="lg">
                    <div className="text-sm font-semibold text-neutral-600 mb-2">Total Brands</div>
                    <div className="text-4xl font-bold text-capsule-500">{stats.brands}</div>
                    <div className="text-sm text-neutral-500 mt-2">
                      {brands.filter(b => b.status === 'ACTIVE').length} active
                    </div>
                  </Card>

                  <Card variant="default" padding="lg">
                    <div className="text-sm font-semibold text-neutral-600 mb-2">Total Properties</div>
                    <div className="text-4xl font-bold text-smart-500">{stats.properties}</div>
                    <div className="text-sm text-neutral-500 mt-2">
                      Across {brands.length} brands
                    </div>
                  </Card>

                  <Card variant="default" padding="lg">
                    <div className="text-sm font-semibold text-neutral-600 mb-2">Total Bookings</div>
                    <div className="text-4xl font-bold text-sanctuary-500">{bookings?.length || 0}</div>
                    <div className="text-sm text-neutral-500 mt-2">
                      {bookings?.filter(b => b.status === 'CONFIRMED').length || 0} confirmed
                    </div>
                  </Card>

                  <Card variant="default" padding="lg">
                    <div className="text-sm font-semibold text-neutral-600 mb-2">Loyalty Members</div>
                    <div className="text-4xl font-bold text-sauna-500">{loyalty?.length || 0}</div>
                    <div className="text-sm text-neutral-500 mt-2">
                      {loyalty?.filter(l => l.tier === 'PLATINUM').length || 0} platinum
                    </div>
                  </Card>

                  <Card variant="default" padding="lg">
                    <div className="text-sm font-semibold text-neutral-600 mb-2">Staff Members</div>
                    <div className="text-4xl font-bold text-neutral-900">{usersList?.length || 0}</div>
                    <div className="text-sm text-neutral-500 mt-2">
                      {usersList?.filter(u => u.roleKey === 'SUPERADMIN' || u.roleKey === 'ADMIN').length || 0} admins
                    </div>
                  </Card>
                </div>
              </div>

              {/* Recent Bookings */}
              <div>
                <h3 className="text-xl font-bold text-neutral-900 mb-4">Recent Bookings</h3>
                <Card variant="default" padding="none">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-100 border-b border-neutral-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Guest</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Check-in</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Room</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-neutral-200">
                        {bookings && bookings.length > 0 ? bookings.slice(0, 5).map((booking) => (
                          <tr key={booking.id} className="hover:bg-neutral-50">
                            <td className="px-6 py-4">
                              <div className="font-medium text-neutral-900">{booking.guestName}</div>
                              <div className="text-sm text-neutral-500">{booking.email}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-neutral-700">
                              {new Date(booking.checkIn).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-neutral-700">
                              {booking.room?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              <Badge 
                                variant={
                                  booking.status === 'CONFIRMED' ? 'success' :
                                  booking.status === 'PENDING' ? 'warning' :
                                  booking.status === 'CANCELLED' ? 'error' : 'neutral'
                                }
                                size="sm"
                              >
                                {booking.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 font-semibold text-neutral-900">
                              ₹{booking.totalPrice.toLocaleString()}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                              <p className="mb-2">No bookings data available</p>
                              <p className="text-sm">Test data: {bookings?.length || 0} bookings in database</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Brands Tab */}
          {activeTab === 'brands' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Brand Management</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {brands.map((brand) => (
                  <Card key={brand.id} variant="default" padding="lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {brand.logoUrl && (
                          <img src={brand.logoUrl} alt={brand.name} className="h-10" />
                        )}
                        <div>
                          <h3 className="font-bold text-lg text-neutral-900">{brand.name}</h3>
                          <p className="text-sm text-neutral-600">{brand.tagline}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={brand.status === 'ACTIVE' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {brand.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-neutral-600">Properties:</span>
                        <span className="ml-2 font-semibold">{brand._count?.properties || 0}</span>
                      </div>
                      <div>
                        <span className="text-neutral-600">Color:</span>
                        <div className="inline-flex items-center ml-2">
                          <div 
                            className="w-4 h-4 rounded-full border border-neutral-300"
                            style={{ backgroundColor: brand.primaryColor }}
                          />
                        </div>
                      </div>
                    </div>

                    {brand.targetAudience && (
                      <p className="text-sm text-neutral-700 border-t border-neutral-100 pt-4">
                        <span className="font-semibold">Target:</span> {brand.targetAudience}
                      </p>
                    )}

                    <div className="mt-4 pt-4 border-t border-neutral-100">
                      <a href={`/brands/${brand.slug}`}>
                        <Button variant="ghost" size="sm" fullWidth>
                          View Brand Page →
                        </Button>
                      </a>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Property Management</h2>
              
              <div className="grid grid-cols-1 gap-6">
                {properties.map((property) => (
                  <Card key={property.id} variant="default" padding="lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-bold text-xl text-neutral-900">{property.name}</h3>
                          {property.brand && (
                            <Badge variant="neutral" size="sm">{property.brand.name}</Badge>
                          )}
                        </div>
                        <p className="text-neutral-600">
                          📍 {property.address || property.location}, {property.city}, {property.state}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 mb-1">
                          <span className="text-smart-500">⭐</span>
                          <span className="font-semibold">{property.rating}</span>
                          <span className="text-sm text-neutral-500">({property.totalRatings})</span>
                        </div>
                        <Badge variant="success" size="sm">{property.status}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-neutral-600">Rooms:</span>
                        <span className="ml-2 font-semibold">{property._count?.rooms || 0}</span>
                      </div>
                      <div>
                        <span className="text-neutral-600">Phone:</span>
                        <span className="ml-2 font-semibold">{property.phone}</span>
                      </div>
                      <div>
                        <span className="text-neutral-600">Email:</span>
                        <span className="ml-2 font-semibold text-xs">{property.email}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-neutral-100">
                      <a href={`/locations/${property.slug}`} className="flex-1">
                        <Button variant="ghost" size="sm" fullWidth>View Page</Button>
                      </a>
                      <Button variant="primary" size="sm">Edit</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-neutral-900">Bookings Management</h2>
                <div className="text-sm text-neutral-600">
                  Total: {bookings.length} bookings
                </div>
              </div>
              
              <Card variant="default" padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-900 text-white">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">ID</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Guest</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Room</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Check-in</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Nights</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {bookings.map((booking) => {
                        const nights = Math.ceil(
                          (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)
                        );
                        return (
                          <tr key={booking.id} className="hover:bg-neutral-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-mono text-neutral-500">
                              #{booking.id}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-neutral-900">{booking.guestName}</div>
                              <div className="text-sm text-neutral-500">{booking.email}</div>
                              {booking.phone && (
                                <div className="text-xs text-neutral-400">{booking.phone}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-neutral-700">
                              {booking.room?.name || 'N/A'}
                              <div className="text-xs text-neutral-500">{booking.room?.type}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-neutral-700">
                              {new Date(booking.checkIn).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-neutral-700">
                              {nights} {nights === 1 ? 'night' : 'nights'}
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                variant={
                                  booking.status === 'CONFIRMED' ? 'success' :
                                  booking.status === 'PENDING' ? 'warning' :
                                  booking.status === 'CANCELLED' ? 'error' : 'neutral'
                                }
                                size="sm"
                              >
                                {booking.status}
                              </Badge>
                              {booking.externalChannel && (
                                <div className="text-xs text-neutral-500 mt-1">
                                  via {booking.externalChannel}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-neutral-900">₹{booking.totalPrice.toLocaleString()}</div>
                              {booking.specialRequests && (
                                <div className="text-xs text-neutral-500 mt-1">Has special requests</div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {bookings.length === 0 && (
                <div className="text-center py-12 text-neutral-500">
                  No bookings yet. Test data should be seeded.
                </div>
              )}
            </div>
          )}

          {/* Loyalty Tab */}
          {activeTab === 'loyalty' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">Loyalty Program</h2>
                  <div className="text-sm text-neutral-600 mt-1">
                    {loyalty.length} total members
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <Card variant="default" padding="md">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search by name, email, or member number..."
                      value={loyaltySearch}
                      onChange={(e) => setLoyaltySearch(e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                  <div className="text-sm text-neutral-600">
                    {filteredLoyalty.length} results
                  </div>
                </div>
              </Card>

              {/* Members List Table */}
              {filteredLoyalty.length > 0 ? (
                <Card variant="default" padding="none">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            Member
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            Tier
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            Points
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            Stays
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-neutral-200">
                        {filteredLoyalty.map((account) => (
                          <tr key={account.id} className="hover:bg-neutral-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="font-semibold text-neutral-900">
                                  {account.userName || 'N/A'}
                                </div>
                                <div className="text-sm text-neutral-500">
                                  Member #{account.memberNumber}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                <div className="text-neutral-900">{account.userEmail}</div>
                                {account.userPhone && (
                                  <div className="text-neutral-500">{account.userPhone}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge
                                variant={
                                  account.tier === 'PLATINUM' ? 'neutral' :
                                  account.tier === 'GOLD' ? 'smart' : 'capsule'
                                }
                                size="sm"
                              >
                                {account.tier}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="font-semibold text-neutral-900">
                                {account.points.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="text-neutral-900">
                                {account.lifetimeStays || 0}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => {
                                  setEditingMember(account);
                                  setBonusPoints(0);
                                  setBonusStays(0);
                                  setBonusReason('');
                                  setShowEditModal(true);
                                }}
                                className="text-neutral-900 hover:text-neutral-700 font-semibold text-sm"
                              >
                                Manage Member
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  {loyaltySearch ? 'No members found matching your search.' : 'No loyalty members yet.'}
                </div>
              )}
            </div>
          )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">User Management</h2>
              <p className="text-neutral-600 mt-1">Invite staff members, manage permissions, and track access scopes.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <Button variant="secondary" onClick={() => {
                const inviteSection = document.getElementById('invite-staff');
                if (inviteSection) inviteSection.scrollIntoView({ behavior: 'smooth' });
              }}>
                Invite User
              </Button>
              <Button variant="primary" onClick={() => setShowAddUserModal(true)}>
                Add User
              </Button>
            </div>
          </div>

          {/* Search + Summary */}
          <Card variant="default" padding="md">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name, email, phone, or role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div className="text-sm text-neutral-600">
                {filteredUsers.length} of {usersList.length} users
              </div>
            </div>
          </Card>

          {/* Users Table */}
          {filteredUsers.length > 0 ? (
            <Card variant="default" padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Scope</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {filteredUsers.map((user) => {
                      const scopeLabel = user.scopeType === 'ORG'
                        ? 'All Locations'
                        : user.scopeType === 'PROPERTY'
                          ? properties.find(p => p.id === user.scopeId)?.name || `Property #${user.scopeId}`
                          : brands.find(b => b.id === user.scopeId)?.name || `Brand #${user.scopeId}`;

                      return (
                        <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="font-semibold text-neutral-900">{user.name || 'Unnamed User'}</div>
                              <div className="text-sm text-neutral-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="neutral" size="sm">
                              {user.roleName || user.roleKey}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-900">{scopeLabel}</div>
                            <div className="text-xs text-neutral-500 uppercase">{user.scopeType}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-900">{user.phone || '—'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setUserRole(user.roleKey || 'STAFF_FRONTDESK');
                                setUserScopeType(user.scopeType || 'ORG');
                                setUserScopeId(user.scopeType === 'ORG' ? null : user.scopeId || null);
                                setUserPhone(user.phone || '');
                                setShowUserModal(true);
                              }}
                              className="text-neutral-900 hover:text-neutral-700 font-semibold text-sm"
                            >
                              Manage User
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              {userSearch ? 'No users found for this search.' : 'No staff members yet.'}
            </div>
          )}

          {/* Invite Form */}
          <Card id="invite-staff" variant="default" padding="lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-neutral-900">👥 Invite Staff Member</h3>
                <p className="text-neutral-600">Send an invitation to a new team member</p>
              </div>
            </div>

            <form onSubmit={handleInvite} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                  placeholder="staff@podnbeyond.com"
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              {/* Role */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={inviteForm.roleKey}
                    onChange={(e) => setInviteForm({...inviteForm, roleKey: e.target.value})}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="STAFF_FRONTDESK">Front Desk Staff</option>
                    <option value="STAFF_OPS">Operations Staff</option>
                    <option value="MANAGER">Property Manager</option>
                    <option value="ADMIN">Group Administrator</option>
                    <option value="SUPERADMIN">Super Administrator</option>
                  </select>
                </div>

                {/* Scope Type */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Access Scope *
                  </label>
                  <select
                    value={inviteForm.scopeType}
                  onChange={(e) => {
                    const value = e.target.value;
                    setInviteForm({
                      ...inviteForm,
                      scopeType: value,
                      scopeId: value === 'ORG'
                        ? null
                        : value === 'PROPERTY'
                          ? (properties?.[0]?.id || null)
                          : (brands?.[0]?.id || null)
                    });
                  })}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="PROPERTY">Single Property</option>
                    <option value="BRAND">Brand-Wide</option>
                    <option value="ORG">Organization-Wide</option>
                  </select>
                </div>
              </div>

              {/* Scope ID (for property/brand) */}
              {inviteForm.scopeType !== 'ORG' && (
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    {inviteForm.scopeType === 'PROPERTY' ? 'Property' : 'Brand'} *
                  </label>
                  <select
                    value={inviteForm.scopeId}
                    onChange={(e) => {
                      const value = e.target.value;
                      setInviteForm({...inviteForm, scopeId: value ? parseInt(value) : null});
                    })}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    {inviteForm.scopeType === 'PROPERTY' ? (
                      properties.map(prop => (
                        <option key={prop.id} value={prop.id}>{prop.name}</option>
                      ))
                    ) : (
                      brands.map(brand => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))
                    )}
                  </select>
                </div>
              )}

              {/* Success/Error Message */}
              {inviteMessage && (
                <div className={`p-4 rounded-lg ${
                  inviteMessage.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {inviteMessage.text}
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                variant="primary" 
                size="lg" 
                fullWidth
                disabled={inviteLoading}
              >
                {inviteLoading ? 'Sending Invitation...' : 'Send Invitation'}
              </Button>
            </form>
          </Card>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="bordered" padding="lg">
              <h4 className="font-bold text-sm text-neutral-700 mb-2">📧 Invite Process</h4>
              <p className="text-sm text-neutral-600">
                Users receive an email with a secure link valid for 7 days
              </p>
            </Card>
            
            <Card variant="bordered" padding="lg">
              <h4 className="font-bold text-sm text-neutral-700 mb-2">🔒 Security</h4>
              <p className="text-sm text-neutral-600">
                Magic links for authentication - no passwords required
              </p>
            </Card>
            
            <Card variant="bordered" padding="lg">
              <h4 className="font-bold text-sm text-neutral-700 mb-2">⚡ Instant Access</h4>
              <p className="text-sm text-neutral-600">
                Staff can log in immediately after accepting the invite
              </p>
            </Card>
          </div>

          {/* Role Descriptions */}
          <Card variant="default" padding="lg">
            <h3 className="text-xl font-bold text-neutral-900 mb-4">Role Permissions</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-neutral-100 px-3 py-1 rounded-lg font-mono text-sm font-semibold text-neutral-900 mt-0.5">
                  STAFF_FRONTDESK
                </div>
                <p className="text-sm text-neutral-600 flex-1">
                  Check-in/out guests, view bookings, basic room status (property-scoped)
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-neutral-100 px-3 py-1 rounded-lg font-mono text-sm font-semibold text-neutral-900 mt-0.5">
                  STAFF_OPS
                </div>
                <p className="text-sm text-neutral-600 flex-1">
                  Manage inventory, update pricing, room availability (property-scoped)
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-neutral-100 px-3 py-1 rounded-lg font-mono text-sm font-semibold text-neutral-900 mt-0.5">
                  MANAGER
                </div>
                <p className="text-sm text-neutral-600 flex-1">
                  Full property management, staff management, revenue reports, refunds
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-neutral-100 px-3 py-1 rounded-lg font-mono text-sm font-semibold text-neutral-900 mt-0.5">
                  ADMIN
                </div>
                <p className="text-sm text-neutral-600 flex-1">
                  Group-wide access: all properties, OTA management, payment settings
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-neutral-100 px-3 py-1 rounded-lg font-mono text-sm font-semibold text-neutral-900 mt-0.5">
                  SUPERADMIN
                </div>
                <p className="text-sm text-neutral-600 flex-1">
                  Platform owner: full system access, feature flags, user impersonation
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* CMS Tab */}
      {activeTab === 'cms' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Content Management System</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Upload */}
                <Card variant="default" padding="lg">
                  <h3 className="text-xl font-bold text-neutral-900 mb-4">📸 Image Management</h3>
                  <p className="text-neutral-600 mb-6">Upload and manage property images</p>
                  
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-neutral-400 transition-colors cursor-pointer">
                      <svg className="w-12 h-12 mx-auto mb-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-neutral-600">Click to upload images</p>
                      <p className="text-sm text-neutral-500 mt-1">or drag and drop</p>
                    </div>
                    
                    <Button variant="primary" fullWidth>
                      Browse Images
                    </Button>
                  </div>
                </Card>

                {/* Content Sections */}
                <Card variant="default" padding="lg">
                  <h3 className="text-xl font-bold text-neutral-900 mb-4">📝 Content Sections</h3>
                  <p className="text-neutral-600 mb-6">Manage homepage and property content</p>
                  
                  <div className="space-y-3">
                    {['Hero Section', 'About Section', 'Amenities', 'Testimonials', 'Contact Info'].map((section, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
                        <span className="font-medium text-neutral-900">{section}</span>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Gallery Management */}
                <Card variant="default" padding="lg" className="md:col-span-2">
                  <h3 className="text-xl font-bold text-neutral-900 mb-4">🖼️ Gallery</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="aspect-video bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-neutral-200 transition-colors cursor-pointer">
                        <span className="text-sm">Slot {i}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button variant="primary" size="sm">Upload to Gallery</Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Payment Gateway Tab */}
          {activeTab === 'payment' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Payment Gateway Settings</h2>
              
              <Card variant="default" padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <img src="https://razorpay.com/assets/razorpay-glyph.svg" alt="Razorpay" className="h-8" />
                    <div>
                      <h3 className="font-bold text-lg">Razorpay Integration</h3>
                      <p className="text-sm text-neutral-600">Secure payment processing</p>
                    </div>
                  </div>
                  <Badge variant={paymentSettings.razorpayKeyId ? 'success' : 'warning'}>
                    {paymentSettings.razorpayKeyId ? 'Configured' : 'Not Configured'}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Razorpay Key ID
                    </label>
                    <input
                      type="text"
                      value={paymentSettings.razorpayKeyId}
                      onChange={(e) => setPaymentSettings({...paymentSettings, razorpayKeyId: e.target.value})}
                      placeholder="rzp_test_xxxxxxxxxxxxx"
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div>
                      <span className="font-medium text-neutral-900">Test Mode</span>
                      <p className="text-sm text-neutral-600">Use test credentials for development</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentSettings.isTestMode}
                        onChange={(e) => setPaymentSettings({...paymentSettings, isTestMode: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-neutral-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div>
                      <span className="font-medium text-neutral-900">Auto Capture</span>
                      <p className="text-sm text-neutral-600">Automatically capture payments</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentSettings.autoCapture}
                        onChange={(e) => setPaymentSettings({...paymentSettings, autoCapture: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-neutral-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-neutral-200">
                    <Button variant="primary" size="lg" fullWidth>
                      Save Payment Settings
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Test Payment */}
              <Card variant="bordered" padding="lg">
                <h3 className="font-bold text-lg mb-3">🧪 Test Payment Integration</h3>
                <p className="text-neutral-600 mb-4">Verify your Razorpay integration is working</p>
                <Button variant="secondary">Run Test Payment</Button>
              </Card>
            </div>
          )}

          {/* OTA Integration Tab */}
          {activeTab === 'ota' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">OTA Channel Integration</h2>
                  <p className="text-neutral-600 mt-1">Connect with online travel agencies</p>
                </div>
                <Button variant="primary">Sync All Channels</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {otaChannels.map((channel) => (
                  <Card key={channel.id} variant="default" padding="lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-neutral-900">{channel.name}</h3>
                        <p className="text-sm text-neutral-600">
                          {channel.connected ? 'Connected' : 'Not connected'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={channel.connected ? 'success' : 'neutral'}>
                          {channel.connected ? 'Connected' : 'Disconnected'}
                        </Badge>
                        <Badge variant={channel.enabled ? 'success' : 'warning'}>
                          {channel.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                          API Key
                        </label>
                        <input
                          type="password"
                          value={channel.apiKey}
                          onChange={(e) => {
                            const updated = otaChannels.map(c => 
                              c.id === channel.id ? {...c, apiKey: e.target.value} : c
                            );
                            setOtaChannels(updated);
                          }}
                          placeholder="Enter API key..."
                          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                        <span className="text-sm font-medium">Enable Channel</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={channel.enabled}
                            onChange={(e) => {
                              const updated = otaChannels.map(c => 
                                c.id === channel.id ? {...c, enabled: e.target.checked} : c
                              );
                              setOtaChannels(updated);
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-neutral-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="primary" size="sm" fullWidth>Connect</Button>
                        <Button variant="secondary" size="sm" fullWidth>Test</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Sync Status */}
              <Card variant="bordered" padding="lg">
                <h3 className="font-bold text-lg mb-3">📊 Last Sync Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Last successful sync:</span>
                    <span className="font-semibold">Never (channels not connected)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Next scheduled sync:</span>
                    <span className="font-semibold">Every 15 minutes (when enabled)</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </Container>
      </section>

      {/* Manage Member Modal */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-neutral-900">Manage Member</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMember(null);
                    setBonusPoints(0);
                    setBonusStays(0);
                    setBonusReason('');
                  }}
                  className="text-neutral-500 hover:text-neutral-900 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* SECTION 1: Contact Information */}
              <div className="space-y-4">
                <h4 className="font-bold text-lg text-neutral-900 border-b pb-2">Contact Information</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Name</label>
                    <p className="text-neutral-900">{editingMember.userName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Member #</label>
                    <p className="text-neutral-900 font-mono">{editingMember.memberNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Member Since</label>
                    <p className="text-neutral-900">{new Date(editingMember.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Status</label>
                    <Badge
                      variant={
                        editingMember.tier === 'PLATINUM' ? 'neutral' :
                        editingMember.tier === 'GOLD' ? 'smart' : 'capsule'
                      }
                      size="sm"
                    >
                      {editingMember.tier}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editingMember.userEmail}
                      onChange={(e) => setEditingMember({...editingMember, userEmail: e.target.value})}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editingMember.userPhone || ''}
                      onChange={(e) => setEditingMember({...editingMember, userPhone: e.target.value})}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/loyalty/accounts/${editingMember.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            email: editingMember.userEmail,
                            phone: editingMember.userPhone
                          })
                        });

                        if (response.ok) {
                          alert('Contact info updated successfully!');
                          window.location.reload();
                        } else {
                          const error = await response.json();
                          alert('Failed to update: ' + error.error);
                        }
                      } catch (error) {
                        alert('Error updating contact info');
                        console.error(error);
                      }
                    }}
                  >
                    Update Contact Info
                  </Button>
                </div>
              </div>

              {/* SECTION 2: Loyalty Management */}
              <div className="space-y-4">
                <h4 className="font-bold text-lg text-neutral-900 border-b pb-2">Loyalty Management</h4>
                
                {/* Current Balances (Read-only) */}
                <div className="grid grid-cols-3 gap-4 bg-neutral-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">Current Points</label>
                    <p className="text-2xl font-bold text-neutral-900">{editingMember.points.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">Lifetime Stays</label>
                    <p className="text-2xl font-bold text-neutral-900">{editingMember.lifetimeStays || 0}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">Current Tier</label>
                    <Badge
                      variant={
                        editingMember.tier === 'PLATINUM' ? 'neutral' :
                        editingMember.tier === 'GOLD' ? 'smart' : 'capsule'
                      }
                      size="md"
                    >
                      {editingMember.tier}
                    </Badge>
                  </div>
                </div>

                {/* Add Bonus Points/Stays */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Add Bonus Points
                    </label>
                    <input
                      type="number"
                      value={bonusPoints}
                      onChange={(e) => setBonusPoints(parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      New balance: {(editingMember.points + bonusPoints).toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Add Bonus Stays
                    </label>
                    <input
                      type="number"
                      value={bonusStays}
                      onChange={(e) => setBonusStays(parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      New total: {editingMember.lifetimeStays + bonusStays}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Reason for Adjustment
                  </label>
                  <textarea
                    value={bonusReason}
                    onChange={(e) => setBonusReason(e.target.value)}
                    placeholder="E.g., Compensation for service issue, promotional bonus, etc."
                    rows={2}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Membership Tier
                  </label>
                  <select
                    value={editingMember.tier}
                    onChange={(e) => setEditingMember({...editingMember, tier: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="SILVER">Silver</option>
                    <option value="GOLD">Gold</option>
                    <option value="PLATINUM">Platinum</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMember(null);
                    setBonusPoints(0);
                    setBonusStays(0);
                    setBonusReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    try {
                      // Only send if there are actual changes
                      if (bonusPoints === 0 && bonusStays === 0 && !bonusReason) {
                        // Just update tier if changed
                        const response = await fetch(`/api/loyalty/accounts/${editingMember.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ tier: editingMember.tier })
                        });

                        if (response.ok) {
                          alert('Tier updated successfully!');
                          setShowEditModal(false);
                          setEditingMember(null);
                          window.location.reload();
                        } else {
                          const error = await response.json();
                          alert('Failed to update: ' + error.error);
                        }
                      } else {
                        // Add bonus points/stays
                        const response = await fetch(`/api/loyalty/accounts/${editingMember.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            addPoints: bonusPoints,
                            addStays: bonusStays,
                            reason: bonusReason || 'Admin adjustment',
                            tier: editingMember.tier
                          })
                        });

                        if (response.ok) {
                          alert('Member updated successfully!');
                          setShowEditModal(false);
                          setEditingMember(null);
                          setBonusPoints(0);
                          setBonusStays(0);
                          setBonusReason('');
                          window.location.reload();
                        } else {
                          const error = await response.json();
                          alert('Failed to update: ' + error.error);
                        }
                      }
                    } catch (error) {
                      alert('Error updating member');
                      console.error(error);
                    }
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage User Modal */}
      {showUserModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-neutral-900">Manage User</h3>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                }}
                className="text-neutral-500 hover:text-neutral-900 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-neutral-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-xs text-neutral-500 uppercase tracking-wide">Name</label>
                    <p className="text-neutral-900 font-semibold">{editingUser.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 uppercase tracking-wide">Joined</label>
                    <p className="text-neutral-900">{new Date(editingUser.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 uppercase tracking-wide">Email</label>
                    <p className="text-neutral-900">{editingUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 uppercase tracking-wide">Current Role</label>
                    <Badge variant="neutral" size="sm">{editingUser.roleName || editingUser.roleKey}</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Role
                    </label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    >
                      <option value="STAFF_FRONTDESK">Front Desk Staff</option>
                      <option value="STAFF_OPS">Operations Staff</option>
                      <option value="MANAGER">Property Manager</option>
                      <option value="ADMIN">Group Administrator</option>
                      <option value="SUPERADMIN">Super Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Access Scope
                    </label>
                    <select
                      value={userScopeType}
                      onChange={(e) => {
                        const value = e.target.value as 'PROPERTY' | 'BRAND' | 'ORG';
                        setUserScopeType(value);
                        if (value === 'PROPERTY') {
                          setUserScopeId(properties?.[0]?.id || null);
                        } else if (value === 'BRAND') {
                          setUserScopeId(brands?.[0]?.id || null);
                        } else {
                          setUserScopeId(null);
                        }
                      }}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    >
                      <option value="PROPERTY">Single Property</option>
                      <option value="BRAND">Brand-Wide</option>
                      <option value="ORG">Organization-Wide</option>
                    </select>
                  </div>
                </div>

                {userScopeType !== 'ORG' && (
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      {userScopeType === 'PROPERTY' ? 'Property' : 'Brand'}
                    </label>
                    <select
                      value={userScopeId || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setUserScopeId(value ? parseInt(value) : null);
                      }}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    >
                      {(userScopeType === 'PROPERTY' ? properties : brands).map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/users/${editingUser.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          roleKey: userRole,
                          scopeType: userScopeType,
                          scopeId: userScopeType === 'ORG' ? null : userScopeId,
                          phone: userPhone,
                        }),
                      });

                      if (response.ok) {
                        alert('User updated successfully!');
                        setShowUserModal(false);
                        setEditingUser(null);
                        window.location.reload();
                      } else {
                        const error = await response.json();
                        alert('Failed to update user: ' + error.error);
                      }
                    } catch (error) {
                      alert('Error updating user');
                      console.error(error);
                    }
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-neutral-900">Add User</h3>
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setNewUserForm({
                    name: '',
                    email: '',
                    phone: '',
                    roleKey: 'STAFF_FRONTDESK',
                    scopeType: defaultScopeType,
                    scopeId: defaultScopeId,
                  });
                }}
                className="text-neutral-500 hover:text-neutral-900 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({...newUserForm, name: e.target.value})}
                  placeholder="Enter full name"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                  placeholder="staff@podnbeyond.com"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({...newUserForm, phone: e.target.value})}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={newUserForm.roleKey}
                    onChange={(e) => setNewUserForm({...newUserForm, roleKey: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="STAFF_FRONTDESK">Front Desk Staff</option>
                    <option value="STAFF_OPS">Operations Staff</option>
                    <option value="MANAGER">Property Manager</option>
                    <option value="ADMIN">Group Administrator</option>
                    <option value="SUPERADMIN">Super Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Access Scope *
                  </label>
                  <select
                    value={newUserForm.scopeType}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewUserForm({
                        ...newUserForm,
                        scopeType: value,
                        scopeId: value === 'ORG'
                          ? null
                          : value === 'PROPERTY'
                            ? properties?.[0]?.id || null
                            : brands?.[0]?.id || null,
                      });
                    }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="PROPERTY">Single Property</option>
                    <option value="BRAND">Brand-Wide</option>
                    <option value="ORG">Organization-Wide</option>
                  </select>
                </div>
              </div>

              {newUserForm.scopeType !== 'ORG' && (
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    {newUserForm.scopeType === 'PROPERTY' ? 'Property' : 'Brand'} *
                  </label>
                  <select
                    value={newUserForm.scopeId || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewUserForm({...newUserForm, scopeId: value ? parseInt(value) : null});
                    }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    {(newUserForm.scopeType === 'PROPERTY' ? properties : brands).map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setNewUserForm({
                      name: '',
                      email: '',
                      phone: '',
                      roleKey: 'STAFF_FRONTDESK',
                      scopeType: defaultScopeType,
                      scopeId: defaultScopeId,
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: newUserForm.name,
                          email: newUserForm.email,
                          phone: newUserForm.phone,
                          roleKey: newUserForm.roleKey,
                          scopeType: newUserForm.scopeType,
                          scopeId: newUserForm.scopeType === 'ORG' ? null : newUserForm.scopeId,
                        }),
                      });

                      if (response.ok) {
                        alert('User created successfully!');
                        setShowAddUserModal(false);
                        window.location.reload();
                      } else {
                        const error = await response.json();
                        alert('Failed to create user: ' + error.error);
                      }
                    } catch (error) {
                      alert('Error creating user');
                      console.error(error);
                    }
                  }}
                >
                  Create User
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

// Server-side data fetching - Using API with better error handling
export async function getServerSideProps() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  
  try {
    console.log('Fetching admin data from:', API_URL);

    // Fetch all data with proper error handling
    const [brandsRes, propertiesRes, bookingsRes, usersRes] = await Promise.all([
      fetch(`${API_URL}/api/brands`).catch(e => { console.error('Brands fetch failed:', e); return null; }),
      fetch(`${API_URL}/api/properties`).catch(e => { console.error('Properties fetch failed:', e); return null; }),
      fetch(`${API_URL}/api/booking/bookings`).catch(e => { console.error('Bookings fetch failed:', e); return null; }),
      fetch(`${API_URL}/api/users`).catch(e => { console.error('Users fetch failed:', e); return null; }),
    ]);

    const brands = brandsRes ? (await brandsRes.json()).brands || [] : [];
    const properties = propertiesRes ? (await propertiesRes.json()).properties || [] : [];
    const bookings = bookingsRes ? await bookingsRes.json() : [];
    const users = usersRes ? (await usersRes.json()).users || [] : [];

    // Fetch real loyalty accounts from API
    const loyaltyRes = await fetch(`${API_URL}/api/loyalty/accounts`).catch(e => { 
      console.error('Loyalty fetch failed:', e); 
      return null; 
    });
    const loyaltyAccounts = loyaltyRes ? (await loyaltyRes.json()).accounts || [] : [];

    console.log('Admin data fetched:', { 
      brands: brands.length, 
      properties: properties.length, 
      bookings: Array.isArray(bookings) ? bookings.length : 0 
    });

    return {
      props: {
        brands,
        properties,
        bookings: Array.isArray(bookings) ? bookings : [],
        users,
        loyalty: loyaltyAccounts,
        stats: {
          brands: brands.length,
          properties: properties.length,
          bookings: Array.isArray(bookings) ? bookings.length : 0,
          loyalty: loyaltyAccounts.length,
          users: users.length,
        }
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    
    return {
      props: {
        brands: [],
        properties: [],
        bookings: [],
        users: [],
        loyalty: [],
        stats: { brands: 0, properties: 0, bookings: 0, loyalty: 0, users: 0 }
      }
    };
  }
}

