/**
 * API utility functions for making requests to the backend
 */

/**
 * Get the API base URL based on environment
 * - Production: Uses relative URLs (proxied by Next.js rewrites)
 * - Development: Uses NEXT_PUBLIC_API_URL if set, otherwise relative URLs
 */
export function getApiUrl(): string {
  // In browser (client-side), use relative URLs for production
  // Next.js rewrites will proxy /api/* to backend
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || '';
  }
  
  // On server (getServerSideProps), use full URL
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}

/**
 * Make an API request with proper error handling
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.error || error.message || 'API request failed');
  }

  return response.json();
}

