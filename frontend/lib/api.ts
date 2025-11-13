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
  
  console.log('🌐 API Request:', {
    method: options?.method || 'GET',
    url,
    baseUrl,
    endpoint,
    isClient: typeof window !== 'undefined',
  });
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    console.log('📡 API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      
      console.error('❌ API Error Response:', errorData);
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ API Success:', { endpoint, hasData: !!data });
    return data;
  } catch (error: any) {
    console.error('❌ API Request Failed:', {
      endpoint,
      url,
      error: error.message,
      name: error.name,
      stack: error.stack,
    });
    throw error;
  }
}

