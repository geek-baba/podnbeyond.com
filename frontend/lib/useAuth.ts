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
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      });

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
        throw new Error('Failed to fetch session');
      }
    } catch (error: any) {
      console.error('Failed to fetch session:', error);
      
      setAuthState(prev => ({
        ...prev,
        status: prev.data ? 'authenticated' : 'unauthenticated', // Keep previous state if exists
        error: 'Connection error. Please check your internet.'
      }));
    }
  }, []);

  useEffect(() => {
    // Only fetch if we don't have fresh cached data
    if (!sessionCache || Date.now() - sessionCache.timestamp >= CACHE_DURATION) {
      fetchSession();
    }
  }, [fetchSession]);

  const signOut = useCallback(async (options?: { callbackUrl?: string }) => {
    try {
      const sessionToken = localStorage.getItem('pod-session-token');
      
      if (sessionToken) {
        // Use relative URL (Next.js rewrites handle proxying)
        await fetch('/api/auth/signout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'Content-Type': 'application/json'
          }
        });
      }

      // Clear local storage and cache
      localStorage.removeItem('pod-session-token');
      sessionCache = null;

      setAuthState({
        data: null,
        status: 'unauthenticated',
        error: null
      });

      // Redirect
      window.location.href = options?.callbackUrl || '/';
    } catch (error) {
      console.error('Failed to sign out:', error);
      
      // Still clear local state even if API call fails
      localStorage.removeItem('pod-session-token');
      sessionCache = null;
      window.location.href = options?.callbackUrl || '/';
    }
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
