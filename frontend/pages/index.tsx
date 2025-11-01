import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import { RAZORPAY_CONFIG } from '../config/razorpay';
import Gallery from '../components/Gallery';

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

// POD N BEYOND actual pod types (fallback if API doesn't load)
const rooms = [
  {
    id: 1,
    name: "Capsule Pod",
    description: "Compact and efficient capsule-style pod perfect for solo travelers. Features reading light, power outlet, and secure locker.",
    price: 999,
    pricePerNight: 999,
    capacity: 1,
    type: "Capsule",
    features: ["Wi-Fi", "Reading Light", "Power Outlet", "Secure Locker"],
    images: ["http://localhost:4000/uploads/podnbeyond-gallery-1.jpg"],
    badge: "Budget Friendly"
  },
  {
    id: 2,
    name: "Single Pod",
    description: "Private single pod with comfortable bed and modern amenities. Perfect for budget-conscious travelers.",
    price: 1299,
    pricePerNight: 1299,
    capacity: 1,
    type: "Single",
    features: ["Wi-Fi", "TV", "Work Desk", "Private Bathroom"],
    images: ["http://localhost:4000/uploads/podnbeyond-gallery-2.jpg"],
    badge: "Popular"
  },
  {
    id: 3,
    name: "Bunk Pod",
    description: "Unique bunk-style pod perfect for friends or family. Features two comfortable bunks with privacy curtains.",
    price: 1599,
    pricePerNight: 1599,
    capacity: 2,
    type: "Bunk",
    features: ["Wi-Fi", "Privacy Curtains", "Reading Lights", "Shared Bathroom"],
    images: ["http://localhost:4000/uploads/podnbeyond-gallery-3.jpg"]
  },
  {
    id: 4,
    name: "Double Pod",
    description: "Spacious double pod with queen-size bed for couples or friends traveling together.",
    price: 1899,
    pricePerNight: 1899,
    capacity: 2,
    type: "Double",
    features: ["Wi-Fi", "TV", "Work Desk", "Private Bathroom", "Mini Fridge"],
    images: ["http://localhost:4000/uploads/podnbeyond-gallery-4.jpg"]
  },
  {
    id: 5,
    name: "Tri Pod",
    description: "Three-person pod ideal for small groups or families. Comfortable and affordable.",
    price: 2499,
    pricePerNight: 2499,
    capacity: 3,
    type: "Tri",
    features: ["Wi-Fi", "TV", "Private Bathroom", "Hot Breakfast"],
    images: ["http://localhost:4000/uploads/podnbeyond-gallery-5.jpg"]
  },
  {
    id: 6,
    name: "Queen Pod",
    description: "Luxurious queen pod with premium amenities and extra space. Perfect for a comfortable stay.",
    price: 2799,
    pricePerNight: 2799,
    capacity: 2,
    type: "Queen",
    features: ["Wi-Fi", "Smart TV", "Work Desk", "Premium Bathroom", "Coffee Maker"],
    images: ["http://localhost:4000/uploads/podnbeyond-gallery-6.jpg"],
    badge: "Luxury"
  },
  {
    id: 7,
    name: "Quadra Pod",
    description: "Spacious four-person pod perfect for families. Features separate sleeping areas and ample space.",
    price: 3299,
    pricePerNight: 3299,
    capacity: 4,
    type: "Quadra",
    features: ["Wi-Fi", "TV", "Work Desk", "Private Bathroom", "Mini Fridge"],
    images: ["http://localhost:4000/uploads/podnbeyond-gallery-7.jpg"]
  },
  {
    id: 8,
    name: "King Pod",
    description: "Our most spacious and luxurious pod with king-size bed and premium facilities. Ultimate comfort.",
    price: 3499,
    pricePerNight: 3499,
    capacity: 2,
    type: "King",
    features: ["Wi-Fi", "Smart TV", "Work Station", "Premium Bathroom", "Coffee Maker", "City View"],
    images: ["http://localhost:4000/uploads/podnbeyond-gallery-8.jpg"],
    badge: "Premium"
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
  const DEFAULT_LOGO_URL = '/logo-podnbeyond.png';
  const [galleryImages, setGalleryImages] = useState<Array<{id: number, url: string, title?: string, altText?: string}>>([]);
  const [apiRooms, setApiRooms] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);

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
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);

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
    const fetchAllData = async () => {
      // Fetch CMS content (non-critical, failures won't block properties)
      try {
        const heroResponse = await axios.get('/api/cms/content/HERO_SECTION');
        if (heroResponse.data.success) setHeroContent(heroResponse.data.content);
      } catch (err) { console.warn('⚠️  Hero content not available'); }

      try {
        const aboutResponse = await axios.get('/api/cms/content/ABOUT_SECTION');
        if (aboutResponse.data.success) setAboutContent(aboutResponse.data.content);
      } catch (err) { console.warn('⚠️  About content not available'); }

      try {
        const contactResponse = await axios.get('/api/cms/content/CONTACT_SECTION');
        if (contactResponse.data.success) setContactContent(contactResponse.data.content);
      } catch (err) { console.warn('⚠️  Contact content not available'); }

      try {
        const footerResponse = await axios.get('/api/cms/content/FOOTER_SECTION');
        if (footerResponse.data.success) setFooterContent(footerResponse.data.content);
      } catch (err) { console.warn('⚠️  Footer content not available'); }

      try {
        const testimonialsResponse = await axios.get('/api/cms/testimonials');
        if (testimonialsResponse.data.success) setTestimonialsData(testimonialsResponse.data.testimonials);
      } catch (err) { console.warn('⚠️  Testimonials not available'); }

      try {
        const amenitiesResponse = await axios.get('/api/cms/amenities');
        if (amenitiesResponse.data.success) setAmenitiesData(amenitiesResponse.data.amenities);
      } catch (err) { console.warn('⚠️  Amenities not available'); }

      try {
        const heroImageResponse = await axios.get('/api/cms/images/HERO_IMAGE');
        if (heroImageResponse.data.success && heroImageResponse.data.images.length > 0) {
          setHeroImage(heroImageResponse.data.images[0]);
        }
      } catch (err) { console.warn('⚠️  Hero image not available'); }

      try {
        const galleryResponse = await axios.get('/api/cms/images/GALLERY_IMAGE');
        if (galleryResponse.data.success) setGalleryImages(galleryResponse.data.images);
      } catch (err) { console.warn('⚠️  Gallery images not available'); }

      // CRITICAL: Fetch properties (must succeed for booking to work)
      try {
        console.log('🔍 Fetching properties from:', `${process.env.NEXT_PUBLIC_API_URL}/api/properties`);
        const propertiesResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/properties`);
        console.log('📦 Properties response:', propertiesResponse.data);
        if (propertiesResponse.data.success) {
          console.log('✅ Loaded', propertiesResponse.data.count, 'properties:', propertiesResponse.data.properties.map((p: any) => p.name));
          setProperties(propertiesResponse.data.properties);
          console.log('✅ Properties state updated');
        } else {
          console.error('❌ Properties fetch unsuccessful:', propertiesResponse.data);
        }
      } catch (error) {
        console.error('❌ CRITICAL: Failed to load properties:', error);
        alert('Failed to load hotel locations. Please refresh the page.');
      }

      // Fetch rooms (legacy fallback)
      try {
        const roomsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/booking/rooms`);
        if (Array.isArray(roomsResponse.data)) {
          console.log('✅ Loaded', roomsResponse.data.length, 'rooms from API');
          setApiRooms(roomsResponse.data);
        }
      } catch (err) { console.warn('⚠️  Legacy rooms API not available'); }

      setIsLoadingCMS(false);
    };

    fetchAllData();
  }, []);

  // Fetch rooms when property changes
  useEffect(() => {
    async function fetchPropertyRooms() {
      if (selectedPropertyId) {
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/properties/${selectedPropertyId}/rooms`);
          if (response.data.success) {
            setApiRooms(response.data.rooms);
            console.log(`✅ Loaded ${response.data.count} rooms for ${selectedProperty?.name}`);
          }
        } catch (error) {
          console.error('Error fetching property rooms:', error);
        }
      }
    }
    fetchPropertyRooms();
  }, [selectedPropertyId]);

  // User must click "Search" button to fetch available rooms (no auto-search)

  const fetchAvailableRooms = async () => {
    if (!formData.checkIn || !formData.checkOut) {
      console.warn('⚠️  Missing dates:', { checkIn: formData.checkIn, checkOut: formData.checkOut });
      return;
    }

    console.log('🔍 Starting search:', {
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      selectedPropertyId,
      propertiesCount: properties.length,
      apiUrl: process.env.NEXT_PUBLIC_API_URL
    });

    setIsLoadingRooms(true);
    setAvailableRooms([]); // Clear previous results
    
    try {
      if (selectedPropertyId) {
        // Search specific property
        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/properties/${selectedPropertyId}/availability`;
        console.log('📡 Fetching from:', url);
        const response = await axios.get(url, {
          params: {
            checkIn: formData.checkIn,
            checkOut: formData.checkOut
          }
        });

        console.log('📦 Response:', response.data);
        if (response.data.success && Array.isArray(response.data.rooms)) {
          setAvailableRooms(response.data.rooms);
          console.log(`✅ Found ${response.data.rooms.length} rooms at ${selectedProperty?.name}`);
        } else {
          console.warn('⚠️  Unexpected response format:', response.data);
        }
      } else {
        // Search ALL properties
        console.log(`🌍 Searching across ${properties.length} properties...`);
        const allRooms = [];
        for (const property of properties) {
          try {
            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/properties/${property.id}/availability`;
            console.log(`  📡 Checking ${property.name} (ID: ${property.id})...`);
            const response = await axios.get(url, {
              params: {
                checkIn: formData.checkIn,
                checkOut: formData.checkOut
              }
            });
            console.log(`  📦 ${property.name} response:`, response.data);
            if (response.data.success && response.data.rooms) {
              allRooms.push(...response.data.rooms);
              console.log(`  ✅ ${property.name}: ${response.data.rooms.length} rooms`);
            }
          } catch (err) {
            console.error(`❌ Error checking ${property.name}:`, err);
          }
        }
        setAvailableRooms(allRooms);
        console.log(`✅ Total found: ${allRooms.length} rooms across ${properties.length} properties`);
      }
    } catch (error) {
      console.error('❌ Error fetching available rooms:', error);
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
        // Use calculatedPrice from availability API if available
        const calculatedTotal = room.calculatedPrice?.totalPrice;
        setTotalPrice(calculatedTotal || room.pricePerNight * nightsCount);
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
      const bookingResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/booking/book`, bookingData);
      const bookingId = bookingResponse.data.booking.id;
      const bookingTotalPrice = bookingResponse.data.booking.totalPrice;

      // Create payment order
      const orderResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/payment/create-order`, {
        amount: bookingTotalPrice,
        guestName: formData.guestName,
        bookingId: bookingId,
        testMode: true // Enable test mode for development
      });

      if (orderResponse.data.success) {
        // Check if we're in test mode
        if (orderResponse.data.testMode) {
          console.log('⚠️  TEST MODE: Skipping Razorpay, auto-confirming payment');
          
          // Automatically confirm the test payment
          const confirmResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/payment/test-confirm`, {
            bookingId: bookingId,
            orderId: orderResponse.data.order.id
          });

          if (confirmResponse.data.success) {
            setSubmitMessage(`✅ TEST MODE: Booking confirmed! Booking ID: ${bookingId}. You earned ${confirmResponse.data.loyaltyPoints} loyalty points!`);
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
            setAvailableRooms([]);
            setSelectedRoom(null);
            setTotalPrice(0);
          }
        } else {
          // Real Razorpay payment mode
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
        }
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
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo-podnbeyond.png" />
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
                <a href="#gallery" className="hover:text-white transition-colors">Explore</a>
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
                href="#location-selector" 
                className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-300 transform hover:scale-105"
              >
                View Properties
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

        {/* Our Properties - Prominent Section */}
        <section id="location-selector" className="py-20 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-12">
              <div className="inline-block mb-4 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                POD N BEYOND - 3 LOCATIONS IN JAMSHEDPUR
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Our Properties
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                India's First Pod Hotel Chain across Jamshedpur
              </p>
            </div>

            {/* Properties Grid - Large Prominent Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="group rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* Property Image */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}${property.images[0]}`}
                      alt={property.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    
                    {/* Rating Badge */}
                    <div className="absolute top-3 right-3 bg-white px-3 py-1.5 rounded-full shadow-lg">
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-500">⭐</span>
                        <span className="font-bold text-gray-900">{property.rating}</span>
                        <span className="text-gray-500 text-xs">({property.totalRatings})</span>
                      </div>
                    </div>

                    {/* Property Name Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="text-xl font-bold mb-1">{property.name}</h3>
                      <div className="flex items-center text-white/90 text-sm">
                        <span className="mr-1">📍</span>
                        <span>{property.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="bg-white p-5">
                    {/* Quick Info */}
                    <div className="flex items-center justify-between mb-3 text-sm">
                      <div className="flex items-center text-gray-700">
                        <span className="mr-1.5 text-blue-600">🏨</span>
                        <span className="font-medium">{property._count.rooms} Room Types</span>
                      </div>
                      <div className="text-gray-500 text-xs">{property.location}</div>
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {property.amenities.slice(0, 3).map((amenity: string, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700"
                        >
                          ✓ {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Read More Section (replaces amenities) */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">WHO WE ARE</h2>
                <div className="space-y-4 text-lg text-gray-700 mb-8">
                  <p>
                    The Pod N Beyond Smart Hotel, Jamshedpur is <strong>India's 1st Pod Hotel</strong>. It is not only non-conventional budget hotel, we have built this from the scratch for smart travelers just like you, who wants to see and explore, with all the world class facilities at a very affordable rate.
                  </p>
                  <p>
                    Stay in the heart of <strong>STEEL CITY</strong> (Kalimati Road, Sakchi) and experience a world class ambiance with 10 different options to choose from: <strong>Capsule, Single, Double, Bunk, Tri, Quadra, Queen and King Pods</strong>.
                  </p>
                  <p>
                    This is not all, you also get <strong>complementary Hot Breakfast, Self-Service Laundry, Wi-Fi, Local Calls</strong>!
                  </p>
                  <p>
                    We also help professionals and travelers to network and connect by using our innovative business center which offers <strong>E-Library, Magazine Stand, Music Corner and Game Zones</strong>.
                  </p>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg mb-6">
                  <h3 className="font-bold text-gray-900 mb-3 text-xl">Flexible Check-in Options:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start"><span className="mr-2">⏰</span> 24 HOURS Check-in / Check Out</li>
                    <li className="flex items-start"><span className="mr-2">🕒</span> SHORT STAYS: 4 hrs, 8 hrs, 12 hrs</li>
                    <li className="flex items-start"><span className="mr-2">🧳</span> LONG STAYS: Ask for special deals!</li>
                  </ul>
                </div>
                <a
                  href="#booking"
                  className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg"
                >
                  BOOK YOUR POD NOW
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

        {/* Search & Booking Section - Prominent */}
        <section id="booking" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Find Your Perfect Pod</h2>
              <p className="text-xl text-gray-600">
                Search across all our properties in Jamshedpur
              </p>
            </div>

            {/* Search Form */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 shadow-2xl mb-12">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Search Criteria */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-white text-sm font-semibold mb-2">Check-in Date *</label>
                    <input
                      type="date"
                      name="checkIn"
                      required
                      value={formData.checkIn}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-0 rounded-lg focus:ring-2 focus:ring-blue-400 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-semibold mb-2">Check-out Date *</label>
                    <input
                      type="date"
                      name="checkOut"
                      required
                      value={formData.checkOut}
                      onChange={handleInputChange}
                      min={formData.checkIn || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-0 rounded-lg focus:ring-2 focus:ring-blue-400 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-semibold mb-2">Guests *</label>
                    <select
                      name="guests"
                      required
                      value={formData.guests}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-0 rounded-lg focus:ring-2 focus:ring-blue-400 font-medium"
                    >
                      <option value="1">1 Guest</option>
                      <option value="2">2 Guests</option>
                      <option value="3">3 Guests</option>
                      <option value="4">4+ Guests</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white text-sm font-semibold mb-2">
                      Location {properties.length > 0 && <span className="text-blue-200">({properties.length} properties)</span>}
                    </label>
                    <select
                      value={selectedPropertyId || 'all'}
                      onChange={(e) => {
                        console.log('Location changed to:', e.target.value);
                        if (e.target.value === 'all') {
                          setSelectedPropertyId(null);
                          setSelectedProperty(null);
                          console.log('Selected: All Locations');
                        } else {
                          const propId = parseInt(e.target.value);
                          setSelectedPropertyId(propId);
                          const prop = properties.find(p => p.id === propId);
                          setSelectedProperty(prop || null);
                          console.log('Selected property:', prop);
                        }
                      }}
                      className="w-full px-4 py-3 border-0 rounded-lg focus:ring-2 focus:ring-blue-400 font-medium"
                    >
                      <option value="all">All Locations ({properties.length} properties)</option>
                      {properties.length === 0 && (
                        <option disabled>Loading properties...</option>
                      )}
                      {properties.map(prop => (
                        <option key={prop.id} value={prop.id}>
                          {prop.location} - {prop.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Search Button */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.checkIn && formData.checkOut) {
                        fetchAvailableRooms();
                        setTimeout(() => {
                          document.getElementById('available-rooms')?.scrollIntoView({ behavior: 'smooth' });
                        }, 300);
                      } else {
                        alert('Please select check-in and check-out dates');
                      }
                    }}
                    className="bg-white text-blue-600 px-12 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
                  >
                    🔍 Search Available Rooms
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Available Rooms Section */}
        <section id="available-rooms" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                {isLoadingRooms ? 'Searching...' : 'Available Rooms'}
              </h2>
              <p className="text-xl text-gray-600">
                {isLoadingRooms 
                  ? 'Finding available rooms for your dates...'
                  : availableRooms.length > 0 
                    ? `${availableRooms.length} room${availableRooms.length > 1 ? 's' : ''} available${selectedPropertyId ? ` at ${selectedProperty?.name}` : ' across all properties'}`
                    : formData.checkIn && formData.checkOut
                      ? '❌ No rooms available for selected dates. Try different dates or location.'
                      : '👆 Select dates above and click "Search" to see available rooms'
                }
              </p>
            </div>
            
            {/* Loading Indicator */}
            {isLoadingRooms && (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
              </div>
            )}
            
            {/* Rooms Grid - ONLY show search results */}
            {!isLoadingRooms && availableRooms.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {availableRooms.map((room) => {
                console.log('Rendering room:', room.name, '- Price:', room.pricePerNight || room.price);
                const roomPrice = room.pricePerNight || room.price;
                const roomImages = room.images || [`${process.env.NEXT_PUBLIC_API_URL}/uploads/podnbeyond-gallery-${(room.id % 9) + 1}.jpg`];
                const roomFeatures = room.features || room.type ? [room.type, `${room.capacity} Guest${room.capacity > 1 ? 's' : ''}`] : [];
                
                // Find property for this room
                const roomProperty = properties.find(p => p.id === room.propertyId);
                
                return (
                  <div key={room.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    {/* Room Images */}
                    <div className="relative h-64 overflow-hidden">
                      <img 
                        src={Array.isArray(roomImages) ? roomImages[0] : roomImages} 
                        alt={room.name}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                      {/* Property Badge */}
                      {roomProperty && (
                        <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg">
                          📍 {roomProperty.location}
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-white text-gray-800 px-3 py-1 rounded-full text-sm font-semibold shadow">
                        {formatCurrency(roomPrice)}
                      </div>
                    </div>
                    
                    {/* Room Details */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{room.name}</h3>
                      <p className="text-gray-600 mb-4">{room.description}</p>
                      
                      {/* Features */}
                      {roomFeatures.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {roomFeatures.map((feature, index) => (
                            <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Capacity */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-600">Capacity: {room.capacity} guest{room.capacity > 1 ? 's' : ''}</span>
                        <span className="text-2xl font-bold text-blue-600">{formatCurrency(roomPrice)}</span>
                      </div>
                      
                      {/* Book Now Button */}
                      <button 
                        onClick={() => {
                          setSelectedRoom(room);
                          setFormData(prev => ({ ...prev, roomId: room.id.toString() }));
                          document.getElementById('guest-details')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </section>

        {/* Guest Details Section - Shows after room selection */}
        {selectedRoom && formData.roomId && (
          <section id="guest-details" className="py-20 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Complete Your Booking</h2>
                <p className="text-xl text-gray-600">
                  You're almost done! Just enter your details below.
                </p>
                {selectedRoom && (
                  <div className="mt-6 bg-blue-50 rounded-lg p-6 inline-block">
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 mb-2">{selectedRoom.name}</div>
                      <div className="text-sm text-gray-600">
                        {properties.find(p => p.id === selectedRoom.propertyId)?.name || 'POD N BEYOND'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        📍 {properties.find(p => p.id === selectedRoom.propertyId)?.location || 'Jamshedpur'}
                      </div>
                      {selectedRoom.calculatedPrice && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{selectedRoom.calculatedPrice.nights} nights × ₹{selectedRoom.calculatedPrice.pricePerNight}</span>
                            <span className="font-bold text-gray-900">₹{selectedRoom.calculatedPrice.totalPrice}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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

                  {/* Special Requests */}
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
        )}

        {/* Gallery Section - Images from podnbeyond.com */}
        <section className="py-20 bg-gray-50">
          <Gallery />
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
