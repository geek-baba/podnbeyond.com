import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Container from '../../components/layout/Container';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const { callbackUrl } = router.query;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl: (callbackUrl as string) || '/admin',
      });

      if (result?.error) {
        setError('Failed to send magic link. Please try again.');
      } else {
        setEmailSent(true);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
              {!emailSent ? (
                <>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">Sign In</h2>
                  <p className="text-neutral-600 mb-6">
                    Enter your email to receive a magic link
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
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
                      {isLoading ? 'Sending...' : 'Send Magic Link'}
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
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                    Check Your Email
                  </h3>
                  <p className="text-neutral-600 mb-4">
                    We've sent a magic link to:
                  </p>
                  <p className="text-lg font-semibold text-neutral-900 mb-6">
                    {email}
                  </p>
                  <p className="text-sm text-neutral-600 mb-6">
                    Click the link in the email to sign in. The link expires in 24 hours.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEmailSent(false)}
                  >
                    Use Different Email
                  </Button>
                </div>
              )}
            </Card>

            {/* Security notice */}
            <div className="mt-6 text-center text-sm text-neutral-400">
              <p>🔒 Secure authentication via magic link</p>
              <p className="mt-1">No passwords required</p>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}

