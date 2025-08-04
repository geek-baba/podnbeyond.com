import { useState, useEffect } from 'react';
import axios from 'axios';
import { RAZORPAY_CONFIG } from '../config/razorpay';
import Head from 'next/head';

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

interface Content {
  id: number;
  type: string;
  title?: string;
  subtitle?: string;
  description?: string;
  content?: string;
  isActive: boolean;
  sortOrder: number;
}

interface Image {
  id: number;
  type: string;
  url: string;
  altText?: string;
  title?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

interface Testimonial {
  id: number;
  guestName: string;
  guestEmail?: string;
  rating: number;
  title?: string;
  content: string;
  avatarImage?: Image;
  isActive: boolean;
  sortOrder: number;
}

interface Amenity {
  id: number;
  name: string;
  description?: string;
  iconName?: string;
  iconImage?: Image;
  isActive: boolean;
  sortOrder: number;
}

interface Room {
  id: number;
  type: string;
  price: number;
  capacity: number;
  isAvailable?: boolean;
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
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // CMS Data
  const [heroContent, setHeroContent] = useState<Content | null>(null);
  const [heroImage, setHeroImage] = useState<Image | null>(null);
  const [aboutContent, setAboutContent] = useState<Content | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [contactContent, setContactContent] = useState<Content | null>(null);
  const [footerContent, setFooterContent] = useState<Content | null>(null);
  const [isLoadingCMS, setIsLoadingCMS] = useState(true);

  // Fetch CMS data
  useEffect(() => {
    const fetchCMSData = async () => {
      try {
        // Fetch hero content and image
        const heroResponse = await axios.get('/api/cms/content/HERO_SECTION');
        if (heroResponse.data.content.length > 0) {
          setHeroContent(heroResponse.data.content[0]);
        }

        const heroImageResponse = await axios.get('/api/cms/images/HERO_BACKGROUND');
        if (heroImageResponse.data.images.length > 0) {
          setHeroImage(heroImageResponse.data.images[0]);
        }

        // Fetch about content
        const aboutResponse = await axios.get('/api/cms/content/ABOUT_SECTION');
        if (aboutResponse.data.content.length > 0) {
          setAboutContent(aboutResponse.data.content[0]);
        }

        // Fetch testimonials
        const testimonialsResponse = await axios.get('/api/cms/testimonials');
        setTestimonials(testimonialsResponse.data.testimonials);

        // Fetch amenities
        const amenitiesResponse = await axios.get('/api/cms/amenities');
        setAmenities(amenitiesResponse.data.amenities);

        // Fetch contact content
        const contactResponse = await axios.get('/api/cms/content/CONTACT_SECTION');
        if (contactResponse.data.content.length > 0) {
          setContactContent(contactResponse.data.content[0]);
        }

        // Fetch footer content
        const footerResponse = await axios.get('/api/cms/content/FOOTER_SECTION');
        if (footerResponse.data.content.length > 0) {
          setFooterContent(footerResponse.data.content[0]);
        }
      } catch (error) {
        console.error('Failed to fetch CMS data:', error);
      } finally {
        setIsLoadingCMS(false);
      }
    };

    fetchCMSData();
  }, []);

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
    const selectedRoom = rooms.find(room => room.type === formData.roomType);
    return selectedRoom ? selectedRoom.price : 0;
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
      // Create booking
      const bookingResponse = await axios.post('/api/booking/book', formData);
      const bookingId = bookingResponse.data.booking.id;

      // Create payment order
      const orderResponse = await axios.post('/api/payment/create-order', {
        amount: calculateTotal() * 100, // Convert to paise
        guestName: formData.guestName
      });

      if (orderResponse.data.success) {
        setIsPaymentProcessing(true);
        
        // Initialize Razorpay
        const options = {
          key: RAZORPAY_CONFIG.keyId,
          amount: calculateTotal() * 100,
          currency: 'INR',
          name: 'Pod & Beyond Hotel',
          description: `Booking for ${formData.roomType}`,
          order_id: orderResponse.data.orderId,
          handler: (response: any) => handlePaymentSuccess(response, bookingId),
          prefill: {
            name: formData.guestName,
            email: formData.email,
            contact: formData.phone
          },
          theme: {
            color: '#3B82F6'
          }
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      } else {
        setMessage({ type: 'error', text: 'Failed to create payment order' });
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to create booking' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (response: any, bookingId: number) => {
    try {
      const verifyResponse = await axios.post('/api/payment/verify-payment', {
        bookingId,
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature
      });

      if (verifyResponse.data.success) {
        setMessage({ type: 'success', text: 'Booking confirmed! Payment successful.' });
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
        setMessage({ type: 'error', text: 'Payment verification failed' });
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Payment verification failed' 
      });
    } finally {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    ));
  };

