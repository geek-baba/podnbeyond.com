import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';

interface Property {
  id: number;
  name: string;
  slug: string;
  location: string;
  address: string;
  city: string;
  rating: number;
  totalRatings: number;
  description: string;
  amenities: string[];
  features: string[];
  images: string[];
  _count: {
    rooms: number;
  };
}

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/properties`);
        if (response.data.success) {
          setProperties(response.data.properties);
        }
      } catch (err) {
        setError('Failed to load properties');
        console.error('Error fetching properties:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>POD N BEYOND Properties - Choose Your Location</title>
        <meta name="description" content="Explore POD N BEYOND properties across Jamshedpur. Find the perfect location for your stay." />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo-podnbeyond.png" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src="/logo-podnbeyond.png" alt="POD N BEYOND" className="h-12 w-auto" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">POD N BEYOND</h1>
                  <p className="text-sm text-gray-600">Choose Your Property</p>
                </div>
              </div>
              <a
                href="/"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Home
              </a>
            </div>
          </div>
        </header>

        {/* Properties Grid */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Properties in Jamshedpur</h2>
            <p className="text-gray-600">India's first pod hotel chain - {properties.length} locations to serve you</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => (
              <div
                key={property.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 cursor-pointer"
                onClick={() => router.push(`/property/${property.slug}`)}
              >
                {/* Property Image */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${property.images[0] || '/uploads/podnbeyond-gallery-1.jpg'}`}
                    alt={property.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-lg">
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-semibold text-gray-900">{property.rating}</span>
                      <span className="text-gray-500 text-sm">/5</span>
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {property._count.rooms} Rooms
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-6">
                  <div className="mb-2">
                    <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Hotel</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{property.name}</h3>
                  
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <span className="mr-1">📍</span>
                    <span>{property.location}, {property.city}</span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {property.description}
                  </p>

                  {/* Amenities Pills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {property.amenities.slice(0, 3).map((amenity, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        ✓ {amenity}
                      </span>
                    ))}
                    {property.amenities.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{property.amenities.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      ({property.totalRatings} ratings)
                    </div>
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm">
                      View Rooms →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}

