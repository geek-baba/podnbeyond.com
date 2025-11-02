import { useEffect, useState } from 'react';
import Head from 'next/head';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import Container from '../../components/layout/Container';
import PropertyCard from '../../components/brand/PropertyCard';
import Button from '../../components/ui/Button';

interface LocationsPageProps {
  properties?: any[];
  error?: string;
}

export default function LocationsPage({ properties, error }: LocationsPageProps) {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  if (error || !properties) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Error Loading Locations</h1>
            <a href="/">
              <Button variant="primary">Back to Homepage</Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Filter by city
  const filteredProperties = filter === 'all'
    ? properties
    : properties.filter(p => p.location === filter);

  // Sort properties
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  // Get unique locations for filter
  const locations = Array.from(new Set(properties.map(p => p.location)));

  return (
    <div>
      <Head>
        <title>All Locations | POD N BEYOND</title>
        <meta name="description" content="Explore all POD N BEYOND locations across Jamshedpur" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo-podnbeyond.png" />
      </Head>

      <Header />

      {/* Hero */}
      <section className="pt-24 pb-12 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto py-12">
            <p className="text-sm uppercase tracking-wider text-white/80 mb-4 font-semibold">
              POD N BEYOND GROUP
            </p>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Our Locations</h1>
            <p className="text-xl text-white/90 leading-relaxed">
              Find the perfect pod across our {properties.length} properties in Jamshedpur
            </p>
          </div>
        </Container>
      </section>

      {/* Filters */}
      <section className="py-6 bg-neutral-50 border-b border-neutral-200">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Location Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-700">Area:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                <option value="all">All Areas</option>
                {locations.map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                <option value="rating">Highest Rated</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="text-sm text-neutral-600">
              {sortedProperties.length} {sortedProperties.length === 1 ? 'property' : 'properties'}
            </div>
          </div>
        </Container>
      </section>

      {/* Properties Grid */}
      <section className="py-12 bg-white">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-20 bg-neutral-50">
        <Container size="md">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Can't Find What You're Looking For?
            </h2>
            <p className="text-lg text-neutral-700 mb-8">
              Contact us to find the perfect pod for your needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/book">
                <Button variant="primary" size="lg">Book Now</Button>
              </a>
              <a href="tel:+919031000931">
                <Button variant="secondary" size="lg">Call Us</Button>
              </a>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}

// Server-side data fetching
export async function getServerSideProps() {
  try {
    const res = await fetch('http://localhost:4000/api/properties');
    const data = await res.json();

    if (data.success) {
      return {
        props: {
          properties: data.properties || [],
          error: null
        }
      };
    }

    return {
      props: {
        properties: [],
        error: 'Failed to load properties'
      }
    };
  } catch (error: any) {
    return {
      props: {
        properties: [],
        error: error?.message || 'Failed to load properties'
      }
    };
  }
}

