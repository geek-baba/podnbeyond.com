import Head from 'next/head';
import { useSession, signOut } from 'next-auth/react';
import Container from '../../components/layout/Container';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function AdminForbidden() {
  const { data: session } = useSession();

  return (
    <>
      <Head>
        <title>Access Denied | POD N BEYOND</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <Container>
          <div className="max-w-md mx-auto text-center">
            <Card variant="elevated" padding="lg">
              {/* Error Icon */}
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-neutral-900 mb-3">
                Access Denied
              </h1>

              <p className="text-neutral-600 mb-2">
                You don't have permission to access the admin portal.
              </p>

              {session?.user?.email && (
                <p className="text-sm text-neutral-500 mb-6">
                  Signed in as: <strong>{session.user.email}</strong>
                </p>
              )}

              <div className="space-y-3 mb-6">
                <div className="p-4 bg-neutral-100 rounded-lg text-left">
                  <p className="text-sm font-semibold text-neutral-900 mb-2">
                    Admin access is restricted to:
                  </p>
                  <ul className="text-sm text-neutral-600 space-y-1">
                    <li>• Super Administrators</li>
                    <li>• Group Administrators</li>
                    <li>• Property Managers</li>
                    <li>• Front Desk Staff</li>
                    <li>• Operations Staff</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                {session ? (
                  <>
                    <a href="/account">
                      <Button variant="primary" fullWidth>
                        Go to My Account
                      </Button>
                    </a>
                    <Button 
                      variant="secondary" 
                      fullWidth
                      onClick={() => signOut({ callbackUrl: '/' })}
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <a href="/">
                    <Button variant="primary" fullWidth>
                      Return to Homepage
                    </Button>
                  </a>
                )}
              </div>
            </Card>

            <p className="mt-6 text-sm text-neutral-600">
              Need admin access?{' '}
              <a href="mailto:admin@podnbeyond.com" className="text-neutral-900 hover:underline">
                Contact Support
              </a>
            </p>
          </div>
        </Container>
      </div>
    </>
  );
}

