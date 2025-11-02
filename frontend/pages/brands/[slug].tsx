import Head from 'next/head';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import Container from '../../components/layout/Container';
import PropertyCard from '../../components/brand/PropertyCard';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export default function BrandDetailPage({ brand, error }) {
  if (error || !brand) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Brand Not Found</h1>
            <a href="/brands">
              <Button variant="primary">View All Brands</Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Use placeholder image if brand image doesn't exist or starts with /uploads/
  const getBrandHeroImage = () => {
    if (!brand.images || brand.images.length === 0) {
      return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&h=1080&fit=crop&auto=format&q=80';
    }
    const img = brand.images[0];
    if (img.startsWith('/uploads/')) {
      // Use Unsplash placeholder for missing uploads
      return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&h=1080&fit=crop&auto=format&q=80';
    }
    return img;
  };

  const heroBackground = getBrandHeroImage();

  return (
    <div>
      <Head>
        <title>{brand.name} | POD N BEYOND</title>
        <meta name="description" content={brand.description || brand.tagline || ''} />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo-podnbeyond.png" />
      </Head>

      <Header />

      {/* Hero */}
      <section 
        className="pt-24 pb-12 relative text-white"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/80 to-neutral-950/60"></div>
        <Container className="relative z-10">
          <div className="text-center max-w-4xl mx-auto py-12">
            {brand.logoUrl && (
              <img src={brand.logoUrl} alt={brand.name} className="h-16 mx-auto mb-6 brightness-0 invert" />
            )}

            {brand.status === 'COMING_SOON' && (
              <div className="mb-4 inline-block">
                <Badge variant="warning">Coming Soon</Badge>
              </div>
            )}

            <h1 className="text-5xl font-bold mb-4">{brand.name}</h1>

            {brand.tagline && (
              <p className="text-xl text-white/90 mb-6 uppercase tracking-wide">{brand.tagline}</p>
            )}

            {brand.description && (
              <p className="text-lg text-white/80 leading-relaxed max-w-3xl mx-auto">{brand.description}</p>
            )}
          </div>
        </Container>
      </section>

      {/* Concept */}
      {brand.concept && (
        <section className="py-20 bg-white">
          <Container size="md">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">Our Concept</h2>
            </div>
            <p className="text-lg text-neutral-700 leading-relaxed">{brand.concept}</p>
          </Container>
        </section>
      )}

      {/* Features & Amenities */}
      <section className="py-12 bg-neutral-50">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Features */}
            {brand.features && brand.features.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-6">Features</h3>
                <ul className="space-y-3">
                  {brand.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-3 text-green-600 text-xl">✓</span>
                      <span className="text-neutral-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Amenities */}
            {brand.amenities && brand.amenities.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-6">Amenities</h3>
                <ul className="space-y-3">
                  {brand.amenities.map((amenity, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-3 text-neutral-500 text-xl">✓</span>
                      <span className="text-neutral-700">{amenity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Target Audience */}
          {brand.targetAudience && (
            <div className="mt-12 p-6 bg-white rounded-lg border-l-4" style={{ borderColor: brand.primaryColor || '#1e3a8a' }}>
              <h4 className="font-semibold mb-2">Perfect For:</h4>
              <p className="text-neutral-700">{brand.targetAudience}</p>
            </div>
          )}
        </Container>
      </section>

      {/* Properties */}
      {brand.properties && brand.properties.length > 0 && (
        <section className="py-20 bg-white">
          <Container>
            <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">Our Locations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {brand.properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Coming Soon */}
      {brand.status === 'COMING_SOON' && (
        <section className="py-20 bg-neutral-50">
          <Container size="md">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-6">Launching Soon</h2>
              <p className="text-lg text-neutral-700 mb-8">
                We're working to bring {brand.name} to life.
              </p>
              <Button variant="primary">Get Notified</Button>
            </div>
          </Container>
        </section>
      )}

      {/* Back */}
      <section className="py-8 bg-white text-center border-t">
        <a href="/brands" className="text-neutral-700 hover:text-neutral-900">
          ← Back to All Brands
        </a>
      </section>

      <Footer />
    </div>
  );
}

// Server-side data fetching
export async function getServerSideProps(context) {
  const { slug } = context.params;

  try {
    const res = await fetch(`http://localhost:4000/api/brands/${slug}`);
    const data = await res.json();

    if (data.success) {
      return {
        props: {
          brand: data.brand,
          error: null
        }
      };
    }

    return {
      props: {
        brand: null,
        error: 'Brand not found'
      }
    };
  } catch (error) {
    return {
      props: {
        brand: null,
        error: error.message
      }
    };
  }
}

