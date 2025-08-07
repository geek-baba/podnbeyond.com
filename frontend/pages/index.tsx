import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';

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
    features: ["Work Space", "Business Amenities", "High-Speed WiFi"],
    images: [
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop"
    ],
    badge: "Popular"
  },
  {
    id: 5,
    name: "Ocean View Pod",
    description: "Stunning ocean views with premium amenities",
    price: 349,
    capacity: 2,
    features: ["Ocean View", "Premium Amenities", "Private Balcony"],
    images: [
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop"
    ],
    badge: "Featured"
  },
  {
    id: 6,
    name: "Studio Pod Suite",
    description: "King-sized bed with living area and sofa bed",
    price: 499,
    capacity: 3,
    features: ["King Bed", "Living Area", "Sofa Bed"],
    images: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop"
    ],
    badge: "Updated"
  }
];

// Package deals like the WordPress site
const packages = [
  {
    id: 1,
    name: "Spa Packages",
    price: 149,
    originalPrice: 199,
    discount: "Buy 1 Get 1 Free",
    description: "Relaxing spa treatments and wellness packages for the perfect getaway",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=400&fit=crop"
  },
  {
    id: 2,
    name: "Adventure Awaits",
    price: 125,
    originalPrice: 135,
    discount: "$10 Discount",
    description: "Explore the city with our adventure package including guided tours",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop"
  },
  {
    id: 3,
    name: "Exclusive Online Deals",
    price: 180,
    originalPrice: 240,
    discount: "25% Off",
    description: "Special online-only rates with premium amenities and services",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop"
  }
];

// Enhanced amenities with icons
const amenities = [
  { name: "Free WiFi", icon: "📶", description: "High-speed internet throughout the hotel" },
  { name: "Swimming Pool", icon: "🏊‍♂️", description: "Relaxing outdoor pool with lounge chairs" },
  { name: "Fitness Center", icon: "💪", description: "24/7 gym with modern equipment" },
  { name: "Restaurant", icon: "🍽️", description: "Fine dining with local and international cuisine" },
  { name: "Spa & Wellness", icon: "🧘‍♀️", description: "Rejuvenating spa treatments and massage services" },
  { name: "Conference Rooms", icon: "💼", description: "Business facilities for meetings and events" }
];

// Enhanced testimonials
const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    rating: 5,
    title: "Exceptional Service",
    content: "The staff went above and beyond to make our stay memorable. The pods were spotless and the amenities were top-notch. Highly recommend!",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    location: "New York"
  },
  {
    id: 2,
    name: "Michael Chen",
    rating: 5,
    title: "Perfect Location",
    content: "Great location in the heart of the city. Easy access to attractions and restaurants. The hotel itself is beautiful with excellent service.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    location: "Los Angeles"
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    rating: 4,
    title: "Comfortable Stay",
    content: "Very comfortable pods and friendly staff. The breakfast was delicious and the pool area was perfect for relaxation.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    location: "Chicago"
  }
];

