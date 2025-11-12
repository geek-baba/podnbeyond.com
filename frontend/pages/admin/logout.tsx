import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/useAuth';
import Head from 'next/head';

export default function AdminLogout() {
  const { signOut } = useAuth();
  const [redirecting, setRedirecting] = useState(true);
  
  useEffect(() => {
    // Clear everything immediately
    localStorage.removeItem('pod-session-token');
    
    // Call signOut (which will redirect)
    signOut({ callbackUrl: '/' });
    
    // Fallback: if redirect doesn't happen in 2 seconds, force it
    const timeout = setTimeout(() => {
      if (redirecting) {
        window.location.href = '/';
      }
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [signOut, redirecting]);

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

