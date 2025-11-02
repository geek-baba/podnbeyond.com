import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import PropertyCard from '../components/brand/PropertyCard';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

interface Property {
  id: number;
  name: string;
  slug: string;
  location: string;
  city: string;
  description?: string;
  rating?: number;
  totalRatings?: number;
  images?: string[];
  brandId?: number;
  brand?: {
    name: string;
    slug: string;
    primaryColor?: string;
  };
  _count?: {
    rooms: number;
  };
}

export default function SearchPage() {
  const router = useRouter();
  const { checkIn, checkOut, guests, brand } = router.query;

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string>(brand as string || 'all');
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'name'>('rating');

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/properties`);
        const data = await response.json();
        
        if (data.success) {
          setProperties(data.properties);
        }
      } catch (error) {
        console.error('Failed to fetch properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Filter properties
  const filteredProperties = properties.filter(property => {
    if (selectedBrand !== 'all' && property.brand?.slug !== selectedBrand) {
      return false;
    }
    return true;
  });

  // Sort properties
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  return (
    <>
      <Head>
        <title>Search Results | POD N BEYOND</title>
        <meta name="description" content="Find your perfect pod across all POD N BEYOND properties" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo-podnbeyond.png" />
      </Head>

      <Header />

      {/* Search Header */}
      <section className="pt-24 pb-8 bg-neutral-50 border-b border-neutral-200">
        <Container>
          <h1 className="text-display text-neutral-900 mb-4">Search Results</h1>
          
          {/* Search Summary */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {checkIn && checkOut && (
              <Badge variant="neutral" size="md">
                📅 {new Date(checkIn as string).toLocaleDateString()} - {new Date(checkOut as string).toLocaleDateString()}
              </Badge>
            )}
            {guests && (
              <Badge variant="neutral" size="md">
                👥 {guests} {parseInt(guests as string) === 1 ? 'Guest' : 'Guests'}
              </Badge>
            )}
            {brand && brand !== 'all' && (
              <Badge variant="capsule" size="md">
                Brand: {brand}
              </Badge>
            )}
          </div>

          {/* Results Count */}
          <p className="text-neutral-600">
            Found <strong>{sortedProperties.length}</strong> {sortedProperties.length === 1 ? 'property' : 'properties'}
          </p>
        </Container>
      </section>

      {/* Filters & Sort */}
      <section className="py-6 bg-white border-b border-neutral-200 sticky top-0 z-30">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Brand Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-700">Brand:</span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                <option value="all">All Brands</option>
                <option value="capsule">POD N BEYOND | Capsule</option>
                <option value="smart">POD N BEYOND | Smart</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'rating' | 'price' | 'name')}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                <option value="rating">Highest Rated</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </Container>
      </section>

      {/* Results Grid */}
      <section className="py-12 bg-neutral-50">
        <Container>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-neutral-200 h-96 rounded-card" />
                </div>
              ))}
            </div>
          ) : sortedProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-slide-up">
              {sortedProperties.map((property) => (
                <PropertyCard key={property.id} property={property} brandSlug={property.brand?.slug} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="mb-8">
                <svg className="w-24 h-24 mx-auto text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">No Properties Found</h2>
              <p className="text-neutral-600 mb-8">
                Try adjusting your filters or search criteria
              </p>
              <a href="/">
                <Button variant="primary" size="lg">
                  Back to Homepage
                </Button>
              </a>
            </div>
          )}
        </Container>
      </section>

      {/* Modify Search */}
      <section className="py-12 bg-white">
        <Container size="md">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              Want to modify your search?
            </h2>
            <p className="text-neutral-600 mb-6">
              Go back to the homepage to search with different dates or preferences
            </p>
            <a href="/">
              <Button variant="secondary" size="lg">
                New Search
              </Button>
            </a>
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}

