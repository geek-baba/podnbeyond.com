/**
 * API utility functions for making requests to the backend
 */

/**
 * Get the API base URL based on environment
 * - Client-side: Always use relative URLs (proxied by Next.js rewrites)
 * - Server-side: Use NEXT_PUBLIC_API_URL or localhost
 */
export function getApiUrl(): string {
  // In browser (client-side), ALWAYS use relative URLs
  // Next.js rewrites will proxy /api/* to backend on both staging and production
  if (typeof window !== 'undefined') {
    return ''; // Relative URLs only
  }
  
  // On server (getServerSideProps), use full URL
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.BACKEND_URL ||
    'http://localhost:4000'
  );
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

