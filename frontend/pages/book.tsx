import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import FormField from '../components/ui/FormField';
import Badge from '../components/ui/Badge';

export default function BookingPage() {
  const router = useRouter();
  const { property: propertySlug, room: roomId } = router.query;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Property & Dates
    propertyId: '',
    checkIn: '',
    checkOut: '',
    guests: '1',
    
    // Step 2: Guest Info
    guestName: '',
    email: '',
    phone: '',
    specialRequests: '',
    
    // Step 3: Payment (placeholder)
    paymentMethod: 'razorpay'
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/properties`);
        const data = await response.json();
        
        if (data.success) {
          setProperties(data.properties);
          
          // Pre-select property if provided in URL
          if (propertySlug) {
            const property = data.properties.find((p: any) => p.slug === propertySlug);
            if (property) {
              setFormData(prev => ({ ...prev, propertyId: property.id.toString() }));
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [propertySlug]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    if (!formData.propertyId || !formData.checkIn || !formData.checkOut) {
      alert('Please fill in all required fields');
      return false;
    }
    const checkInDate = new Date(formData.checkIn);
    const checkOutDate = new Date(formData.checkOut);
    if (checkOutDate <= checkInDate) {
      alert('Check-out date must be after check-in date');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.guestName || !formData.email || !formData.phone) {
      alert('Please fill in all required fields');
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // This would integrate with your booking API
    alert('Booking functionality will be integrated with payment gateway (Razorpay). For now, this is a demo.');
    console.log('Booking data:', formData);
  };

  const selectedProperty = properties.find(p => p.id.toString() === formData.propertyId);
  const nights = formData.checkIn && formData.checkOut
    ? Math.ceil((new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <>
      <Head>
        <title>Book Your Stay | POD N BEYOND</title>
        <meta name="description" content="Book your pod at POD N BEYOND. Easy, fast, and secure booking process." />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo-podnbeyond.png" />
      </Head>

      <Header />

      <section className="pt-24 pb-12 bg-neutral-50 min-h-screen">
        <Container>
          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold transition-colors ${
                    step >= s
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white text-neutral-400 border-2 border-neutral-300'
                  }`}>
                    {s}
                  </div>
                  {s < 3 && (
                    <div className={`h-1 w-16 transition-colors ${
                      step > s ? 'bg-neutral-900' : 'bg-neutral-300'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-center mt-4 space-x-20 text-sm">
              <span className={step >= 1 ? 'font-semibold text-neutral-900' : 'text-neutral-500'}>Property & Dates</span>
              <span className={step >= 2 ? 'font-semibold text-neutral-900' : 'text-neutral-500'}>Guest Info</span>
              <span className={step >= 3 ? 'font-semibold text-neutral-900' : 'text-neutral-500'}>Payment</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card variant="default" padding="lg">
                <form onSubmit={handleSubmit}>
                  {/* Step 1: Property & Dates */}
                  {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Select Property & Dates</h2>
                      
                      {/* Property Selection */}
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                          Property *
                        </label>
                        <select
                          name="propertyId"
                          value={formData.propertyId}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        >
                          <option value="">Select a property</option>
                          {properties.map((property) => (
                            <option key={property.id} value={property.id}>
                              {property.name} - {property.location}, {property.city}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Date Selection */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Check-in *" required>
                          <Input
                            type="date"
                            name="checkIn"
                            value={formData.checkIn}
                            onChange={handleInputChange}
                            min={new Date().toISOString().split('T')[0]}
                            required
                          />
                        </FormField>
                        <FormField label="Check-out *" required>
                          <Input
                            type="date"
                            name="checkOut"
                            value={formData.checkOut}
                            onChange={handleInputChange}
                            min={formData.checkIn || new Date().toISOString().split('T')[0]}
                            required
                          />
                        </FormField>
                      </div>

                      {/* Guests */}
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                          Number of Guests *
                        </label>
                        <select
                          name="guests"
                          value={formData.guests}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        >
                          <option value="1">1 Guest</option>
                          <option value="2">2 Guests</option>
                          <option value="3">3 Guests</option>
                          <option value="4">4+ Guests</option>
                        </select>
                      </div>

                      <div className="pt-6">
                        <Button type="button" variant="primary" size="lg" fullWidth onClick={handleNextStep}>
                          Continue to Guest Information
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Guest Information */}
                  {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Guest Information</h2>
                      
                      <FormField label="Full Name *" required>
                        <Input
                          type="text"
                          name="guestName"
                          value={formData.guestName}
                          onChange={handleInputChange}
                          placeholder="John Doe"
                          required
                        />
                      </FormField>

                      <FormField label="Email Address *" required>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="john@example.com"
                          required
                        />
                      </FormField>

                      <FormField label="Phone Number *" required>
                        <Input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+91 98765 43210"
                          required
                        />
                      </FormField>

                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                          Special Requests (Optional)
                        </label>
                        <textarea
                          name="specialRequests"
                          value={formData.specialRequests}
                          onChange={handleInputChange}
                          rows={4}
                          placeholder="Any special requests or requirements..."
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        />
                      </div>

                      <div className="flex gap-4 pt-6">
                        <Button type="button" variant="secondary" size="lg" onClick={() => setStep(1)}>
                          Back
                        </Button>
                        <Button type="button" variant="primary" size="lg" fullWidth onClick={handleNextStep}>
                          Continue to Payment
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Payment */}
                  {step === 3 && (
                    <div className="space-y-6 animate-fade-in">
                      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Payment</h2>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex items-start">
                          <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <h4 className="font-semibold text-blue-900 mb-2">Demo Mode</h4>
                            <p className="text-blue-800 text-sm">
                              Payment integration is ready but not activated in demo mode. In production, this would integrate with Razorpay for secure payment processing.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="border-2 border-neutral-300 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-semibold text-neutral-900">Payment Method</span>
                          <img src="https://razorpay.com/assets/razorpay-glyph.svg" alt="Razorpay" className="h-6" />
                        </div>
                        <p className="text-neutral-600 text-sm">
                          Secure payment powered by Razorpay. We accept all major credit cards, debit cards, UPI, and net banking.
                        </p>
                      </div>

                      <div className="flex gap-4 pt-6">
                        <Button type="button" variant="secondary" size="lg" onClick={() => setStep(2)}>
                          Back
                        </Button>
                        <Button type="submit" variant="primary" size="lg" fullWidth>
                          Complete Booking (Demo)
                        </Button>
                      </div>
                    </div>
                  )}
                </form>
              </Card>
            </div>

            {/* Booking Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card variant="bordered" padding="lg" className="sticky top-24">
                <h3 className="text-xl font-bold text-neutral-900 mb-6">Booking Summary</h3>
                
                {selectedProperty ? (
                  <>
                    <div className="mb-6">
                      <div className="aspect-video rounded-lg overflow-hidden mb-3">
                        <img
                          src={selectedProperty.images?.[0] || '/placeholder.jpg'}
                          alt={selectedProperty.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="font-semibold text-neutral-900">{selectedProperty.name}</h4>
                      <p className="text-sm text-neutral-600">
                        {selectedProperty.location}, {selectedProperty.city}
                      </p>
                      {selectedProperty.rating && (
                        <div className="flex items-center mt-2">
                          <svg className="w-4 h-4 text-smart-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm font-semibold">{selectedProperty.rating}</span>
                          <span className="text-sm text-neutral-600 ml-1">
                            ({selectedProperty.totalRatings} reviews)
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-neutral-200 pt-6 space-y-3">
                      {formData.checkIn && formData.checkOut && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-600">Check-in</span>
                            <span className="font-semibold text-neutral-900">
                              {new Date(formData.checkIn).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-600">Check-out</span>
                            <span className="font-semibold text-neutral-900">
                              {new Date(formData.checkOut).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-600">Guests</span>
                            <span className="font-semibold text-neutral-900">{formData.guests}</span>
                          </div>
                          {nights > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-neutral-600">Nights</span>
                              <span className="font-semibold text-neutral-900">{nights}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {nights > 0 && (
                      <div className="border-t border-neutral-200 mt-6 pt-6">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-neutral-900">Estimated Total</span>
                          <span className="text-2xl font-bold text-neutral-900">
                            ₹{(nights * 2000).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 mt-2">
                          *Final price will be confirmed based on selected room type
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <p>Select a property to see booking summary</p>
                  </div>
                )}

                {step >= 2 && formData.guestName && (
                  <div className="border-t border-neutral-200 mt-6 pt-6">
                    <h4 className="font-semibold text-neutral-900 mb-3">Guest Details</h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-neutral-700">{formData.guestName}</p>
                      <p className="text-neutral-600">{formData.email}</p>
                      <p className="text-neutral-600">{formData.phone}</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}