  if (isLoadingCMS) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Pod & Beyond Hotel - Luxury Accommodation</title>
        <meta name="description" content="Experience luxury and comfort at Pod & Beyond Hotel. Book your perfect stay with us." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section 
          className="relative h-screen flex items-center justify-center"
          style={{
            backgroundImage: heroImage ? `url(${heroImage.url})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {heroContent?.title || 'Pod & Beyond Hotel'}
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              {heroContent?.subtitle || 'Experience luxury and comfort in the heart of the city'}
            </p>
            <p className="text-lg mb-12 max-w-2xl mx-auto">
              {heroContent?.description || 'Discover our world-class amenities and exceptional service'}
            </p>
            <a 
              href="#booking" 
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Book Your Stay
            </a>
          </div>
        </section>

        {/* About Section */}
        {aboutContent && (
          <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  {aboutContent.title || 'About Pod & Beyond'}
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  {aboutContent.description}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Amenities Section */}
        {amenities.length > 0 && (
          <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Hotel Amenities
                </h2>
                <p className="text-xl text-gray-600">
                  Everything you need for a perfect stay
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {amenities.map((amenity) => (
                  <div key={amenity.id} className="text-center p-6 bg-gray-50 rounded-lg hover:shadow-lg transition-shadow">
                    {amenity.iconImage ? (
                      <img 
                        src={amenity.iconImage.url} 
                        alt={amenity.name}
                        className="w-16 h-16 mx-auto mb-4"
                      />
                    ) : (
                      <div className="w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-2xl">🏨</span>
                      </div>
                    )}
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {amenity.name}
                    </h3>
                    {amenity.description && (
                      <p className="text-gray-600">
                        {amenity.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Booking Section */}
        <section id="booking" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                        <option key={num} value={num}>{num} Guest{num !== 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Room Selection */}
                <div>
                  <label htmlFor="roomType" className="block text-sm font-medium text-gray-700 mb-2">
                    Room Type *
                  </label>
                  <select
                    id="roomType"
                    name="roomType"
                    value={formData.roomType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a room type</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.type}>
                        {room.type} - {formatCurrency(room.price)}/night
                        {room.isAvailable === false && ' (Not Available)'}
                      </option>
                    ))}
                  </select>
                  {isCheckingAvailability && (
                    <p className="text-sm text-blue-600 mt-2">Checking availability...</p>
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
                {formData.roomType && calculateNights() > 0 && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Room Rate:</span>
                        <span>{formatCurrency(getRoomPrice())} × {calculateNights()} nights</span>
                      </div>
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total:</span>
                        <span>{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || isPaymentProcessing}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Creating Booking...' : 
                   isPaymentProcessing ? 'Processing Payment...' : 
                   'Book Now'}
                </button>

                {/* Message */}
                {message && (
                  <div className={`p-4 rounded-lg ${
                    message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {message.text}
                  </div>
                )}
              </form>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        {testimonials.length > 0 && (
          <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  What Our Guests Say
                </h2>
                <p className="text-xl text-gray-600">
                  Real experiences from our valued guests
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="bg-white p-6 rounded-lg shadow-lg">
                    <div className="flex items-center mb-4">
                      {testimonial.avatarImage ? (
                        <img 
                          src={testimonial.avatarImage.url} 
                          alt={testimonial.guestName}
                          className="w-12 h-12 rounded-full mr-4"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                          <span className="text-white font-semibold">
                            {testimonial.guestName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900">{testimonial.guestName}</h4>
                        <div className="flex">{renderStars(testimonial.rating)}</div>
                      </div>
                    </div>
                    {testimonial.title && (
                      <h5 className="font-medium text-gray-900 mb-2">{testimonial.title}</h5>
                    )}
                    <p className="text-gray-600 italic">"{testimonial.content}"</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Contact Section */}
        {contactContent && (
          <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  {contactContent.title || 'Contact Us'}
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  {contactContent.description}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">📍</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Address</h3>
                  <p className="text-gray-600">123 Hotel Street, City, State 12345</p>
                </div>
                <div>
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">📞</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Phone</h3>
                  <p className="text-gray-600">+1 (555) 123-4567</p>
                </div>
                <div>
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">✉️</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Email</h3>
                  <p className="text-gray-600">info@podnbeyond.com</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">
                {footerContent?.title || 'Pod & Beyond Hotel'}
              </h3>
              <p className="text-gray-400 mb-6">
                {footerContent?.description || 'Experience luxury and comfort in the heart of the city'}
              </p>
              <div className="flex justify-center space-x-6">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
                <a href="/admin" className="text-gray-400 hover:text-white transition-colors">Admin</a>
              </div>
              <p className="text-gray-400 mt-8">
                © 2024 Pod & Beyond Hotel. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
