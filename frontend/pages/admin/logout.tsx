import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import Head from 'next/head';

export default function AdminLogout() {
  useEffect(() => {
    signOut({ callbackUrl: '/' });
  }, []);

  return (
    <>
      <Head>
        <title>Signing Out... | POD N BEYOND</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Signing you out...</p>
        </div>
      </div>
    </>
  );
}

