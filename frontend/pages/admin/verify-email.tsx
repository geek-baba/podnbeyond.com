import Head from 'next/head';
import Container from '../../components/layout/Container';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function VerifyEmail() {
  return (
    <>
      <Head>
        <title>Check Your Email | POD N BEYOND</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center px-4">
        <Container>
          <div className="max-w-md mx-auto">
            <Card variant="elevated" padding="lg">
              <div className="text-center">
                {/* Email Icon */}
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>

                <h1 className="text-3xl font-bold text-neutral-900 mb-3">
                  Check Your Email
                </h1>

                <p className="text-neutral-600 mb-6">
                  A sign-in link has been sent to your email address.
                </p>

                <div className="p-4 bg-neutral-100 rounded-lg mb-6 text-left">
                  <p className="text-sm font-semibold text-neutral-900 mb-2">
                    Next steps:
                  </p>
                  <ol className="text-sm text-neutral-600 space-y-1 list-decimal list-inside">
                    <li>Check your inbox for an email from POD N BEYOND</li>
                    <li>Click the magic link in the email</li>
                    <li>You'll be signed in automatically</li>
                  </ol>
                </div>

                <p className="text-xs text-neutral-500 mb-6">
                  The link expires in 24 hours. If you don't see the email, check your spam folder.
                </p>

                <a href="/admin/login">
                  <Button variant="secondary" fullWidth>
                    Back to Login
                  </Button>
                </a>
              </div>
            </Card>
          </div>
        </Container>
      </div>
    </>
  );
}

