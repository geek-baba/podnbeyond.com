import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

interface UserRole {
  key: string;
  name: string;
  scopeType: string;
  scopeId: number;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  roles: UserRole[];
  loyaltyTier: string;
  loyaltyPoints: number;
}

interface Session {
  user: User;
  expires: string;
}

interface AuthState {
  data: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;
}

// Session cache to prevent redundant fetches
let sessionCache: { data: Session | null; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000; // 1 minute cache

export function useAuth() {
  // Simple initial state: check localStorage synchronously on client, or 'loading' on server
  const getInitialState = (): AuthState => {
    // Server-side: always start as loading
    if (typeof window === 'undefined') {
      return { data: null, status: 'loading', error: null };
    }
    
    // Client-side: check cache first
    if (sessionCache && Date.now() - sessionCache.timestamp < CACHE_DURATION) {
      return {
        data: sessionCache.data,
        status: sessionCache.data ? 'authenticated' : 'unauthenticated',
        error: null
      };
    }
    
    // Client-side: check localStorage
    const hasToken = localStorage.getItem('pod-session-token');
    if (!hasToken) {
      // No token = unauthenticated immediately (no need to fetch)
      return { data: null, status: 'unauthenticated', error: null };
    }
    
    // Token exists = need to verify, start as loading
    return { data: null, status: 'loading', error: null };
  };

  const [authState, setAuthState] = useState<AuthState>(getInitialState());

  const fetchSession = useCallback(async () => {
    // Double-check token exists before fetching
    const sessionToken = localStorage.getItem('pod-session-token');
    if (!sessionToken) {
      setAuthState({ data: null, status: 'unauthenticated', error: null });
      sessionCache = { data: null, timestamp: Date.now() };
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/auth/session', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        sessionCache = { data: data, timestamp: Date.now() };
        setAuthState({ data: data, status: 'authenticated', error: null });
      } else if (response.status === 401) {
        localStorage.removeItem('pod-session-token');
        sessionCache = { data: null, timestamp: Date.now() };
        setAuthState({ data: null, status: 'unauthenticated', error: 'Session expired' });
      } else {
        localStorage.removeItem('pod-session-token');
        sessionCache = { data: null, timestamp: Date.now() };
        setAuthState({ data: null, status: 'unauthenticated', error: 'Failed to verify session' });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Timeout - clear token and mark unauthenticated
        localStorage.removeItem('pod-session-token');
        sessionCache = { data: null, timestamp: Date.now() };
        setAuthState({ data: null, status: 'unauthenticated', error: 'Request timeout' });
      } else {
        // Network error - clear token and mark unauthenticated
        localStorage.removeItem('pod-session-token');
        sessionCache = { data: null, timestamp: Date.now() };
        setAuthState({ data: null, status: 'unauthenticated', error: 'Connection error' });
      }
    }
  }, []);

  // Single useEffect: handle client-side initialization and fetching
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    // If status is 'loading', we need to fetch
    if (authState.status === 'loading') {
      fetchSession();
    } else if (authState.status === 'unauthenticated') {
      // If unauthenticated, make sure there's no stale token
      const token = localStorage.getItem('pod-session-token');
      if (token) {
        // Token exists but we're unauthenticated - clear it
        localStorage.removeItem('pod-session-token');
        sessionCache = { data: null, timestamp: Date.now() };
      }
    }
  }, [authState.status, fetchSession]);

  // Safety timeout: if still loading after 3 seconds, force unauthenticated
  useEffect(() => {
    if (authState.status !== 'loading') return;

    const timeout = setTimeout(() => {
      setAuthState((current) => {
        if (current.status !== 'loading') return current;
        localStorage.removeItem('pod-session-token');
        sessionCache = { data: null, timestamp: Date.now() };
        return { data: null, status: 'unauthenticated', error: 'Authentication timeout' };
      });
    }, 3000);

    return () => clearTimeout(timeout);
  }, [authState.status]);

  const signOut = useCallback(async (options?: { callbackUrl?: string }) => {
    const sessionToken = localStorage.getItem('pod-session-token');
    localStorage.removeItem('pod-session-token');
    sessionCache = null;
    setAuthState({ data: null, status: 'unauthenticated', error: null });

    if (sessionToken) {
      fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(2000)
      }).catch(() => {});
    }

    window.location.href = options?.callbackUrl || '/';
  }, []);

  const refreshSession = useCallback(() => {
    sessionCache = null; // Clear cache
    setAuthState({ data: null, status: 'loading', error: null });
    fetchSession();
  }, [fetchSession]);

  return {
    data: authState.data,
    status: authState.status,
    error: authState.error,
    signOut,
    refreshSession
  };
}
