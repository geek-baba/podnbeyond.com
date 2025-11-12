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
  // Initialize with cache if available and fresh, OR check localStorage immediately
  const getInitialState = (): AuthState => {
    if (sessionCache && Date.now() - sessionCache.timestamp < CACHE_DURATION) {
      return {
        data: sessionCache.data,
        status: sessionCache.data ? 'authenticated' : 'unauthenticated',
        error: null
      };
    }
    // Check if there's a session token in localStorage
    // If not, start as unauthenticated instead of loading
    if (typeof window !== 'undefined') {
      const hasToken = localStorage.getItem('pod-session-token');
      if (!hasToken) {
        return {
          data: null,
          status: 'unauthenticated',
          error: null
        };
      }
    }
    return {
      data: null,
      status: 'loading',
      error: null
    };
  };

  const [authState, setAuthState] = useState<AuthState>(getInitialState());

  const fetchSession = useCallback(async (forceRefresh = false) => {
    try {
      console.log('🔍 [useAuth] Fetching session... forceRefresh:', forceRefresh);
      
      // Check cache first (unless force refresh)
      if (!forceRefresh && sessionCache && Date.now() - sessionCache.timestamp < CACHE_DURATION) {
        console.log('✅ [useAuth] Using cached session');
        setAuthState({
          data: sessionCache.data,
          status: sessionCache.data ? 'authenticated' : 'unauthenticated',
          error: null
        });
        return;
      }

      // Get session token from localStorage
      const sessionToken = localStorage.getItem('pod-session-token');
      console.log('🔑 [useAuth] Session token from localStorage:', sessionToken ? sessionToken.substring(0, 20) + '...' : 'NULL');
      
      if (!sessionToken) {
        console.log('❌ [useAuth] No session token found');
        sessionCache = { data: null, timestamp: Date.now() };
        setAuthState({
          data: null,
          status: 'unauthenticated',
          error: null
        });
        return;
      }

      // Fetch from backend using relative URL (Next.js rewrites handle proxying)
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 5000); // 5 second timeout
      
      let response;
      try {
        response = await fetch('/api/auth/session', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('TIMEOUT');
        }
        throw fetchError;
      }

      if (response.ok) {
        const data = await response.json();
        
        // Update cache
        sessionCache = { data: data, timestamp: Date.now() };
        
        setAuthState({
          data: data,
          status: 'authenticated',
          error: null
        });
      } else if (response.status === 401) {
        // Session invalid or expired, clear it
        localStorage.removeItem('pod-session-token');
        sessionCache = { data: null, timestamp: Date.now() };
        
        setAuthState({
          data: null,
          status: 'unauthenticated',
          error: 'Session expired. Please log in again.'
        });
      } else {
        // Any other error status - clear session and mark as unauthenticated
        console.error('Session fetch failed with status:', response.status);
        localStorage.removeItem('pod-session-token');
        sessionCache = { data: null, timestamp: Date.now() };
        
        setAuthState({
          data: null,
          status: 'unauthenticated',
          error: 'Failed to verify session. Please log in again.'
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch session:', error);
      
      // On network error or timeout, clear session and mark as unauthenticated
      localStorage.removeItem('pod-session-token');
      sessionCache = { data: null, timestamp: Date.now() };
      
      const errorMessage = error.message === 'TIMEOUT' || error.name === 'AbortError'
        ? 'Request timeout. Please check your connection.'
        : 'Connection error. Please check your internet.';
      
      setAuthState({
        data: null,
        status: 'unauthenticated',
        error: errorMessage
      });
    }
  }, []);

  useEffect(() => {
    // Only fetch if we don't have fresh cached data
    // But also check if we're still in loading state - if so, fetch immediately
    if (authState.status === 'loading' || !sessionCache || Date.now() - sessionCache.timestamp >= CACHE_DURATION) {
      fetchSession();
    }
  }, [fetchSession, authState.status]);

  const signOut = useCallback(async (options?: { callbackUrl?: string }) => {
    // Get token before clearing
    const sessionToken = localStorage.getItem('pod-session-token');
    
    // Clear local storage and cache immediately
    localStorage.removeItem('pod-session-token');
    sessionCache = null;

    setAuthState({
      data: null,
      status: 'unauthenticated',
      error: null
    });

    // Try to call signout API with timeout, but don't wait for it
    if (sessionToken) {
      // Fire and forget - don't wait for response
      fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(2000) // 2 second timeout
      }).catch((error) => {
        // Ignore errors - we're signing out anyway
        console.log('Signout API call failed (ignored):', error);
      });
    }

    // Redirect immediately - don't wait for API call
    window.location.href = options?.callbackUrl || '/';
  }, []);

  const refreshSession = useCallback(() => {
    fetchSession(true); // Force refresh, bypass cache
  }, [fetchSession]);

  return {
    data: authState.data,
    status: authState.status,
    error: authState.error,
    signOut,
    refreshSession
  };
}