export default function HomePage() {
  // Form state
  const [formData, setFormData] = useState({
    guestName: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    guests: '1',
    roomType: '',
    specialRequests: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // CMS Data
  const [heroContent, setHeroContent] = useState<Content | null>(null);
  const [heroImage, setHeroImage] = useState<Image | null>(null);
  const [aboutContent, setAboutContent] = useState<Content | null>(null);
  const [testimonialsData, setTestimonialsData] = useState<Testimonial[]>([]);
  const [amenitiesData, setAmenitiesData] = useState<Amenity[]>([]);
  const [contactContent, setContactContent] = useState<Content | null>(null);
  const [footerContent, setFooterContent] = useState<Content | null>(null);
  const [isLoadingCMS, setIsLoadingCMS] = useState(true);

  // Fetch CMS data
  useEffect(() => {
    const fetchCMSData = async () => {
      try {
        console.log('Fetching CMS data...');
        
        // Fetch hero content and image
        const heroResponse = await axios.get('/api/cms/content/HERO_SECTION');
        console.log('Hero response:', heroResponse.data);
        if (heroResponse.data.content && heroResponse.data.content.length > 0) {
          setHeroContent(heroResponse.data.content[0]);
        }

        const heroImageResponse = await axios.get('/api/cms/images/HERO_BACKGROUND');
        console.log('Hero image response:', heroImageResponse.data);
        if (heroImageResponse.data.images && heroImageResponse.data.images.length > 0) {
          setHeroImage(heroImageResponse.data.images[0]);
        }

        // Fetch about content
        const aboutResponse = await axios.get('/api/cms/content/ABOUT_SECTION');
        console.log('About response:', aboutResponse.data);
        if (aboutResponse.data.content && aboutResponse.data.content.length > 0) {
          setAboutContent(aboutResponse.data.content[0]);
        }

        // Fetch testimonials
        const testimonialsResponse = await axios.get('/api/cms/testimonials');
        console.log('Testimonials response:', testimonialsResponse.data);
        setTestimonialsData(testimonialsResponse.data.testimonials || []);

        // Fetch amenities
        const amenitiesResponse = await axios.get('/api/cms/amenities');
        console.log('Amenities response:', amenitiesResponse.data);
        setAmenitiesData(amenitiesResponse.data.amenities || []);

        // Fetch contact content
        const contactResponse = await axios.get('/api/cms/content/CONTACT_SECTION');
        console.log('Contact response:', contactResponse.data);
        if (contactResponse.data.content && contactResponse.data.content.length > 0) {
          setContactContent(contactResponse.data.content[0]);
        }

        // Fetch footer content
        const footerResponse = await axios.get('/api/cms/content/FOOTER_SECTION');
        console.log('Footer response:', footerResponse.data);
        if (footerResponse.data.content && footerResponse.data.content.length > 0) {
          setFooterContent(footerResponse.data.content[0]);
        }
        
        console.log('CMS data fetching completed');
      } catch (error) {
        console.error('Failed to fetch CMS data:', error);
      } finally {
        setIsLoadingCMS(false);
      }
    };

    fetchCMSData();
  }, []);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await axios.post('/api/booking/book', formData);
      setSubmitMessage('Booking submitted successfully! We will contact you soon.');
      setFormData({
        guestName: '',
        email: '',
        phone: '',
        checkIn: '',
        checkOut: '',
        guests: '1',
        roomType: '',
        specialRequests: ''
      });
    } catch (error) {
      setSubmitMessage('Error submitting booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Pod & Beyond Hotel - Luxury Accommodation</title>
        <meta name="description" content="Experience luxury and comfort at Pod & Beyond Hotel. Book your perfect stay with us." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white" style={{ backgroundColor: 'white', minHeight: '100vh' }}>
        {/* Hero Section */}
        <section 
          className="relative h-screen flex items-center justify-center"
          style={{
            backgroundImage: heroImage ? `url(${heroImage.url})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          
          {/* Award Badge */}
          <div className="absolute top-8 left-8 bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-bold">
            🏆 TRAVELLERS CHOICE AWARD 2024
          </div>
          
          {/* Hero Content */}
          <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              {heroContent?.title || 'Pod & Beyond Hotel'}
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto font-light">
              {heroContent?.subtitle || 'Experience luxury and comfort in the heart of the city'}
            </p>
            <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
              {heroContent?.description || 'Discover our world-class amenities and exceptional service'}
            </p>
            
            {/* Price Display */}
            <div className="text-2xl font-bold mb-8">
              Rooms from $199 / night
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

        {/* Amenities Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Hotel Amenities</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Enjoy world-class facilities and services designed for your comfort and convenience
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {amenities.map((amenity, index) => (
                <div key={index} className="bg-gray-50 p-8 rounded-lg text-center hover:shadow-lg transition-shadow duration-300">
                  <div className="text-4xl mb-4">{amenity.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{amenity.name}</h3>
                  <p className="text-gray-600">{amenity.description}</p>
                </div>
              ))}
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
              <button className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors">Under $300</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rooms.map((room) => (
                <div key={room.id} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={room.images[0]} 
                      alt={room.name}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                    {room.badge && (
                      <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {room.badge}
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
                      ${room.price}/night
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{room.name}</h3>
                    <p className="text-gray-600 mb-4">{room.description}</p>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {room.features.map((feature, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {feature}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Sleeps {room.capacity}</span>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Check Availability
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Packages Section - Like WordPress site */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">PACKAGES</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Choose from some of the most popular vacation packages
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {packages.map((pkg) => (
                <div key={pkg.id} className="bg-gray-50 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={pkg.image} 
                      alt={pkg.name}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {pkg.discount}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <span className="text-3xl font-bold text-blue-600">${pkg.price}</span>
                      <span className="text-gray-500 line-through ml-2">${pkg.originalPrice}</span>
                      <span className="text-sm text-gray-500 ml-2">/person</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{pkg.name}</h3>
                    <p className="text-gray-600 mb-4">{pkg.description}</p>
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                      Book Package
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Guests Say</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Read reviews from our satisfied guests who have experienced our exceptional service
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="bg-white p-8 rounded-lg shadow-lg">
                  <div className="flex items-center mb-4">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-4"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-500">{testimonial.location}</p>
                      <div className="flex text-yellow-400">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <h5 className="font-semibold text-gray-900 mb-2">{testimonial.title}</h5>
                  <p className="text-gray-600 italic">"{testimonial.content}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Booking Section */}
        <section id="booking" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Book Your Stay</h2>
                <p className="text-blue-100 mt-2">Select your dates and preferences to reserve your perfect room</p>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700 mb-2">Check-in Date *</label>
                    <input
                      type="date"
                      id="checkIn"
                      name="checkIn"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.checkIn}
                      onChange={handleInputChange}
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
                      min={formData.checkIn || new Date().toISOString().split('T')[0]}
                      value={formData.checkOut}
                      onChange={handleInputChange}
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
                
                <div>
                  <label htmlFor="roomType" className="block text-sm font-medium text-gray-700 mb-2">Room Type *</label>
                  <select
                    id="roomType"
                    name="roomType"
                    required
                    value={formData.roomType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a room type</option>
                    <option value="deluxe-pod">Deluxe Pod Suite - $299/night</option>
                    <option value="premium-pod">Premium Pod Room - $199/night</option>
                    <option value="family-pod">Family Pod Suite - $399/night</option>
                    <option value="business-pod">Business Pod Suite - $249/night</option>
                    <option value="ocean-view-pod">Ocean View Pod - $349/night</option>
                    <option value="studio-pod">Studio Pod Suite - $499/night</option>
                  </select>
                </div>
                
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
                  <div className={`p-4 rounded-lg ${submitMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {submitMessage}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Booking...' : 'Book Now'}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        {contactContent && (
          <section className="py-20 bg-gray-900 text-white">
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
                        <p className="text-gray-300">123 Hotel Street, City, State 12345</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-white text-xl">📞</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Phone</h4>
                        <p className="text-gray-300">+1 (555) 123-4567</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-white text-xl">✉️</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Email</h4>
                        <p className="text-gray-300">info@podnbeyond.com</p>
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
