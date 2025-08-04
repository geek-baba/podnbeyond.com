import { useState, useEffect } from 'react';
import axios from 'axios';
import { RAZORPAY_CONFIG } from '../config/razorpay';

interface BookingFormData {
  guestName: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  roomType: string;
  specialRequests: string;
}

export default function Home() {
  const [formData, setFormData] = useState<BookingFormData>({
    guestName: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    roomType: '',
    specialRequests: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [rooms, setRooms] = useState<Array<{id: number, type: string, price: number, capacity: number, isAvailable?: boolean}>>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Fetch rooms from API
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axios.get('/api/booking/rooms');
        setRooms(response.data);
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
        setMessage({ type: 'error', text: 'Failed to load room options' });
      } finally {
        setIsLoadingRooms(false);
      }
    };

    fetchRooms();
  }, []);

  const checkAvailability = async (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return;
    
    setIsCheckingAvailability(true);
    try {
      const response = await axios.get(`/api/booking/availability?checkIn=${checkIn}&checkOut=${checkOut}`);
      const roomsWithAvailability = response.data;
      
      setRooms(roomsWithAvailability.map((room: any) => ({
        id: room.id,
        type: room.type,
        price: room.price,
        capacity: room.capacity,
        isAvailable: room.isAvailable
      })));
    } catch (error) {
      console.error('Failed to check availability:', error);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'guests' ? parseInt(value) : value
    }));

    // Check availability when dates change
    if (name === 'checkIn' || name === 'checkOut') {
      const newCheckIn = name === 'checkIn' ? value : formData.checkIn;
      const newCheckOut = name === 'checkOut' ? value : formData.checkOut;
      
      if (newCheckIn && newCheckOut) {
        checkAvailability(newCheckIn, newCheckOut);
      }
    }
  };

  const calculateNights = () => {
    if (!formData.checkIn || !formData.checkOut) return 0;
    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getRoomPrice = () => {
    const room = rooms.find(r => r.type === formData.roomType);
    return room ? room.price : 120;
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    const pricePerNight = getRoomPrice();
    return nights * pricePerNight;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Step 1: Create booking
      const bookingResponse = await axios.post('/api/booking/book', formData);
      const booking = bookingResponse.data.booking;

      // Step 2: Create payment order
      const paymentResponse = await axios.post('/api/payment/create-order', {
        amount: booking.totalPrice,
        guestName: formData.guestName,
        bookingId: booking.id,
        currency: 'INR'
      });

      const orderData = paymentResponse.data;

      // Step 3: Launch Razorpay payment window
      const options = {
        key: RAZORPAY_CONFIG.KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: RAZORPAY_CONFIG.HOTEL_NAME,
        description: `Booking for ${formData.roomType}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // Handle successful payment
          await handlePaymentSuccess(response, booking.id);
        },
        prefill: {
          name: formData.guestName,
          email: formData.email,
          contact: formData.phone
        },
        notes: {
          bookingId: booking.id.toString(),
          roomType: formData.roomType
        },
        theme: RAZORPAY_CONFIG.THEME,
        modal: {
          ondismiss: function() {
            // Handle payment window dismissal
            setMessage({ type: 'error', text: 'Payment was cancelled. Please try again.' });
            setIsLoading(false);
            setIsPaymentProcessing(false);
          }
        }
      };

      // @ts-ignore - Razorpay is loaded via script tag
      const rzp = new (window as any).Razorpay(options);
      setIsPaymentProcessing(true);
      rzp.open();

    } catch (error: any) {
      if (error.response?.status === 409) {
        // Double-booking error
        setMessage({ 
          type: 'error', 
          text: error.response.data.error || 'Room is not available for the selected dates. Please choose different dates or room type.' 
        });
      } else if (error.response?.status === 400) {
        // Validation error
        setMessage({ 
          type: 'error', 
          text: error.response.data.error || 'Please check your booking details and try again.' 
        });
      } else {
        setMessage({ type: 'error', text: 'Failed to submit booking. Please try again.' });
      }
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (response: any, bookingId: number) => {
    try {
      // Verify payment on backend
      const verifyResponse = await axios.post('/api/payment/verify-payment', {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature
      });

      if (verifyResponse.data.success) {
        setMessage({ 
          type: 'success', 
          text: 'Payment completed successfully! Your booking has been confirmed. We will send you a confirmation email shortly.' 
        });
        
        // Reset form
        setFormData({
          guestName: '',
          email: '',
          phone: '',
          checkIn: '',
          checkOut: '',
          guests: 1,
          roomType: '',
          specialRequests: ''
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Payment verification failed. Please contact support.' 
        });
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Payment verification failed. Please contact support.' 
      });
    } finally {
      setIsLoading(false);
      setIsPaymentProcessing(false);
    }
  };

  const getMinCheckOutDate = () => {
    if (!formData.checkIn) return '';
    const checkIn = new Date(formData.checkIn);
    const nextDay = new Date(checkIn);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pod & Beyond Hotel</h1>
              <p className="text-gray-600 mt-2">Experience luxury and comfort in the heart of the city</p>
            </div>
            <a
              href="/admin"
              className="inline-flex items-center px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span className="mr-2">⚙️</span>
              Admin Dashboard
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Book Your Stay</h2>
            <p className="text-blue-100 mt-2">Select your dates and preferences to reserve your perfect room</p>
          </div>

          {/* Booking Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Guest Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="guestName"
                  name="guestName"
                  value={formData.guestName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Dates and Guests */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in Date *
                </label>
                <input
                  type="date"
                  id="checkIn"
                  name="checkIn"
                  value={formData.checkIn}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="checkOut" className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out Date *
                </label>
                <input
                  type="date"
                  id="checkOut"
                  name="checkOut"
                  value={formData.checkOut}
                  onChange={handleInputChange}
                  required
                  min={getMinCheckOutDate()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Guests *
                </label>
                <select
                  id="guests"
                  name="guests"
                  value={formData.guests}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Room Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Room Type *
              </label>
              {isLoadingRooms ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-600">Loading room options...</span>
                </div>
              ) : isCheckingAvailability ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-600">Checking availability...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {rooms.map(room => (
                    <label
                      key={room.id}
                      className={`relative flex flex-col p-4 border-2 rounded-lg transition-all ${
                        !room.isAvailable
                          ? 'border-red-200 bg-red-50 cursor-not-allowed opacity-60'
                          : formData.roomType === room.type
                          ? 'border-blue-500 bg-blue-50 cursor-pointer'
                          : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                      }`}
                    >
                      <input
                        type="radio"
                        name="roomType"
                        value={room.type}
                        checked={formData.roomType === room.type}
                        onChange={handleInputChange}
                        disabled={!room.isAvailable}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{room.type}</div>
                          <div className="text-sm text-gray-500">${room.price}/night</div>
                          <div className="text-xs text-gray-400">Up to {room.capacity} guests</div>
                          {!room.isAvailable && (
                            <div className="text-xs text-red-500 mt-1">Not available</div>
                          )}
                        </div>
                        {formData.roomType === room.type && room.isAvailable && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                        {!room.isAvailable && (
                          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Special Requests */}
            <div>
              <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-2">
                Special Requests
              </label>
              <textarea
                id="specialRequests"
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any special requests or preferences..."
              />
            </div>

            {/* Price Summary */}
            {calculateNights() > 0 && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {rooms.find(r => r.type === formData.roomType)?.type} × {calculateNights()} nights
                    </span>
                    <span className="text-gray-900">${calculateTotal()}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-blue-600 text-lg">${calculateTotal()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Message Display */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {message.text}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isPaymentProcessing}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all ${
                isLoading || isPaymentProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Booking...
                </div>
              ) : isPaymentProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Payment in Progress...
                </div>
              ) : (
                `Proceed to Payment - $${calculateTotal()}`
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
