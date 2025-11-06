import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Container from '../../components/layout/Container';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function AcceptInvite() {
  const router = useRouter();
  const { token } = router.query;
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/invites/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invite');
      }

      setSuccess(true);
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push('/admin/login?message=invite-accepted');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Card variant="default" padding="lg">
          <p className="text-neutral-600">Invalid invite link</p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Accept Invitation | POD N BEYOND</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center px-4">
        <Container>
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <img 
                src="/logo-podnbeyond.png" 
                alt="POD N BEYOND" 
                className="h-12 mx-auto mb-4"
              />
              <h1 className="text-3xl font-bold text-white mb-2">Join Our Team</h1>
              <p className="text-neutral-400">POD N BEYOND GROUP</p>
            </div>

            <Card variant="elevated" padding="lg">
              {!success ? (
                <>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">Accept Invitation</h2>
                  <p className="text-neutral-600 mb-6">
                    You've been invited to join POD N BEYOND. Complete your profile to get started.
                  </p>

                  <form onSubmit={handleAccept} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
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
                      {isLoading ? 'Creating Account...' : 'Accept & Create Account'}
                    </Button>
                  </form>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                    Account Created!
                  </h3>
                  <p className="text-neutral-600 mb-6">
                    Your account has been created successfully. Signing you in...
                  </p>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto"></div>
                </div>
              )}
            </Card>
          </div>
        </Container>
      </div>
    </>
  );
}

