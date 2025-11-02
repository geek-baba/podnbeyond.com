import React, { useEffect, useState } from 'react';
import Container from '../layout/Container';
import BrandCard from '../brand/BrandCard';

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

interface BrandGridProps {
  title?: string;
  subtitle?: string;
  showComingSoon?: boolean;
}

const BrandGrid: React.FC<BrandGridProps> = ({
  title = 'Our Brands',
  subtitle = 'Discover our collection of unique hospitality experiences',
  showComingSoon = true,
}) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/brands`);
        const data = await response.json();
        
        if (data.success) {
          // Filter based on showComingSoon
          const filteredBrands = showComingSoon
            ? data.brands
            : data.brands.filter((b: Brand) => b.status === 'ACTIVE');
          
          setBrands(filteredBrands);
        }
      } catch (error) {
        console.error('Failed to fetch brands:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, [showComingSoon]);

  if (loading) {
    return (
      <section className="py-20 bg-neutral-50">
        <Container>
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-neutral-200 rounded w-1/4 mx-auto" />
              <div className="h-4 bg-neutral-200 rounded w-1/3 mx-auto" />
            </div>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-20 bg-neutral-50">
      <Container>
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-display text-neutral-900 mb-4">{title}</h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Brand Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
          {brands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>

        {/* View All Link */}
        {brands.length > 4 && (
          <div className="text-center mt-12">
            <a
              href="/brands"
              className="inline-flex items-center text-neutral-900 hover:text-neutral-700 font-semibold transition-colors group"
            >
              View All Brands
              <svg
                className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>
        )}
      </Container>
    </section>
  );
};

export default BrandGrid;

