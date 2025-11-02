import React from 'react';
import Head from 'next/head';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Hero from '../components/sections/Hero';
import BrandGrid from '../components/sections/BrandGrid';
import SearchWidget from '../components/sections/SearchWidget';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';

export default function HomePage() {
  return (
    <>
      <Head>
        <title>POD N BEYOND | India's First Multi-Brand Pod Hotel Group</title>
        <meta
          name="description"
          content="Experience India's first pod hotel revolution. Multiple brands, one vision - redefining affordable luxury in Jamshedpur and beyond."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo-podnbeyond.png" />
      </Head>

      {/* Transparent Header over Hero */}
      <Header transparent={true} />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1920&h=1080&fit=crop&auto=format&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/60 to-neutral-950/40" />

        {/* Content */}
        <Container className="relative z-10">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            {/* Subtitle */}
            <p className="text-sm uppercase tracking-wider text-white/90 mb-4 font-semibold">
              India's First Multi-Brand Pod Hotel Group
            </p>

            {/* Title */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              POD N BEYOND
            </h1>

            {/* Description */}
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Experience the future of hospitality. From budget capsules to premium smart hotels, wellness sanctuaries to sauna retreats.
            </p>

            {/* CTAs - WHITE BUTTONS FOR VISIBILITY */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="#search">
                <button className="px-10 py-5 text-xl bg-white text-neutral-900 font-semibold rounded-button hover:bg-neutral-100 transition-all shadow-lg">
                  Book Your Stay
                </button>
              </a>
              <a href="#brands">
                <button className="px-10 py-5 text-xl bg-white/10 backdrop-blur-sm border-2 border-white text-white font-semibold rounded-button hover:bg-white hover:text-neutral-900 transition-all">
                  Explore Brands
                </button>
              </a>
            </div>
          </div>
        </Container>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center p-2">
            <div className="w-1 h-3 bg-white/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section id="search" className="py-20 bg-white">
        <Container>
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-display text-neutral-900 mb-4">
              Find Your Perfect Pod
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Search across all our brands and locations in Jamshedpur
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto animate-slide-up">
            <SearchWidget variant="inline" />
          </div>
        </Container>
      </section>

      {/* Brand Grid Section */}
      <section id="brands">
        <BrandGrid
          title="Our Brands"
          subtitle="Four unique hospitality experiences, one vision"
          showComingSoon
        />
      </section>

      {/* Philosophy Section */}
      <section className="py-30 bg-gradient-to-b from-white to-neutral-50">
        <Container size="md">
          <div className="text-center animate-fade-in">
            <p className="text-sm uppercase tracking-wider text-neutral-600 mb-4 font-semibold">
              Our Philosophy
            </p>
            <h2 className="text-display text-neutral-900 mb-8">
              Sleep. Simplified. Elevated.
            </h2>
            <p className="text-xl text-neutral-700 leading-relaxed mb-12 max-w-3xl mx-auto">
              Inspired by Japanese capsule hotels and global wellness trends, POD N BEYOND
              reimagines affordable luxury. We believe everyone deserves a clean, comfortable,
              and memorable stay—whether you're a backpacker, business traveler, or seeking wellness.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="p-6 animate-slide-up">
                <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">24/7 Flexibility</h3>
                <p className="text-neutral-600">
                  Check-in anytime, short stays available. Your schedule, your way.
                </p>
              </div>

              <div className="p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
                <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">Trusted Quality</h3>
                <p className="text-neutral-600">
                  Every pod is cleaned, sanitized, and maintained to the highest standards.
                </p>
              </div>

              <div className="p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
                <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">Smart Innovation</h3>
                <p className="text-neutral-600">
                  Modern amenities, smart controls, and tech-enabled experiences.
                </p>
              </div>
            </div>

            <div className="mt-12">
              <a href="/concept">
                <Button variant="secondary" size="lg">
                  Learn More About Our Vision
                </Button>
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-neutral-50">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image */}
            <div className="relative h-96 lg:h-full min-h-[500px] rounded-card overflow-hidden shadow-hero animate-slide-up">
              <img
                src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=1000&fit=crop&auto=format&q=80"
                alt="POD N BEYOND Interior"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="animate-fade-in">
              <p className="text-sm uppercase tracking-wider text-neutral-600 mb-4 font-semibold">
                Why POD N BEYOND
              </p>
              <h2 className="text-display text-neutral-900 mb-6">
                India's Pod Hotel Pioneer
              </h2>
              <p className="text-lg text-neutral-700 leading-relaxed mb-6">
                Since launching India's first pod hotel, we've been at the forefront
                of hospitality innovation. Our multi-brand approach ensures there's
                a perfect option for every traveler and every budget.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-capsule-500 flex items-center justify-center mr-3 mt-1">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900">Multiple Brands, One Vision</h4>
                    <p className="text-neutral-600">From budget-friendly capsules to premium smart hotels</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-smart-500 flex items-center justify-center mr-3 mt-1">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900">3 Locations in Jamshedpur</h4>
                    <p className="text-neutral-600">Strategically located across the Steel City</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-sanctuary-500 flex items-center justify-center mr-3 mt-1">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900">Expanding Nationwide</h4>
                    <p className="text-neutral-600">New cities and concepts launching soon</p>
                  </div>
                </div>
              </div>

              <a href="/locations">
                <Button variant="primary" size="lg">
                  View All Locations
                </Button>
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* Membership CTA */}
      <section className="py-20 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-display mb-6 animate-fade-in">
              Join POD N BEYOND Circle
            </h2>
            <p className="text-xl text-neutral-300 mb-10 leading-relaxed">
              Get exclusive member rates, priority booking, and special perks across all our brands.
              Your loyalty rewards start from day one.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/membership">
                <button className="px-10 py-5 text-xl bg-white text-neutral-900 font-semibold rounded-button hover:bg-neutral-100 transition-all shadow-lg">
                  Learn About Membership
                </button>
              </a>
              <a href="/book">
                <button className="px-10 py-5 text-xl bg-white/10 backdrop-blur-sm border-2 border-white text-white font-semibold rounded-button hover:bg-white hover:text-neutral-900 transition-all">
                  Book First Stay
                </button>
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <Footer />
    </>
  );
}

