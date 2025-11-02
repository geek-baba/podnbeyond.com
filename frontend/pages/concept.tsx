import React from 'react';
import Head from 'next/head';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Hero from '../components/sections/Hero';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function ConceptPage() {
  return (
    <>
      <Head>
        <title>Our Concept | POD N BEYOND</title>
        <meta
          name="description"
          content="Discover the philosophy behind POD N BEYOND. India's first multi-brand pod hotel group inspired by Japanese innovation and global wellness trends."
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo-podnbeyond.png" />
      </Head>

      <Header transparent={true} />

      {/* Hero */}
      <Hero
        title="Our Concept"
        subtitle="Sleep. Simplified. Elevated."
        description="Redefining affordable luxury through innovation, community, and wellness"
        backgroundImage="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1920&h=1080&fit=crop&auto=format&q=80"
        height="large"
        overlay
      />

      {/* Vision Statement */}
      <section className="py-20 bg-white">
        <Container size="md">
          <div className="text-center mb-16 animate-fade-in">
            <p className="text-sm uppercase tracking-wider text-neutral-600 mb-4 font-semibold">
              Our Vision
            </p>
            <h2 className="text-display text-neutral-900 mb-8">
              India's Pod Hotel Revolution
            </h2>
            <p className="text-xl text-neutral-700 leading-relaxed mb-6">
              POD N BEYOND is India's first multi-brand pod hotel group, bringing the Japanese
              capsule hotel concept to the modern Indian traveler. We believe everyone deserves
              a clean, comfortable, and affordable place to stay—without compromising on quality or experience.
            </p>
            <p className="text-lg text-neutral-600 leading-relaxed">
              Launched in Jamshedpur, we're expanding across India with four unique brands, each
              designed for different travel needs and budgets.
            </p>
          </div>
        </Container>
      </section>

      {/* Inspiration */}
      <section className="py-20 bg-neutral-50">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in">
              <p className="text-sm uppercase tracking-wider text-neutral-600 mb-4 font-semibold">
                Inspired by the Best
              </p>
              <h2 className="text-display text-neutral-900 mb-6">
                Global Innovation, Local Heart
              </h2>
              <div className="space-y-6 text-lg text-neutral-700 leading-relaxed">
                <p>
                  We draw inspiration from Japanese capsule hotels like <strong>9h nine hours</strong>,
                  known for their minimalist design and focus on quality sleep. We've adapted this
                  concept for Indian travelers, adding our own innovations and hospitality warmth.
                </p>
                <p>
                  From Scandinavian wellness culture to modern co-living spaces, we've studied
                  the world's best hospitality trends to create something uniquely Indian.
                </p>
                <p>
                  The result? A hotel experience that's efficient, affordable, and surprisingly
                  delightful—perfect for India's new generation of travelers.
                </p>
              </div>
            </div>

            <div className="relative h-96 lg:h-full min-h-[500px] rounded-card overflow-hidden shadow-hero animate-slide-up">
              <img
                src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=1000&fit=crop&auto=format&q=80"
                alt="POD N BEYOND Concept"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-wider text-neutral-600 mb-4 font-semibold">
              Our Values
            </p>
            <h2 className="text-display text-neutral-900 mb-6">
              What Drives Us
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                ),
                title: 'Efficiency',
                description: 'Smart use of space and resources without compromising comfort'
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                ),
                title: 'Quality',
                description: 'High standards in cleanliness, comfort, and service'
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                ),
                title: 'Community',
                description: 'Creating connections between travelers and locals'
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                ),
                title: 'Innovation',
                description: 'Constantly evolving with new concepts and technologies'
              }
            ].map((value, index) => (
              <Card key={index} variant="default" padding="lg" className="text-center animate-slide-up">
                <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {value.icon}
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">{value.title}</h3>
                <p className="text-neutral-600">{value.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Multi-Brand Strategy */}
      <section className="py-20 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
        <Container>
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-wider text-white/80 mb-4 font-semibold">
              Our Strategy
            </p>
            <h2 className="text-display mb-8">
              Four Brands, Infinite Possibilities
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Why one brand when different travelers have different needs? We created four unique
              hospitality experiences under one group.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                name: 'POD N BEYOND | Capsule',
                color: '#3b82f6',
                description: 'For budget-conscious backpackers and solo travelers seeking clean, affordable accommodation'
              },
              {
                name: 'POD N BEYOND | Smart',
                color: '#f59e0b',
                description: 'For business professionals and quality-focused travelers who want premium amenities'
              },
              {
                name: 'POD N BEYOND | Sanctuary',
                color: '#ec4899',
                description: 'For women travelers seeking a safe, comfortable, and empowering space'
              },
              {
                name: 'POD N BEYOND | Sauna+Sleep',
                color: '#10b981',
                description: 'For wellness enthusiasts combining relaxation therapies with quality sleep'
              }
            ].map((brand, index) => (
              <div
                key={index}
                className="p-8 bg-white/10 backdrop-blur-sm rounded-card border-l-4 hover:bg-white/20 transition-colors"
                style={{ borderColor: brand.color }}
              >
                <h3 className="text-xl font-bold mb-3">{brand.name}</h3>
                <p className="text-white/90">{brand.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* The Future */}
      <section className="py-20 bg-white">
        <Container size="md">
          <div className="text-center">
            <p className="text-sm uppercase tracking-wider text-neutral-600 mb-4 font-semibold">
              What's Next
            </p>
            <h2 className="text-display text-neutral-900 mb-6">
              Expanding Across India
            </h2>
            <p className="text-xl text-neutral-700 leading-relaxed mb-8 max-w-3xl mx-auto">
              After establishing ourselves in Jamshedpur, we're planning expansion to major cities
              across India. Our goal: make quality pod accommodation accessible in every tier-1 and tier-2 city.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="p-6">
                <div className="text-4xl font-bold text-capsule-500 mb-2">10+</div>
                <p className="text-neutral-600">Cities by 2026</p>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-smart-500 mb-2">50+</div>
                <p className="text-neutral-600">Properties Planned</p>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-sanctuary-500 mb-2">4</div>
                <p className="text-neutral-600">Unique Brands</p>
              </div>
            </div>

            <a href="/brands">
              <Button variant="primary" size="xl">
                Explore Our Brands
              </Button>
            </a>
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}

