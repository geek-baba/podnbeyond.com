import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Types
interface Booking {
  id: number;
  guestName: string;
  email: string;
  phone?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  roomType: string;
  roomName: string;
  createdAt: string;
  externalBookingId?: string;
  externalChannel?: string;
  specialRequests?: string;
}

interface Room {
  id: number;
  name: string;
  type: string;
  capacity: number;
  description?: string;
  pricePerNight: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  createdAt: string;
}

interface LoyaltyAccount {
  id: number;
  guestName: string;
  email: string;
  phone?: string;
  pointsBalance: number;
  tier: 'SILVER' | 'GOLD' | 'PLATINUM';
  lastActivityDate: string;
  totalSpent: number;
  totalBookings: number;
  isActive: boolean;
}

// Form interfaces
interface RoomFormData {
  name: string;
  type: string;
  capacity: string;
  description: string;
  pricePerNight: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

interface BookingFormData {
  guestName: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  totalPrice: string;
  specialRequests: string;
}

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'rooms' | 'loyalty' | 'payment' | 'ota' | 'properties'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loyaltyAccounts, setLoyaltyAccounts] = useState<LoyaltyAccount[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Payment Gateway Settings State
  const [paymentSettings, setPaymentSettings] = useState({
    razorpayKeyId: '',
    razorpayKeySecret: '',
    isTestMode: true,
    webhookSecret: '',
    autoCapture: true
  });

  // OTA Integration State  
  const [otaChannels, setOtaChannels] = useState([
    { id: 1, name: 'Booking.com', enabled: false, connected: false, apiKey: '', lastSync: null },
    { id: 2, name: 'Airbnb', enabled: false, connected: false, apiKey: '', lastSync: null },
    { id: 3, name: 'MakeMyTrip', enabled: false, connected: false, apiKey: '', lastSync: null },
    { id: 4, name: 'Goibibo', enabled: false, connected: false, apiKey: '', lastSync: null },
    { id: 5, name: 'Yatra', enabled: false, connected: false, apiKey: '', lastSync: null },
  ]);

  // Form states
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomFormData, setRoomFormData] = useState<RoomFormData>({
    name: '',
    type: '',
    capacity: '',
    description: '',
    pricePerNight: '',
    status: 'ACTIVE'
  });

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [bookingFormData, setBookingFormData] = useState<BookingFormData>({
    guestName: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    guests: '',
    totalPrice: '',
    specialRequests: ''
  });

  // Search states
  const [bookingSearch, setBookingSearch] = useState({
    guestName: '',
    email: '',
    status: '',
    roomType: ''
  });

  const [loyaltySearch, setLoyaltySearch] = useState({
    userId: '',
    tier: '',
    minPoints: '',
    maxPoints: ''
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      switch (activeTab) {
        case 'properties':
          const propertiesResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/properties`);
          setProperties(propertiesResponse.data.properties || []);
          break;
        case 'bookings':
          const bookingsResponse = await axios.get('/api/booking/bookings');
          setBookings(bookingsResponse.data || []);
          break;
        case 'rooms':
          const roomsResponse = await axios.get('/api/booking/rooms/all');
          setRooms(roomsResponse.data.rooms || []);
          break;
        case 'loyalty':
          const loyaltyResponse = await axios.get('/api/loyalty/accounts');
          setLoyaltyAccounts(loyaltyResponse.data.accounts || []);
          break;
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Room Management Functions
  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await axios.put(`/api/booking/rooms/${editingRoom.id}`, roomFormData);
        setMessage({ type: 'success', text: 'Room updated successfully!' });
      } else {
        await axios.post('/api/booking/rooms', roomFormData);
        setMessage({ type: 'success', text: 'Room created successfully!' });
      }
      setShowRoomForm(false);
      setEditingRoom(null);
      resetRoomForm();
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save room' });
    }
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setRoomFormData({
      name: room.name,
      type: room.type,
      capacity: room.capacity.toString(),
      description: room.description || '',
      pricePerNight: room.pricePerNight.toString(),
      status: room.status
    });
    setShowRoomForm(true);
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    
    try {
      await axios.delete(`/api/booking/rooms/${roomId}`);
      setMessage({ type: 'success', text: 'Room deleted successfully!' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to delete room' });
    }
  };

  const resetRoomForm = () => {
    setRoomFormData({
      name: '',
      type: '',
      capacity: '',
      description: '',
      pricePerNight: '',
      status: 'ACTIVE'
    });
  };

  // Booking Management Functions
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBooking) {
        await axios.put(`/api/booking/bookings/${editingBooking.id}`, bookingFormData);
        setMessage({ type: 'success', text: 'Booking updated successfully!' });
      }
      setShowBookingForm(false);
      setEditingBooking(null);
      resetBookingForm();
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save booking' });
    }
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setBookingFormData({
      guestName: booking.guestName,
      email: booking.email,
      phone: booking.phone || '',
      checkIn: new Date(booking.checkIn).toISOString().split('T')[0],
      checkOut: new Date(booking.checkOut).toISOString().split('T')[0],
      guests: booking.guests.toString(),
      totalPrice: booking.totalPrice.toString(),
      specialRequests: booking.specialRequests || ''
    });
    setShowBookingForm(true);
  };

  const handleUpdateBookingStatus = async (bookingId: number, status: string) => {
    try {
      await axios.patch(`/api/booking/bookings/${bookingId}/status`, { status });
      setMessage({ type: 'success', text: 'Booking status updated successfully!' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update status' });
    }
  };

  const handleDeleteBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      await axios.delete(`/api/booking/bookings/${bookingId}`);
      setMessage({ type: 'success', text: 'Booking cancelled successfully!' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to cancel booking' });
    }
  };

  const resetBookingForm = () => {
    setBookingFormData({
      guestName: '',
      email: '',
      phone: '',
      checkIn: '',
      checkOut: '',
      guests: '',
      totalPrice: '',
      specialRequests: ''
    });
  };

  // Search Functions
  const handleBookingSearch = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(bookingSearch).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await axios.get(`/api/booking/bookings/search?${params}`);
      setBookings(response.data.bookings || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to search bookings');
    }
  };

  const handleLoyaltySearch = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(loyaltySearch).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await axios.get(`/api/loyalty/accounts/search?${params}`);
      setLoyaltyAccounts(response.data.accounts || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to search loyalty accounts');
    }
  };

  // Utility Functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM':
        return 'bg-purple-100 text-purple-800';
      case 'GOLD':
        return 'bg-yellow-100 text-yellow-800';
      case 'SILVER':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-red-100 text-red-800';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'properties', name: 'Properties', icon: '🏢' },
    { id: 'bookings', name: 'Bookings', icon: '📋' },
    { id: 'rooms', name: 'Rooms', icon: '🏨' },
    { id: 'loyalty', name: 'Loyalty Accounts', icon: '⭐' },
    { id: 'payment', name: 'Payment Gateway', icon: '💳' },
    { id: 'ota', name: 'OTA Integration', icon: '🌐' }
  ];

  const cmsLink = { id: 'cms', name: 'CMS', icon: '🎨', href: '/admin/cms' };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-2 text-gray-600">Manage bookings, rooms, and loyalty accounts</p>
            </div>
            <a
              href={cmsLink.href}
              className="inline-flex items-center px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span className="mr-2">{cmsLink.icon}</span>
              {cmsLink.name}
            </a>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
            <button
              onClick={() => setMessage(null)}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-500 text-lg mb-2">⚠️</div>
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchData}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="p-6">
              {/* Properties Tab */}
              {activeTab === 'properties' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Property Management</h2>
                    <div className="text-sm text-gray-500">
                      {properties.length} propert{properties.length !== 1 ? 'ies' : 'y'}
                    </div>
                  </div>

                  {properties.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🏢</div>
                      <p>No properties found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {properties.map((property: any) => (
                        <div key={property.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                          {/* Property Image */}
                          <div className="relative h-48">
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL}${property.images[0]}`}
                              alt={property.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full shadow-lg">
                              <div className="flex items-center space-x-1">
                                <span className="text-yellow-500">⭐</span>
                                <span className="font-semibold text-gray-900">{property.rating}</span>
                                <span className="text-gray-500 text-xs">({property.totalRatings})</span>
                              </div>
                            </div>
                            <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${
                              property.status === 'ACTIVE' ? 'bg-green-500 text-white' :
                              property.status === 'COMING_SOON' ? 'bg-yellow-500 text-white' :
                              'bg-gray-500 text-white'
                            }`}>
                              {property.status}
                            </div>
                          </div>

                          {/* Property Details */}
                          <div className="p-5">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{property.name}</h3>
                            
                            <div className="space-y-2 text-sm mb-4">
                              <div className="flex items-center text-gray-600">
                                <span className="mr-2">📍</span>
                                <span>{property.location}, {property.city}</span>
                              </div>
                              <div className="flex items-center text-gray-600">
                                <span className="mr-2">🏨</span>
                                <span>{property._count?.rooms || 0} rooms</span>
                              </div>
                              {property.phone && (
                                <div className="flex items-center text-gray-600">
                                  <span className="mr-2">📞</span>
                                  <span>{property.phone}</span>
                                </div>
                              )}
                            </div>

                            {/* Features */}
                            <div className="flex flex-wrap gap-1 mb-4">
                              {property.features?.slice(0, 3).map((feature: string, idx: number) => (
                                <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {feature}
                                </span>
                              ))}
                            </div>

                            {/* Amenities Count */}
                            <div className="text-xs text-gray-500 mb-4">
                              {property.amenities?.length || 0} amenities
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-2">
                              <a
                                href={`/property/${property.slug}`}
                                target="_blank"
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm"
                              >
                                View Property →
                              </a>
                              <button
                                onClick={() => {
                                  setMessage({ type: 'success', text: `Viewing ${property.name} (Edit feature coming soon)` });
                                  setTimeout(() => setMessage(null), 3000);
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Property Button */}
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => {
                        setMessage({ type: 'success', text: 'Add Property form coming soon!' });
                        setTimeout(() => setMessage(null), 3000);
                      }}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      + Add New Property
                    </button>
                  </div>
                </div>
              )}

              {/* Bookings Tab */}
              {activeTab === 'bookings' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">All Bookings</h2>
                    <div className="text-sm text-gray-500">
                      {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <input
                        type="text"
                        placeholder="Guest Name"
                        value={bookingSearch.guestName}
                        onChange={(e) => setBookingSearch({...bookingSearch, guestName: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Email"
                        value={bookingSearch.email}
                        onChange={(e) => setBookingSearch({...bookingSearch, email: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={bookingSearch.status}
                        onChange={(e) => setBookingSearch({...bookingSearch, status: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                      <button
                        onClick={handleBookingSearch}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        Search
                      </button>
                    </div>
                  </div>
                  
                  {bookings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📋</div>
                      <p>No bookings found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Guest
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Room
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Dates
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {bookings.map((booking) => (
                            <tr key={booking.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {booking.guestName}
                                  </div>
                                  <div className="text-sm text-gray-500">{booking.email}</div>
                                  {booking.phone && (
                                    <div className="text-sm text-gray-500">{booking.phone}</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{booking.roomName}</div>
                                <div className="text-sm text-gray-500">{booking.guests} guest{booking.guests !== 1 ? 's' : ''}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatDate(booking.checkIn)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  to {formatDate(booking.checkOut)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(booking.totalPrice)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <select
                                  value={booking.status}
                                  onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
                                  className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(booking.status)}`}
                                >
                                  <option value="PENDING">Pending</option>
                                  <option value="CONFIRMED">Confirmed</option>
                                  <option value="CANCELLED">Cancelled</option>
                                  <option value="COMPLETED">Completed</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleEditBooking(booking)}
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteBooking(booking.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Cancel
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Rooms Tab */}
              {activeTab === 'rooms' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Room Inventory</h2>
                    <button
                      onClick={() => setShowRoomForm(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      + Add Room
                    </button>
                  </div>
                  
                  {rooms.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🏨</div>
                      <p>No rooms found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Room Details
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {rooms.map((room) => (
                            <tr key={room.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{room.name}</div>
                                  <div className="text-sm text-gray-500">{room.type}</div>
                                  <div className="text-sm text-gray-500">{room.capacity} guest{room.capacity !== 1 ? 's' : ''}</div>
                                  {room.description && (
                                    <div className="text-sm text-gray-500">{room.description}</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(room.pricePerNight)}/night
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoomStatusColor(room.status)}`}>
                                  {room.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleEditRoom(room)}
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteRoom(room.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Loyalty Accounts Tab */}
              {activeTab === 'loyalty' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Loyalty Accounts</h2>
                    <div className="text-sm text-gray-500">
                      {loyaltyAccounts.length} account{loyaltyAccounts.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <input
                        type="text"
                        placeholder="User ID"
                        value={loyaltySearch.userId}
                        onChange={(e) => setLoyaltySearch({...loyaltySearch, userId: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={loyaltySearch.tier}
                        onChange={(e) => setLoyaltySearch({...loyaltySearch, tier: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Tiers</option>
                        <option value="SILVER">Silver</option>
                        <option value="GOLD">Gold</option>
                        <option value="PLATINUM">Platinum</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Min Points"
                        value={loyaltySearch.minPoints}
                        onChange={(e) => setLoyaltySearch({...loyaltySearch, minPoints: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Max Points"
                        value={loyaltySearch.maxPoints}
                        onChange={(e) => setLoyaltySearch({...loyaltySearch, maxPoints: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleLoyaltySearch}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        Search
                      </button>
                    </div>
                  </div>
                  
                  {loyaltyAccounts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">⭐</div>
                      <p>No loyalty accounts found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Guest
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tier
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Points
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Spent
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Bookings
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Last Activity
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {loyaltyAccounts.map((account) => (
                            <tr key={account.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {account.guestName}
                                  </div>
                                  <div className="text-sm text-gray-500">{account.email}</div>
                                  {account.phone && (
                                    <div className="text-sm text-gray-500">{account.phone}</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTierColor(account.tier)}`}>
                                  {account.tier}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-900">
                                  {account.pointsBalance.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">points</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(account.totalSpent)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {account.totalBookings}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(account.lastActivityDate)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Gateway Settings Tab */}
              {activeTab === 'payment' && (
                <div className="p-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">Payment Gateway Settings</h2>
                  
                  {/* Razorpay Configuration */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Razorpay Configuration</h3>
                        <p className="text-sm text-gray-500 mt-1">Configure your Razorpay payment gateway</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          paymentSettings.isTestMode ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {paymentSettings.isTestMode ? '🧪 Test Mode' : '✅ Live Mode'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Razorpay Key ID
                        </label>
                        <input
                          type="text"
                          value={paymentSettings.razorpayKeyId}
                          onChange={(e) => setPaymentSettings({...paymentSettings, razorpayKeyId: e.target.value})}
                          placeholder="rzp_test_xxxxxx or rzp_live_xxxxxx"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Get from: <a href="https://dashboard.razorpay.com/app/website-app-settings/api-keys" target="_blank" className="text-blue-600 hover:underline">Razorpay Dashboard</a>
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Razorpay Key Secret
                        </label>
                        <input
                          type="password"
                          value={paymentSettings.razorpayKeySecret}
                          onChange={(e) => setPaymentSettings({...paymentSettings, razorpayKeySecret: e.target.value})}
                          placeholder="Enter your Razorpay secret key"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="testMode"
                          checked={paymentSettings.isTestMode}
                          onChange={(e) => setPaymentSettings({...paymentSettings, isTestMode: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="testMode" className="text-sm text-gray-700">
                          Use Test Mode (for development/testing)
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="autoCapture"
                          checked={paymentSettings.autoCapture}
                          onChange={(e) => setPaymentSettings({...paymentSettings, autoCapture: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="autoCapture" className="text-sm text-gray-700">
                          Auto-capture payments (recommended)
                        </label>
                      </div>

                      <div className="pt-4 border-t">
                        <button
                          onClick={() => {
                            setMessage({ type: 'success', text: 'Payment settings saved! (In production, this would update environment variables)' });
                            setTimeout(() => setMessage(null), 5000);
                          }}
                          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                        >
                          Save Payment Settings
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Payment Test Tools */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">🧪 Test Payment Tools</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start space-x-2">
                        <span className="text-blue-600">ℹ️</span>
                        <p className="text-blue-800">
                          <strong>Test Mode is currently active.</strong> Bookings will be automatically confirmed without requiring actual payment.
                        </p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-blue-600">💡</span>
                        <p className="text-blue-800">
                          To enable real payments, add your Razorpay <strong>Live</strong> keys above and uncheck "Use Test Mode".
                        </p>
                      </div>
                      <div className="bg-white border border-blue-300 rounded p-3 mt-3">
                        <p className="font-medium text-blue-900 mb-2">Razorpay Test Cards:</p>
                        <ul className="text-blue-800 space-y-1 text-xs">
                          <li>• Card: 4111 1111 1111 1111</li>
                          <li>• CVV: Any 3 digits</li>
                          <li>• Expiry: Any future date</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* OTA Integration Tab */}
              {activeTab === 'ota' && (
                <div className="p-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">OTA Channel Integration</h2>
                  <p className="text-gray-600 mb-6">
                    Connect your POD N BEYOND hotel to multiple Online Travel Agencies (OTAs) to expand your reach and increase bookings.
                  </p>

                  {/* OTA Channels List */}
                  <div className="space-y-4">
                    {otaChannels.map((channel) => (
                      <div key={channel.id} className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                              {channel.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{channel.name}</h3>
                              <p className="text-sm text-gray-500">
                                {channel.connected ? 'Connected and syncing' : 'Not connected'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {channel.connected && (
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                ✓ Connected
                              </span>
                            )}
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={channel.enabled}
                                onChange={(e) => {
                                  const updated = otaChannels.map(ch =>
                                    ch.id === channel.id ? {...ch, enabled: e.target.checked} : ch
                                  );
                                  setOtaChannels(updated);
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>

                        {channel.enabled && (
                          <div className="mt-4 space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                API Key / Credentials
                              </label>
                              <input
                                type="text"
                                value={channel.apiKey}
                                onChange={(e) => {
                                  const updated = otaChannels.map(ch =>
                                    ch.id === channel.id ? {...ch, apiKey: e.target.value} : ch
                                  );
                                  setOtaChannels(updated);
                                }}
                                placeholder={`Enter ${channel.name} API key`}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div className="flex space-x-3">
                              <button
                                onClick={() => {
                                  const updated = otaChannels.map(ch =>
                                    ch.id === channel.id ? {...ch, connected: true, lastSync: new Date().toISOString()} : ch
                                  );
                                  setOtaChannels(updated);
                                  setMessage({ type: 'success', text: `${channel.name} connected successfully!` });
                                  setTimeout(() => setMessage(null), 5000);
                                }}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                {channel.connected ? 'Reconnect' : 'Connect'}
                              </button>

                              {channel.connected && (
                                <button
                                  onClick={() => {
                                    setMessage({ type: 'success', text: `Syncing ${channel.name}... (In production, this would sync inventory and bookings)` });
                                    setTimeout(() => setMessage(null), 5000);
                                  }}
                                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  🔄 Sync Now
                                </button>
                              )}
                            </div>

                            {channel.lastSync && (
                              <p className="text-xs text-gray-500">
                                Last synced: {new Date(channel.lastSync).toLocaleString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* OTA Integration Info */}
                  <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-3">📢 OTA Integration Benefits</h3>
                    <ul className="space-y-2 text-sm text-yellow-800">
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span><strong>Wider Reach:</strong> List your property on multiple platforms simultaneously</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span><strong>Automated Sync:</strong> Real-time availability and rate updates across all channels</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span><strong>Centralized Management:</strong> Manage all bookings from one dashboard</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span><strong>No Overbooking:</strong> Prevent double bookings with automatic inventory updates</span>
                      </li>
                    </ul>
                    <div className="mt-4 pt-4 border-t border-yellow-300">
                      <p className="text-xs text-yellow-700">
                        <strong>Note:</strong> OTA integration requires separate agreements with each platform. Contact each OTA to obtain API credentials.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {/* Room Form Modal */}
      {showRoomForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </h3>
              <form onSubmit={handleRoomSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    required
                    value={roomFormData.name}
                    onChange={(e) => setRoomFormData({...roomFormData, name: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <input
                    type="text"
                    required
                    value={roomFormData.type}
                    onChange={(e) => setRoomFormData({...roomFormData, type: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Capacity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={roomFormData.capacity}
                    onChange={(e) => setRoomFormData({...roomFormData, capacity: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price per Night</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={roomFormData.pricePerNight}
                    onChange={(e) => setRoomFormData({...roomFormData, pricePerNight: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={roomFormData.description}
                    onChange={(e) => setRoomFormData({...roomFormData, description: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={roomFormData.status}
                    onChange={(e) => setRoomFormData({...roomFormData, status: e.target.value as any})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoomForm(false);
                      setEditingRoom(null);
                      resetRoomForm();
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    {editingRoom ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit Booking
              </h3>
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Guest Name</label>
                  <input
                    type="text"
                    required
                    value={bookingFormData.guestName}
                    onChange={(e) => setBookingFormData({...bookingFormData, guestName: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={bookingFormData.email}
                    onChange={(e) => setBookingFormData({...bookingFormData, email: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    value={bookingFormData.phone}
                    onChange={(e) => setBookingFormData({...bookingFormData, phone: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Check-in</label>
                    <input
                      type="date"
                      required
                      value={bookingFormData.checkIn}
                      onChange={(e) => setBookingFormData({...bookingFormData, checkIn: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Check-out</label>
                    <input
                      type="date"
                      required
                      value={bookingFormData.checkOut}
                      onChange={(e) => setBookingFormData({...bookingFormData, checkOut: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Guests</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={bookingFormData.guests}
                      onChange={(e) => setBookingFormData({...bookingFormData, guests: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Price</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={bookingFormData.totalPrice}
                      onChange={(e) => setBookingFormData({...bookingFormData, totalPrice: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Special Requests</label>
                  <textarea
                    value={bookingFormData.specialRequests}
                    onChange={(e) => setBookingFormData({...bookingFormData, specialRequests: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBookingForm(false);
                      setEditingBooking(null);
                      resetBookingForm();
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage; 