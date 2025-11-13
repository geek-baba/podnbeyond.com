import Head from 'next/head';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import Container from '../../components/layout/Container';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface LocationDetailPageProps {
  property?: any;
  error?: string;
}

export default function LocationDetailPage({ property, error }: LocationDetailPageProps) {
  if (error || !property) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Location Not Found</h1>
            <a href="/brands">
              <Button variant="primary">View All Brands</Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Use placeholder for missing or /uploads/ images
  const getMainImage = () => {
    if (!property.images || property.images.length === 0) {
      return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&h=600&fit=crop&auto=format&q=80';
    }
    const img = property.images[0];
    if (img.startsWith('/uploads/')) {
      return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&h=600&fit=crop&auto=format&q=80';
    }
    return img;
  };

  const mainImage = getMainImage();

  return (
    <div>
      <Head>
        <title>{property.name} | POD N BEYOND</title>
        <meta name="description" content={property.description || ''} />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo-podnbeyond.png" />
      </Head>

      <Header />

      {/* Header */}
      <section className="pt-24 pb-8 bg-white">
        <Container>
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center space-x-2 text-sm text-neutral-600">
            <a href="/" className="hover:text-neutral-900">Home</a>
            <span>/</span>
            <a href="/brands" className="hover:text-neutral-900">Brands</a>
            {property.brand && (
              <>
                <span>/</span>
                <a href={`/brands/${property.brand.slug}`} className="hover:text-neutral-900">
                  {property.brand.name}
                </a>
              </>
            )}
            <span>/</span>
            <span className="text-neutral-900">{property.name}</span>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-neutral-900 mb-4">{property.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-neutral-600">
              <div className="flex items-center">
                <span className="mr-2">📍</span>
                {property.location}, {property.city}, {property.state}
              </div>
              {property.rating && property.rating > 0 && (
                <div className="flex items-center">
                  <span className="mr-1">⭐</span>
                  <span className="font-semibold">{property.rating.toFixed(1)}</span>
                  {property.totalRatings && (
                    <span className="ml-1">({property.totalRatings} reviews)</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Main Image */}
      <section className="pb-8 bg-white">
        <Container>
          <div className="relative aspect-[21/9] rounded-lg overflow-hidden shadow-lg">
            <img src={mainImage} alt={property.name} className="w-full h-full object-cover" />
          </div>
        </Container>
      </section>

      {/* Property Details */}
      <section className="py-12 bg-neutral-50">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              {property.description && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">About This Property</h2>
                  <p className="text-lg text-neutral-700 leading-relaxed">{property.description}</p>
                </div>
              )}

              {/* Features */}
              {property.features && property.features.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {property.features.map((feature: string, idx: number) => (
                      <div key={idx} className="flex items-start">
                        <span className="mr-2 text-green-600">✓</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Amenities</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {property.amenities.map((amenity: string, idx: number) => (
                      <div key={idx} className="flex items-center">
                        <span className="mr-2">✓</span>
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <Card variant="bordered" padding="lg" className="sticky top-24">
                <h3 className="text-xl font-bold mb-4">Contact</h3>
                
                <div className="space-y-4 text-sm">
                  {property.address && (
                    <div>
                      <p className="font-semibold text-neutral-600 mb-1">Address</p>
                      <p className="text-neutral-900">{property.address}</p>
                      <p>{property.location}, {property.city}</p>
                    </div>
                  )}

                  {property.phone && (
                    <div>
                      <p className="font-semibold text-neutral-600 mb-1">Phone</p>
                      <a href={`tel:${property.phone}`} className="text-neutral-900 hover:underline">
                        {property.phone}
                      </a>
                    </div>
                  )}

                  {property.email && (
                    <div>
                      <p className="font-semibold text-neutral-600 mb-1">Email</p>
                      <a href={`mailto:${property.email}`} className="text-neutral-900 hover:underline">
                        {property.email}
                      </a>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <a href={`/book?property=${property.slug}`}>
                      <Button variant="primary" fullWidth>Book This Location</Button>
                    </a>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* Available Rooms */}
      {property.rooms && property.rooms.length > 0 && (
        <section className="py-12 bg-white">
          <Container>
            <h2 className="text-3xl font-bold text-neutral-900 mb-8">Available Pods</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {property.rooms.map((room: any) => (
                <Card key={room.id} variant="default" padding="lg">
                  <h3 className="text-xl font-bold mb-2">{room.name}</h3>
                  <p className="text-sm text-neutral-600 mb-4">{room.type}</p>
                  
                  <div className="flex items-center text-neutral-600 mb-4">
                    <span className="mr-2">👥</span>
                    {room.capacity} {room.capacity === 1 ? 'Guest' : 'Guests'}
                  </div>

                  <div className="pt-4 border-t flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-neutral-900">₹{room.pricePerNight.toLocaleString()}</p>
                      <p className="text-sm text-neutral-600">per night</p>
                    </div>
                    <a href={`/book?property=${property.slug}&room=${room.id}`}>
                      <Button variant="primary" size="sm">Book</Button>
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Back */}
      <section className="py-8 bg-neutral-50 text-center border-t">
        <a href="/brands" className="text-neutral-700 hover:text-neutral-900">
          ← Back to All Brands
        </a>
      </section>

      <Footer />
    </div>
  );
}

// Server-side data fetching
export async function getServerSideProps(context: any) {
  const { slug } = context.params;

  try {
    const res = await fetch(`http://localhost:4000/api/properties/${slug}`);
    const data = await res.json();

    if (data.success && data.property) {
      return {
        props: {
          property: data.property,
          error: null
        }
      };
    }

    return {
      props: {
        property: null,
        error: 'Property not found'
      }
    };
  } catch (error: any) {
    return {
      props: {
        property: null,
        error: error?.message || 'Failed to load property'
      }
    };
  }
}

