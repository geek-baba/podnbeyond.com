import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../lib/useAuth';
import { apiRequest } from '../lib/api';

export default function MemberLogin() {
  const router = useRouter();
  const { data: session, status } = useAuth();
  const isRegisterMode = router.query.mode === 'register';
  
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  // Debug logging
  useEffect(() => {
    console.log('🔍 [MemberLogin] status:', status, 'session:', session);
  }, [status, session]);

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session) {
      const callbackUrl = (router.query.callbackUrl as string) || '/account';
      router.push(callbackUrl);
    }
  }, [status, session, router]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // In registration mode, send user details with OTP request
      const payload = isRegisterMode
        ? { email, firstName, lastName, phone }
        : { email };
      
      await apiRequest('/api/otp/send', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || 'Unable to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // In registration mode, include user details for account creation
      const payload = isRegisterMode
        ? { email, otp: code, firstName, lastName, phone }
        : { email, otp: code };
      
      const data = await apiRequest('/api/otp/verify', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (data.success && data.sessionToken) {
        localStorage.setItem('pod-session-token', data.sessionToken);
        const callbackUrl = (router.query.callbackUrl as string) || '/account';
        window.location.href = callbackUrl;
      } else {
        throw new Error('No session token received');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.');
      setOtp(['', '', '', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-verify when all filled
    if (index === 5 && value) {
      const fullCode = [...newOtp.slice(0, 5), value].join('');
      if (fullCode.length === 6) {
        setTimeout(() => handleVerifyOTP(), 100);
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();

    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      setTimeout(() => {
        handleVerifyOTP();
      }, 100);
    }
  };

  if (status === 'loading') {
    return (
      <>
        <Head>
          <title>Loading... | POD N BEYOND</title>
        </Head>
        <Header />
        <section className="min-h-screen flex items-center justify-center bg-neutral-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto"></div>
            <p className="mt-4 text-neutral-600">Loading...</p>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Member Login | POD N BEYOND</title>
        <meta name="description" content="Login to access your POD N BEYOND member account" />
      </Head>

      <Header />

      <section className="min-h-screen py-20 bg-neutral-50 flex items-center">
        <Container size="sm">
          <div className="max-w-md mx-auto">
            <Card padding="lg">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                  {isRegisterMode ? 'Join POD N BEYOND Circle' : 'Member Login'}
                </h1>
                <p className="text-neutral-600">
                  {otpSent 
                    ? 'Enter the 6-digit code sent to your email'
                    : isRegisterMode
                    ? 'Create your free account and start earning points'
                    : 'Enter your email to receive a login code'
                  }
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {!otpSent ? (
                <form onSubmit={handleSendOTP} className="space-y-6">
                  {isRegisterMode && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            First Name *
                          </label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="John"
                            required
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Doe"
                            required
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          required
                          pattern="[0-9+\s-]+"
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        />
                      </div>
                    </>
                  )}
                  
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : isRegisterMode ? 'Create Account' : 'Send Login Code'}
                  </Button>

                  <div className="text-center pt-4">
                    {isRegisterMode ? (
                      <p className="text-sm text-neutral-600">
                        Already have an account?{' '}
                        <a href="/login" className="text-neutral-900 font-semibold hover:underline">
                          Login here
                        </a>
                      </p>
                    ) : (
                      <p className="text-sm text-neutral-600">
                        Don't have an account?{' '}
                        <a href="/membership#join" className="text-neutral-900 font-semibold hover:underline">
                          Join POD N BEYOND Circle
                        </a>
                      </p>
                    )}
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-4 text-center">
                      Enter 6-Digit Code
                    </label>
                    <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          className="w-12 h-12 text-center text-xl font-bold border-2 border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                        />
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleVerifyOTP}
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={isLoading || otp.join('').length !== 6}
                  >
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                  </Button>

                  <div className="text-center space-y-2">
                    <button
                      onClick={() => {
                        setOtpSent(false);
                        setOtp(['', '', '', '', '', '']);
                        setError('');
                      }}
                      className="text-sm text-neutral-600 hover:text-neutral-900 font-medium"
                    >
                      ← Change email
                    </button>
                    <p className="text-xs text-neutral-500">
                      Code expires in 10 minutes
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-neutral-200 text-center">
                <p className="text-sm text-neutral-600">
                  Are you staff?{' '}
                  <a href="/admin/login" className="text-neutral-900 font-semibold hover:underline">
                    Staff Login →
                  </a>
                </p>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}

