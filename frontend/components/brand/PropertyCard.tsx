import React from 'react';
import Link from 'next/link';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

interface Property {
  id: number;
  name: string;
  slug: string;
  location: string;
  city: string;
  address?: string;
  description?: string;
  rating?: number;
  totalRatings?: number;
  images?: string[];
  _count?: {
    rooms: number;
  };
}

interface PropertyCardProps {
  property: Property;
  brandSlug?: string;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, brandSlug }) => {
  // Use Unsplash placeholder for missing images
  const getPropertyImage = () => {
    if (!property.images || property.images.length === 0) {
      return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&auto=format&q=80';
    }
    const img = property.images[0];
    if (img.startsWith('/uploads/')) {
      return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&auto=format&q=80';
    }
    return img;
  };
  
  const mainImage = getPropertyImage();
  
  return (
    <Link href={`/locations/${property.slug}`}>
      <Card
        variant="default"
        padding="none"
        hover={true}
        className="h-full group overflow-hidden"
      >
        {/* Property Image */}
        <div className="aspect-[4/3] relative overflow-hidden bg-neutral-100">
          <img
            src={mainImage}
            alt={property.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Rating Badge */}
          {property.rating && property.rating > 0 && (
            <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 shadow-card flex items-center space-x-1">
              <svg className="w-4 h-4 text-smart-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-semibold text-neutral-900">
                {property.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Property Info */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold text-neutral-900 group-hover:text-neutral-700 transition-colors">
              {property.name}
            </h3>
          </div>

          {/* Location */}
          <p className="text-neutral-600 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {property.location}, {property.city}
          </p>

          {/* Description */}
          {property.description && (
            <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
              {property.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
            <div className="text-sm text-neutral-600">
              {property._count?.rooms || 0} pods available
            </div>
            
            {property.totalRatings && property.totalRatings > 0 && (
              <div className="text-sm text-neutral-600">
                {property.totalRatings} reviews
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default PropertyCard;

