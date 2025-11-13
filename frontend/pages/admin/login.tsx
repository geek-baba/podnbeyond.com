import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Container from '../../components/layout/Container';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { apiRequest } from '../../lib/api';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const { callbackUrl } = router.query;

  // Resend timer
  useEffect(() => {
    if (otpSent && resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpSent, resendTimer]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('📧 Sending OTP request for:', email);
      const data = await apiRequest('/api/otp/send', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      console.log('✅ OTP response:', data);

      if (data.success) {
        setOtpSent(true);
        setResendTimer(60);
        setError('');
        // Focus first OTP input
        setTimeout(() => otpRefs[0].current?.focus(), 100);
      } else {
        setError(data.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      console.error('❌ Send OTP error:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      
      // Provide more specific error messages
      let errorMessage = 'Unable to send OTP. Please check your connection and try again.';
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.message?.includes('429')) {
        errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
      } else if (err.message?.includes('500')) {
        errorMessage = 'Server error. Please try again in a moment.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs[index + 1].current?.focus();
    }

    // Auto-verify when all 6 digits entered
    if (index === 5 && value) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        handleVerifyOTP(fullOtp);
      }
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    
    // Only accept 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      // Focus last input
      otpRefs[5].current?.focus();
      // Auto-verify after paste
      setTimeout(() => {
        handleVerifyOTP(pastedData);
      }, 100);
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const data = await apiRequest('/api/otp/verify', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ email, otp: code }),
      });

      if (data.success && data.sessionToken) {
        // Store session token in localStorage
        console.log('📝 Storing session token:', data.sessionToken.substring(0, 20) + '...');
        localStorage.setItem('pod-session-token', data.sessionToken);
        
        // Verify it was stored
        const stored = localStorage.getItem('pod-session-token');
        console.log('✅ Session token verified in localStorage:', stored ? 'YES' : 'NO');
        console.log('🔍 Stored value:', stored?.substring(0, 20) + '...');
        
        // Small delay to ensure localStorage is written
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Redirect to admin
        console.log('🚀 Redirecting to:', data.redirectTo || '/admin');
        window.location.href = data.redirectTo || '/admin';
      } else {
        console.error('❌ No session token in response:', data);
        throw new Error('No session token received');
      }
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      
      // Parse error message
      let errorMessage = 'Verification failed. Please try again.';
      if (err.message.includes('Invalid OTP')) {
        errorMessage = err.message;
      } else if (err.message.includes('expired')) {
        errorMessage = 'OTP expired. Please request a new code.';
      } else if (err.message.includes('attempts')) {
        errorMessage = err.message;
      } else if (err.message.includes('not found')) {
        errorMessage = 'OTP not found. Please request a new code.';
      }
      
      setError(errorMessage);
      
      // Clear OTP inputs
      setOtp(['', '', '', '', '', '']);
      otpRefs[0].current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResendTimer(60);
    await handleSendOTP({ preventDefault: () => {} } as React.FormEvent);
  };

  return (
    <>
      <Head>
        <title>Admin Login | POD N BEYOND</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center px-4">
        <Container>
          <div className="max-w-md mx-auto">
            {/* Logo */}
            <div className="text-center mb-8">
              <a href="/">
                <img 
                  src="/logo-podnbeyond.png" 
                  alt="POD N BEYOND" 
                  className="h-12 mx-auto mb-4"
                />
              </a>
              <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
              <p className="text-neutral-400">POD N BEYOND GROUP Management</p>
            </div>

            <Card variant="elevated" padding="lg">
              {!otpSent ? (
                <>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">Sign In</h2>
                  <p className="text-neutral-600 mb-6">
                    Enter your email to receive a login code
                  </p>

                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@podnbeyond.com"
                        required
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        disabled={isLoading}
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      fullWidth
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sending...' : 'Send Login Code'}
                    </Button>
                  </form>

                  <div className="mt-6 pt-6 border-t border-neutral-200">
                    <p className="text-sm text-neutral-600 text-center">
                      <a href="/" className="text-neutral-900 hover:underline">
                        ← Back to Website
                      </a>
                    </p>
                  </div>
                </>
              ) : (
                <div className="py-4">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                      Enter Verification Code
                    </h3>
                    <p className="text-neutral-600 mb-1">
                      We sent a 6-digit code to:
                    </p>
                    <p className="text-lg font-semibold text-neutral-900 mb-4">
                      {email}
                    </p>
                  </div>

                  {/* 6-Digit OTP Input */}
                  <div className="flex justify-center gap-2 mb-6">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={otpRefs[index]}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOTPChange(index, e.target.value)}
                        onKeyDown={(e) => handleOTPKeyDown(index, e)}
                        onPaste={index === 0 ? handleOTPPaste : undefined}
                        className="w-12 h-14 text-center text-2xl font-bold border-2 border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                        disabled={isLoading}
                      />
                    ))}
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                      {error}
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => handleVerifyOTP()}
                    disabled={isLoading || otp.join('').length !== 6}
                  >
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                  </Button>

                  <div className="mt-6 pt-6 border-t border-neutral-200 text-center">
                    <p className="text-sm text-neutral-600 mb-2">
                      Didn't receive the code?
                    </p>
                    {resendTimer > 0 ? (
                      <p className="text-sm text-neutral-500">
                        Resend in {resendTimer}s
                      </p>
                    ) : (
                      <button
                        onClick={handleResend}
                        className="text-sm text-neutral-900 hover:underline font-semibold"
                      >
                        Resend Code
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setOtpSent(false);
                        setOtp(['', '', '', '', '', '']);
                        setError('');
                      }}
                      className="block mx-auto mt-4 text-sm text-neutral-600 hover:text-neutral-900"
                    >
                      Use Different Email
                    </button>
                  </div>
                </div>
              )}
            </Card>

            {/* Security notice */}
            <div className="mt-6 text-center text-sm text-neutral-400">
              <p>🔒 Secure authentication via 6-digit code</p>
              <p className="mt-1">Code expires in 10 minutes</p>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
