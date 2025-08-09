import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import { RAZORPAY_CONFIG } from '../config/razorpay';

// Types for CMS data
interface Content {
  id: number;
  type: string;
  title: string;
  subtitle: string;
  description: string;
  content: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface Image {
  id: number;
  type: string;
  filename: string;
  originalName: string;
  path: string;
  url: string;
  altText: string | null;
  title: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface Testimonial {
  id: number;
  guestName: string;
  guestEmail: string | null;
  rating: number;
  title: string | null;
  content: string;
  avatarImageId: number | null;
  avatarImage: Image | null;
  isActive: boolean;
  sortOrder: number;
}

interface Amenity {
  id: number;
  name: string;
  description: string | null;
  iconName: string | null;
  iconImageId: number | null;
  iconImage: Image | null;
  isActive: boolean;
  sortOrder: number;
}

// Room interface for backend API
interface Room {
  id: number;
  name: string;
  type: string;
  capacity: number;
  description: string | null;
  pricePerNight: number;
  status: string;
  availableRooms?: number;
  totalPrice?: number;
  nights?: number;
  hasSeasonalRate?: boolean;
}

// Booking form data interface
interface BookingFormData {
  guestName: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  roomId: string;
  specialRequests: string;
}

// Enhanced room data with multiple images like the WordPress site
const rooms = [
  {
    id: 1,
    name: "Deluxe Pod Suite",
    description: "Spacious pod with premium amenities and city view",
    price: 299,
    capacity: 2,
    features: ["Private Patio", "City View", "Premium Amenities"],
    images: [
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop"
    ],
    badge: "Updated"
  },
  {
    id: 2,
    name: "Premium Pod Room",
    description: "Luxury pod with modern design and comfort",
    price: 199,
    capacity: 1,
    features: ["Modern Design", "Comfort", "Queen Bed"],
    images: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop"
    ],
    badge: "Large"
  },
  {
    id: 3,
    name: "Family Pod Suite",
    description: "Large pod perfect for families with extra space",
    price: 399,
    capacity: 4,
    features: ["Family Size", "Extra Space", "King Bed"],
    images: [
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop"
    ],
    badge: "NEWLY RENOVATED"
  },
  {
    id: 4,
    name: "Business Pod Suite",
    description: "Perfect for business travelers with work space",
    price: 249,
    capacity: 2,
    features: ["Work Space", "High-Speed WiFi", "Business Center Access"],
    images: [
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop"
    ],
    badge: "Business"
  },
  {
    id: 5,
    name: "Ocean View Pod",
    description: "Stunning ocean views with balcony access",
    price: 349,
    capacity: 2,
    features: ["Ocean View", "Private Balcony", "Premium Location"],
    images: [
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop"
    ],
    badge: "Ocean View"
  },
  {
    id: 6,
    name: "Studio Pod Suite",
    description: "Luxury studio with full kitchen and living area",
    price: 499,
    capacity: 3,
    features: ["Full Kitchen", "Living Area", "Luxury Amenities"],
    images: [
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop"
    ],
    badge: "Luxury"
  }
];

// Amenities data
const amenities = [
  { icon: "🏊‍♂️", name: "Swimming Pool", description: "Heated outdoor pool with stunning views" },
  { icon: "🏋️‍♂️", name: "Fitness Center", description: "24/7 gym with modern equipment" },
  { icon: "🍽️", name: "Restaurant", description: "Fine dining with local and international cuisine" },
  { icon: "🚗", name: "Free Parking", description: "Complimentary parking for all guests" },
  { icon: "📶", name: "Free WiFi", description: "High-speed internet throughout the hotel" },
  { icon: "🧖‍♀️", name: "Spa & Wellness", description: "Relaxing spa treatments and massage" }
];

export default function HomePage() {
  const DEFAULT_HERO_IMAGE =
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1600&h=900&fit=crop&auto=format&q=80';
  const DEFAULT_LOGO_URL =
    process.env.NEXT_PUBLIC_LOGO_URL || 'https://podnbeyond.com/wp-content/uploads/2024/01/logo.png';

  // CMS Data State
  const [heroContent, setHeroContent] = useState<Content | null>(null);
  const [aboutContent, setAboutContent] = useState<Content | null>(null);
  const [contactContent, setContactContent] = useState<Content | null>(null);
  const [footerContent, setFooterContent] = useState<Content | null>(null);
  const [testimonialsData, setTestimonialsData] = useState<Testimonial[]>([]);
  const [amenitiesData, setAmenitiesData] = useState<Amenity[]>([]);
  const [heroImage, setHeroImage] = useState<Image | null>(null);
  const [isLoadingCMS, setIsLoadingCMS] = useState(true);

  // Booking Form State
  const [formData, setFormData] = useState<BookingFormData>({
    guestName: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    guests: '1',
    roomId: '',
    specialRequests: ''
  });

  // Room Availability State
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [nights, setNights] = useState<number>(0);

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    const fetchCMSData = async () => {
      try {
        // Fetch hero content
        const heroResponse = await axios.get('/api/cms/content/HERO_SECTION');
        if (heroResponse.data.success) {
          setHeroContent(heroResponse.data.content);
        }

        // Fetch about content
        const aboutResponse = await axios.get('/api/cms/content/ABOUT_SECTION');
        if (aboutResponse.data.success) {
          setAboutContent(aboutResponse.data.content);
        }

        // Fetch contact content
        const contactResponse = await axios.get('/api/cms/content/CONTACT_SECTION');
        if (contactResponse.data.success) {
          setContactContent(contactResponse.data.content);
        }

        // Fetch footer content
        const footerResponse = await axios.get('/api/cms/content/FOOTER_SECTION');
        if (footerResponse.data.success) {
          setFooterContent(footerResponse.data.content);
        }

        // Fetch testimonials
        const testimonialsResponse = await axios.get('/api/cms/testimonials');
        if (testimonialsResponse.data.success) {
          setTestimonialsData(testimonialsResponse.data.testimonials);
        }

        // Fetch amenities
        const amenitiesResponse = await axios.get('/api/cms/amenities');
        if (amenitiesResponse.data.success) {
          setAmenitiesData(amenitiesResponse.data.amenities);
        }

        // Fetch hero image
        const heroImageResponse = await axios.get('/api/cms/images/HERO_IMAGE');
        if (heroImageResponse.data.success && heroImageResponse.data.images.length > 0) {
          setHeroImage(heroImageResponse.data.images[0]);
        }

      } catch (error) {
        console.error('Error fetching CMS data:', error);
      } finally {
        setIsLoadingCMS(false);
      }
    };

    fetchCMSData();
  }, []);

  // Fetch available rooms when dates change
  useEffect(() => {
    if (formData.checkIn && formData.checkOut) {
      fetchAvailableRooms();
    }
  }, [formData.checkIn, formData.checkOut, formData.guests]);

  const fetchAvailableRooms = async () => {
    if (!formData.checkIn || !formData.checkOut) return;

    setIsLoadingRooms(true);
    try {
      const response = await axios.get('/api/booking/availability', {
        params: {
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          guests: parseInt(formData.guests)
        }
      });

      if (response.data.success) {
        setAvailableRooms(response.data.rooms);
      }
    } catch (error) {
      console.error('Error fetching available rooms:', error);
      setAvailableRooms([]);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Update selected room and calculate price when room changes
    if (name === 'roomId') {
      const room = availableRooms.find(r => r.id.toString() === value);
      setSelectedRoom(room || null);
      
      if (room && formData.checkIn && formData.checkOut) {
        const checkIn = new Date(formData.checkIn);
        const checkOut = new Date(formData.checkOut);
        const nightsCount = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        setNights(nightsCount);
        setTotalPrice(room.totalPrice || room.pricePerNight * nightsCount);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // Prepare booking data with correct types
      const bookingData = {
        ...formData,
        guests: parseInt(formData.guests),
        roomId: parseInt(formData.roomId)
      };

      // Create booking (PENDING status)
      const bookingResponse = await axios.post('/api/booking/book', bookingData);
      const bookingId = bookingResponse.data.booking.id;
      const bookingTotalPrice = bookingResponse.data.booking.totalPrice;

      // Create payment order
      const orderResponse = await axios.post('/api/payment/create-order', {
        amount: bookingTotalPrice,
        guestName: formData.guestName,
        bookingId: bookingId
      });

      if (orderResponse.data.success) {
        setIsPaymentProcessing(true);
        
        // Initialize Razorpay with centralized config
        const options = {
          key: RAZORPAY_CONFIG.KEY_ID,
          amount: orderResponse.data.amount,
          currency: 'INR',
          name: RAZORPAY_CONFIG.HOTEL_NAME,
          description: `${RAZORPAY_CONFIG.HOTEL_DESCRIPTION} - ${selectedRoom?.name || 'Room'}`,
          order_id: orderResponse.data.orderId,
          handler: (response: any) => handlePaymentSuccess(response, bookingId),
          prefill: {
            name: formData.guestName,
            email: formData.email,
            contact: formData.phone
          },
          theme: RAZORPAY_CONFIG.THEME,
          modal: {
            ondismiss: () => {
              setIsPaymentProcessing(false);
              setSubmitMessage('Payment cancelled. You can try again.');
            }
          }
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      } else {
        setSubmitMessage('Failed to create payment order');
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      setSubmitMessage(error.response?.data?.error || 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (response: any, bookingId: number) => {
    try {
      console.log('Payment successful, verifying with backend...', response);
      
      // Verify payment and confirm booking
      const verificationResponse = await axios.post('/api/payment/verify-payment', {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature
      });

      if (verificationResponse.data.success) {
        console.log('Payment verified, booking finalized:', verificationResponse.data);
        
        // Show success message with booking details
        const bookingDetails = verificationResponse.data.booking;
        setSubmitMessage(`✅ Booking confirmed and payment successful! 
          Booking ID: ${bookingDetails.id}
          Room: ${bookingDetails.roomName}
          Check-in: ${new Date(bookingDetails.checkIn).toLocaleDateString()}
          Check-out: ${new Date(bookingDetails.checkOut).toLocaleDateString()}
          Total: ${formatCurrency(bookingDetails.totalPrice)}
          
          A confirmation email has been sent to ${bookingDetails.email}`);
        
        // Reset form
        setFormData({
          guestName: '',
          email: '',
          phone: '',
          checkIn: '',
          checkOut: '',
          guests: '1',
          roomId: '',
          specialRequests: ''
        });
        setSelectedRoom(null);
        setTotalPrice(0);
        setNights(0);
        
        // Clear available rooms to force refresh
        setAvailableRooms([]);
      } else {
        console.error('Payment verification failed:', verificationResponse.data);
        setSubmitMessage('❌ Payment verification failed. Please contact support.');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setSubmitMessage(`❌ Payment verification failed: ${error.response?.data?.error || 'Unknown error'}. Please contact support.`);
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  // Show loading only for a short time, then show the page with fallback content
  if (isLoadingCMS && false) { // Temporarily disable loading screen
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hotel content...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>POD N BEYOND | Smart Hotel – Jamshedpur</title>
        <meta name="description" content="India's first pod hotel in Jamshedpur. Stay in the heart of the Steel City and experience a world-class ambiance at POD N BEYOND." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white" style={{ backgroundColor: 'white', minHeight: '100vh' }}>
        {/* Hero Section */}
        <section 
          className="relative h-screen flex items-center justify-center"
          style={{
            backgroundImage: `url(${heroImage ? heroImage.url : DEFAULT_HERO_IMAGE})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            height: '100vh',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Background Image Overlay */}
          <div className="absolute inset-0 bg-black/40"></div>

          {/* Top Header with Logo */}
          <div className="absolute top-0 left-0 right-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {!logoFailed ? (
                  <img
                    src={DEFAULT_LOGO_URL}
                    alt="POD N BEYOND"
                    className="h-10 md:h-12 w-auto"
                    onError={() => setLogoFailed(true)}
                  />
                ) : (
                  <span className="text-white text-xl md:text-2xl font-bold tracking-wide">pod ’n’ beyond</span>
                )}
              </div>
              <nav className="hidden md:flex items-center space-x-6 text-white/90">
                <a href="#rooms" className="hover:text-white transition-colors">Rooms</a>
                <a href="#booking" className="hover:text-white transition-colors">Reservation</a>
                <a href="#contact" className="hover:text-white transition-colors">Contact</a>
              </nav>
            </div>
          </div>
          
          {/* Removed award badge as requested */}
          
          {/* Hero Content */}
          <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              {heroContent?.title || 'POD N BEYOND | Smart Hotel'}
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto font-light">
              {heroContent?.subtitle || "INDIA'S FIRST POD, LAUNCHED IN JAMSHEDPUR"}
            </p>
            <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
              {heroContent?.description || 'Stay in the heart of the STEEL CITY and experience a world-class ambiance'}
            </p>
            
            {/* Price Display */}
            <div className="text-2xl font-bold mb-8">
              Rooms from ₹1,999 / night
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="#booking" 
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors duration-300 transform hover:scale-105"
              >
                Book Your Stay
              </a>
              <a 
                href="#rooms" 
                className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-300 transform hover:scale-105"
              >
                View Rooms
              </a>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </section>

        {/* About Section with Image Gallery */}
        {aboutContent && (
          <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
                <div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-6">
                    {aboutContent.title}
                  </h2>
                  <p className="text-xl text-gray-600 mb-6">
                    {aboutContent.subtitle}
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    {aboutContent.description}
                  </p>
                </div>
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop" 
                    alt="Hotel Interior"
                    className="rounded-lg shadow-2xl"
                  />
                  <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-lg shadow-lg">
                    <div className="text-3xl font-bold text-blue-600">5★</div>
                    <div className="text-sm text-gray-600">Rated by Guests</div>
                  </div>
                </div>
              </div>
              
              {/* Image Gallery */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <img src="https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=300&fit=crop" alt="Hotel Interior" className="rounded-lg shadow-lg hover:scale-105 transition-transform duration-300" />
                <img src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop" alt="Hotel Interior" className="rounded-lg shadow-lg hover:scale-105 transition-transform duration-300" />
                <img src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop" alt="Hotel Interior" className="rounded-lg shadow-lg hover:scale-105 transition-transform duration-300" />
                <img src="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&fit=crop" alt="Hotel Interior" className="rounded-lg shadow-lg hover:scale-105 transition-transform duration-300" />
              </div>
            </div>
          </section>
        )}

        {/* Read More Section (replaces amenities) */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">NEW GENERATION “BUDGET SMART HOTEL”</h2>
                <p className="text-lg text-gray-700 mb-6">
                  POD N BEYOND is India’s first pod hotel launched in Jamshedpur. Stay in the heart of the STEEL CITY and experience a world-class ambiance with smart, comfortable, and affordable pods.
                </p>
                <ul className="space-y-3 text-gray-700 mb-8">
                  <li className="flex items-start"><span className="mr-2">⏰</span> 24 HOURS Check-in / Check Out</li>
                  <li className="flex items-start"><span className="mr-2">🕒</span> SHORT STAYS: 4 hrs, 8 hrs, 12 hrs (facilities without Breakfast)</li>
                  <li className="flex items-start"><span className="mr-2">🧳</span> LONG STAYS: Don’t forget to ask for long term special deals!</li>
                </ul>
                <a
                  href="https://podnbeyond.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  READ MORE
                </a>
              </div>
              <div className="relative">
                <img
                  src={heroImage ? heroImage.url : DEFAULT_HERO_IMAGE}
                  alt="POD N BEYOND"
                  className="rounded-xl shadow-2xl"
                />
                <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-lg shadow-lg">
                  <div className="text-sm text-gray-600">Book Your Pod Now! Come make new friends.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Rooms Section - Enhanced like WordPress site */}
        <section id="rooms" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">ROOMS & SUITES</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Choose from a variety of sizes and styles.
              </p>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">All</button>
              <button className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors">En suite</button>
              <button className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors">King</button>
              <button className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors">Queen</button>
              <button className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors">Under ₹3,000</button>
            </div>
            
            {/* Rooms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rooms.map((room) => (
                <div key={room.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  {/* Room Images */}
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={room.images[0]} 
                      alt={room.name}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                    {room.badge && (
                      <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {room.badge}
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {formatCurrency(room.price)}
                    </div>
                  </div>
                  
                  {/* Room Details */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{room.name}</h3>
                    <p className="text-gray-600 mb-4">{room.description}</p>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {room.features.map((feature, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                          {feature}
                        </span>
                      ))}
                    </div>
                    
                    {/* Capacity */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-600">Capacity: {room.capacity} guests</span>
                      <span className="text-2xl font-bold text-blue-600">{formatCurrency(room.price)}</span>
                    </div>
                    
                    {/* Book Now Button */}
                    <button 
                      onClick={() => {
                        document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
                        setFormData(prev => ({ ...prev, roomType: room.name }));
                      }}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Booking Form Section */}
        <section id="booking" className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Book Your Stay</h2>
              <p className="text-xl text-gray-600">
                Reserve your perfect room and experience luxury at its finest
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-8 shadow-lg">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Guest Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      id="guestName"
                      name="guestName"
                      required
                      value={formData.guestName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                </div>

                {/* Stay Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700 mb-2">Check-in Date *</label>
                    <input
                      type="date"
                      id="checkIn"
                      name="checkIn"
                      required
                      value={formData.checkIn}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="checkOut" className="block text-sm font-medium text-gray-700 mb-2">Check-out Date *</label>
                    <input
                      type="date"
                      id="checkOut"
                      name="checkOut"
                      required
                      value={formData.checkOut}
                      onChange={handleInputChange}
                      min={formData.checkIn || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-2">Number of Guests *</label>
                    <select
                      id="guests"
                      name="guests"
                      required
                      value={formData.guests}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="1">1 Guest</option>
                      <option value="2">2 Guests</option>
                      <option value="3">3 Guests</option>
                      <option value="4">4 Guests</option>
                      <option value="5">5 Guests</option>
                      <option value="6">6 Guests</option>
                    </select>
                  </div>
                </div>

                {/* Room Selection */}
                <div>
                  <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-2">Select Room *</label>
                  {isLoadingRooms ? (
                    <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
                        Loading available rooms...
                      </div>
                    </div>
                  ) : availableRooms.length > 0 ? (
                    <select
                      id="roomId"
                      name="roomId"
                      required
                      value={formData.roomId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a room</option>
                      {availableRooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name} - {formatCurrency(room.totalPrice || room.pricePerNight)} 
                          {room.hasSeasonalRate && ' (Seasonal Rate)'}
                        </option>
                      ))}
                    </select>
                  ) : formData.checkIn && formData.checkOut ? (
                    <div className="w-full px-4 py-3 border border-red-300 rounded-lg bg-red-50 text-red-700">
                      No rooms available for the selected dates and guest count.
                    </div>
                  ) : (
                    <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                      Please select check-in and check-out dates to see available rooms.
                    </div>
                  )}
                </div>

                {/* Price Summary */}
                {selectedRoom && totalPrice > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Booking Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Room:</span>
                        <span>{selectedRoom.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nights:</span>
                        <span>{nights} night{nights !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price per night:</span>
                        <span>{formatCurrency(selectedRoom.pricePerNight)}</span>
                      </div>
                      {selectedRoom.hasSeasonalRate && (
                        <div className="flex justify-between text-blue-600">
                          <span>Seasonal rate applied</span>
                        </div>
                      )}
                      <div className="border-t pt-1 mt-2">
                        <div className="flex justify-between font-semibold">
                          <span>Total:</span>
                          <span>{formatCurrency(totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
                  <textarea
                    id="specialRequests"
                    name="specialRequests"
                    rows={3}
                    value={formData.specialRequests}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any special requests or preferences..."
                  ></textarea>
                </div>
                
                {submitMessage && (
                  <div className={`p-4 rounded-lg ${submitMessage.includes('Error') || submitMessage.includes('Failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {submitMessage}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isSubmitting || isPaymentProcessing || !formData.roomId}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Creating Booking...' : 
                   isPaymentProcessing ? 'Processing Payment...' : 
                   'Proceed to Payment'}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        {contactContent && (
          <section id="contact" className="py-20 bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                  <h2 className="text-4xl font-bold mb-6">{contactContent.title}</h2>
                  <p className="text-xl mb-6">{contactContent.subtitle}</p>
                  <p className="text-gray-300 mb-8">{contactContent.description}</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-white text-xl">📍</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Address</h4>
                        <p className="text-gray-300">New Kalimati Road, Near Howrah Bridge, Sakchi, Jamshedpur</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-white text-xl">📞</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Phone</h4>
                        <p className="text-gray-300">(91) 82350 71333, (91) 82350 72333, (91) 90315 73555, (91) 82350 74555</p>
                        <p className="text-gray-300">(91) 90310 00931, (91) 93348 04739</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-white text-xl">✉️</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Email</h4>
                        <p className="text-gray-300">info@podnbeyond.com, ravish2301@gmail.com</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800 p-8 rounded-lg">
                  <h3 className="text-2xl font-bold mb-6">Send us a Message</h3>
                  <form className="space-y-4">
                    <input
                      type="text"
                      placeholder="Your Name"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="email"
                      placeholder="Your Email"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <textarea
                      rows={4}
                      placeholder="Your Message"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    ></textarea>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Send Message
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">{footerContent?.title || 'Pod & Beyond Hotel'}</h3>
              <p className="text-gray-400 mb-6">{footerContent?.subtitle || 'Luxury Redefined'}</p>
              <p className="text-gray-400 mb-8">{footerContent?.description || 'Experience luxury and comfort in the heart of the city. Book your perfect stay with us.'}</p>
              
              <div className="flex justify-center space-x-6 mb-8">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
                <a href="/loyalty" className="text-gray-400 hover:text-white transition-colors">Loyalty Program</a>
                <a href="/admin" className="text-gray-400 hover:text-white transition-colors">Admin</a>
              </div>
              
              <div className="border-t border-gray-800 pt-8">
                <p className="text-gray-400">© 2024 Pod & Beyond Hotel. All rights reserved.</p>
              </div>
            </div>
          </div>
        </footer>
    </div>
    </>
  );
}
