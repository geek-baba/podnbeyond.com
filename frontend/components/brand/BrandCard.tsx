import React from 'react';
import Link from 'next/link';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

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

interface BrandCardProps {
  brand: Brand;
  showDetails?: boolean;
}

const BrandCard: React.FC<BrandCardProps> = ({ brand, showDetails = false }) => {
  // Determine brand color variant for components
  const brandVariant = brand.slug as 'capsule' | 'smart' | 'sanctuary' | 'sauna';
  
  return (
    <Link href={`/brands/${brand.slug}`}>
      <Card
        variant="default"
        padding="none"
        hover={true}
        className="h-full group"
      >
        {/* Brand Color Bar */}
        <div
          className="h-2"
          style={{ backgroundColor: brand.primaryColor || '#1e3a8a' }}
        />

        {/* Card Content */}
        <div className="p-8">
          {/* Logo */}
          {brand.logoUrl && (
            <img
              src={brand.logoUrl}
              alt={brand.name}
              className="h-12 mb-6"
            />
          )}

          {/* Brand Name */}
          <h3 className="text-2xl font-bold text-neutral-900 mb-2 group-hover:text-neutral-700 transition-colors">
            {brand.name}
          </h3>

          {/* Tagline */}
          {brand.tagline && (
            <p className="text-sm text-neutral-600 mb-4 uppercase tracking-wide">
              {brand.tagline}
            </p>
          )}

          {/* Description */}
          {showDetails && brand.description && (
            <p className="text-neutral-700 mb-6 leading-relaxed">
              {brand.description}
            </p>
          )}

          {/* Status & Properties Count */}
          <div className="flex items-center justify-between mt-6">
            {brand.status === 'COMING_SOON' ? (
              <Badge variant="warning" size="sm">
                Coming Soon
              </Badge>
            ) : (
              <Badge variant={brandVariant} size="sm">
                {brand._count?.properties || 0} {brand._count?.properties === 1 ? 'Location' : 'Locations'}
              </Badge>
            )}

            {/* View Details Arrow */}
            <svg
              className="w-5 h-5 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all"
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
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default BrandCard;

