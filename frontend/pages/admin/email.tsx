import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AdminEmailRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin/communication-hub');
  }, [router]);

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
        <p className="text-neutral-600">Redirecting...</p>
      </div>
    </div>
  );
}

