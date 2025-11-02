import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface SearchWidgetProps {
  variant?: 'inline' | 'hero';
}

const SearchWidget: React.FC<SearchWidgetProps> = ({ variant = 'inline' }) => {
  const router = useRouter();
  const [brands, setBrands] = useState<any[]>([]);
  
  // Form state
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('1');
  const [selectedBrand, setSelectedBrand] = useState('all');

  // Fetch brands for dropdown
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/brands?status=ACTIVE`);
        const data = await response.json();
        if (data.success) {
          setBrands(data.brands);
        }
      } catch (error) {
        console.error('Failed to fetch brands:', error);
      }
    };
    fetchBrands();
  }, []);

  // Set min dates
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build query params
    const params = new URLSearchParams();
    if (checkIn) params.append('checkIn', checkIn);
    if (checkOut) params.append('checkOut', checkOut);
    if (guests) params.append('guests', guests);
    if (selectedBrand !== 'all') params.append('brand', selectedBrand);

    // Navigate to search results
    router.push(`/search?${params.toString()}`);
  };

  const containerClass = variant === 'hero'
    ? 'bg-white/10 backdrop-blur-sm border border-white/20'
    : 'bg-white shadow-card';

  return (
    <div className={`rounded-card p-6 ${containerClass}`}>
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Check-in */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${variant === 'hero' ? 'text-white' : 'text-neutral-700'}`}>
              Check-in
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              min={today}
              required
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          {/* Check-out */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${variant === 'hero' ? 'text-white' : 'text-neutral-700'}`}>
              Check-out
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn || tomorrow}
              required
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          {/* Guests */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${variant === 'hero' ? 'text-white' : 'text-neutral-700'}`}>
              Guests
            </label>
            <select
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="1">1 Guest</option>
              <option value="2">2 Guests</option>
              <option value="3">3 Guests</option>
              <option value="4">4+ Guests</option>
            </select>
          </div>

          {/* Brand */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${variant === 'hero' ? 'text-white' : 'text-neutral-700'}`}>
              Brand
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="all">All Brands</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.slug}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Button */}
        <div className="text-center">
          <Button type="submit" variant="primary" size="lg" fullWidth={variant === 'hero'}>
            Search Available Pods
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SearchWidget;

