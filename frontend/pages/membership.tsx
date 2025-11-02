import React, { useState } from 'react';
import Head from 'next/head';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Hero from '../components/sections/Hero';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

export default function MembershipPage() {
  const [selectedTier, setSelectedTier] = useState<'silver' | 'gold' | 'platinum'>('gold');

  const tiers = {
    silver: {
      name: 'Silver',
      price: 'Free',
      color: '#a3a3a3',
      benefits: [
        'Member-only rates',
        'Points on every booking',
        'Early access to promotions',
        'Birthday bonus points',
        'Email support'
      ]
    },
    gold: {
      name: 'Gold',
      price: '₹999/year',
      color: '#f59e0b',
      popular: true,
      benefits: [
        'All Silver benefits',
        '10% discount on all bookings',
        '2x points earning',
        'Free late checkout (subject to availability)',
        'Priority customer support',
        'Exclusive gold-only deals',
        'Room upgrade priority'
      ]
    },
    platinum: {
      name: 'Platinum',
      price: '₹2,499/year',
      color: '#6b7280',
      benefits: [
        'All Gold benefits',
        '15% discount on all bookings',
        '3x points earning',
        'Guaranteed late checkout till 2 PM',
        'Free room upgrades (when available)',
        'Dedicated concierge',
        'Access to all brands',
        'Birthday stay discount',
        'Annual free night voucher'
      ]
    }
  };

  return (
    <>
      <Head>
        <title>POD N BEYOND Circle Membership | POD N BEYOND</title>
        <meta
          name="description"
          content="Join POD N BEYOND Circle and enjoy exclusive member rates, points rewards, and special privileges across all our brands."
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo-podnbeyond.png" />
      </Head>

      <Header transparent={true} />

      {/* Hero */}
      <Hero
        title="POD N BEYOND Circle"
        subtitle="Exclusive Membership Program"
        description="Earn points, enjoy discounts, and unlock special privileges across all our brands"
        backgroundImage="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920&h=1080&fit=crop&auto=format&q=80"
        primaryCTA={{
          text: "Join Now",
          href: "#join"
        }}
        height="large"
        overlay
      />

      {/* How It Works */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-16 animate-fade-in">
            <p className="text-sm uppercase tracking-wider text-neutral-600 mb-4 font-semibold">
              How It Works
            </p>
            <h2 className="text-display text-neutral-900 mb-6">
              Simple. Rewarding. Beneficial.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Sign Up',
                description: 'Choose your tier and create your POD N BEYOND Circle account. Silver is free, upgrade anytime.'
              },
              {
                step: '2',
                title: 'Earn Points',
                description: 'Get points on every booking. 1 point = ₹1 spent. Higher tiers earn faster with multipliers.'
              },
              {
                step: '3',
                title: 'Enjoy Benefits',
                description: 'Redeem points for free stays, get discounts, and access exclusive member perks.'
              }
            ].map((item, index) => (
              <Card key={index} variant="default" padding="lg" className="text-center animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="w-20 h-20 bg-gradient-to-br from-neutral-900 to-neutral-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-3">{item.title}</h3>
                <p className="text-neutral-600 leading-relaxed">{item.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Membership Tiers */}
      <section id="join" className="py-20 bg-neutral-50">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-display text-neutral-900 mb-4">
              Choose Your Tier
            </h2>
            <p className="text-lg text-neutral-600">
              Select the membership level that's right for you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.entries(tiers).map(([key, tier]) => (
              <Card
                key={key}
                variant={tier.popular ? 'elevated' : 'default'}
                padding="lg"
                className={`relative ${tier.popular ? 'ring-2 ring-smart-500 scale-105' : ''}`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge variant="smart" size="md">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div
                    className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: tier.color }}
                  >
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-2">{tier.name}</h3>
                  <p className="text-3xl font-bold" style={{ color: tier.color }}>
                    {tier.price}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" style={{ color: tier.color }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-neutral-700">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={tier.popular ? 'smart' : 'primary'}
                  size="lg"
                  fullWidth
                  onClick={() => setSelectedTier(key as 'silver' | 'gold' | 'platinum')}
                >
                  {key === 'silver' ? 'Join Free' : 'Upgrade Now'}
                </Button>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Points System */}
      <section className="py-20 bg-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in">
              <p className="text-sm uppercase tracking-wider text-neutral-600 mb-4 font-semibold">
                Rewards Program
              </p>
              <h2 className="text-display text-neutral-900 mb-6">
                Every Stay Earns Points
              </h2>
              <div className="space-y-6">
                <div className="p-6 bg-neutral-50 rounded-lg">
                  <h4 className="font-bold text-neutral-900 mb-2">Silver Members</h4>
                  <p className="text-neutral-700">Earn 1 point per ₹1 spent</p>
                </div>
                <div className="p-6 bg-smart-50 rounded-lg border-2 border-smart-200">
                  <h4 className="font-bold text-smart-900 mb-2">Gold Members</h4>
                  <p className="text-smart-800">Earn 2 points per ₹1 spent (2x multiplier)</p>
                </div>
                <div className="p-6 bg-neutral-100 rounded-lg border-2 border-neutral-300">
                  <h4 className="font-bold text-neutral-900 mb-2">Platinum Members</h4>
                  <p className="text-neutral-800">Earn 3 points per ₹1 spent (3x multiplier)</p>
                </div>
              </div>
              <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-neutral-900 mb-2">💰 Redeem Your Points</h4>
                <p className="text-neutral-700">
                  100 points = ₹100 discount on your next booking. Points never expire as long as you stay active!
                </p>
              </div>
            </div>

            <div className="relative h-96 lg:h-full min-h-[500px] rounded-card overflow-hidden shadow-hero animate-slide-up">
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=1000&fit=crop&auto=format&q=80"
                alt="POD N BEYOND Circle Benefits"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-neutral-50">
        <Container size="md">
          <div className="text-center mb-12">
            <h2 className="text-display text-neutral-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'How do I join POD N BEYOND Circle?',
                a: 'Simply book your first stay and create an account. You\'ll automatically be enrolled in Silver tier for free. You can upgrade to Gold or Platinum anytime.'
              },
              {
                q: 'Can I use my membership across all brands?',
                a: 'Yes! Your POD N BEYOND Circle membership works across all our brands - Capsule, Smart, Sanctuary, and Sauna+Sleep.'
              },
              {
                q: 'Do points expire?',
                a: 'Points never expire as long as you have at least one booking every 12 months. Stay active and your points keep growing!'
              },
              {
                q: 'Can I change my tier?',
                a: 'Absolutely! You can upgrade or downgrade your tier anytime from your account dashboard.'
              }
            ].map((faq, index) => (
              <details key={index} className="bg-white rounded-lg shadow-sm p-6 group">
                <summary className="cursor-pointer font-semibold text-lg text-neutral-900 flex items-center justify-between">
                  {faq.q}
                  <svg className="w-5 h-5 text-neutral-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-4 text-neutral-700 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
        <Container size="md">
          <div className="text-center">
            <h2 className="text-display mb-6">
              Ready to Start Earning?
            </h2>
            <p className="text-xl text-neutral-300 mb-10 leading-relaxed">
              Join thousands of travelers who are already enjoying exclusive member benefits
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/book">
                <Button variant="primary" size="xl">
                  Book Your First Stay
                </Button>
              </a>
              <a href="mailto:info@podnbeyond.com?subject=Membership Inquiry">
                <Button variant="secondary" size="xl">
                  Contact Us
                </Button>
              </a>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}

