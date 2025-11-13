import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function AdminEmailRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Use replace to avoid adding to history
    if (router.isReady) {
      router.replace('/admin/communication-hub');
    }
  }, [router]);

  // Also redirect on server-side if possible
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/communication-hub';
    }
  }, []);

  return (
    <>
      <Head>
        <meta httpEquiv="refresh" content="0;url=/admin/communication-hub" />
      </Head>
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
          <p className="text-neutral-600">Redirecting to Communication Hub...</p>
        </div>
      </div>
    </>
  );
}

