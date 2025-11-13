import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import Container from '../../components/layout/Container';
import BrandCard from '../../components/brand/BrandCard';
import { apiRequest } from '../../lib/api';

interface Brand {
  id: number;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  primaryColor?: string;
  status: string;
  _count?: {
    properties: number;
  };
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'coming_soon'>('all');

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        const data = await apiRequest<{ success: boolean; brands: Brand[] }>('/api/brands');
        
        if (data.success) {
          setBrands(data.brands);
        }
      } catch (error) {
        console.error('Failed to fetch brands:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  const filteredBrands = brands.filter(brand => {
    if (filter === 'all') return true;
    if (filter === 'active') return brand.status === 'ACTIVE';
    if (filter === 'coming_soon') return brand.status === 'COMING_SOON';
    return true;
  });

  return (
    <>
      <Head>
        <title>Our Brands | POD N BEYOND</title>
        <meta
          name="description"
          content="Explore our collection of unique hospitality brands. From budget capsules to premium smart hotels and wellness retreats."
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo-podnbeyond.png" />
      </Head>

      <Header />

      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto py-20 animate-fade-in">
            <p className="text-sm uppercase tracking-wider text-white/80 mb-4 font-semibold">
              POD N BEYOND GROUP
            </p>
            <h1 className="text-hero mb-6">Our Brands</h1>
            <p className="text-xl text-white/90 leading-relaxed">
              Four unique hospitality experiences, each designed for a different traveler.
              One vision: redefining affordable luxury in India.
            </p>
          </div>
        </Container>
      </section>

      {/* Filter Section */}
      <section className="py-8 bg-neutral-50 border-b border-neutral-200">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                {filteredBrands.length} {filteredBrands.length === 1 ? 'Brand' : 'Brands'}
              </h2>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-button font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                All Brands
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-button font-medium transition-all ${
                  filter === 'active'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('coming_soon')}
                className={`px-4 py-2 rounded-button font-medium transition-all ${
                  filter === 'coming_soon'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                Coming Soon
              </button>
            </div>
          </div>
        </Container>
      </section>

      {/* Brands Grid */}
      <section className="py-20 bg-white">
        <Container>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-neutral-200 h-64 rounded-card" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
              {filteredBrands.map((brand) => (
                <BrandCard key={brand.id} brand={brand} showDetails />
              ))}
            </div>
          )}

          {!loading && filteredBrands.length === 0 && (
            <div className="text-center py-20">
              <p className="text-neutral-600 text-lg">No brands found matching your filter.</p>
            </div>
          )}
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-neutral-50">
        <Container size="md">
          <div className="text-center">
            <h2 className="text-display text-neutral-900 mb-6">
              Can't Decide?
            </h2>
            <p className="text-lg text-neutral-700 mb-8 max-w-2xl mx-auto leading-relaxed">
              Our team can help you choose the perfect brand and location for your stay.
              Each brand offers a unique experience tailored to different needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/book" className="inline-block">
                <button className="px-8 py-4 bg-neutral-900 text-white rounded-button font-semibold hover:bg-neutral-800 transition-colors">
                  Search All Properties
                </button>
              </a>
              <a href="tel:+919031000931" className="inline-block">
                <button className="px-8 py-4 border-2 border-neutral-900 text-neutral-900 rounded-button font-semibold hover:bg-neutral-900 hover:text-white transition-all">
                  Call Us: +91-90310 00931
                </button>
              </a>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}

