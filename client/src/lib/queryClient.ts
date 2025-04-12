import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Get the base API URL for the current environment
function getBaseApiUrl() {
  // If we're running in production, use relative URLs which will work with any host
  // This ensures the app works correctly even when deployed to a custom server
  return '';
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    } catch (e) {
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getBaseApiUrl();
  const fullUrl = `${baseUrl}${url}`;
  
  console.log(`Making API request: ${method} ${fullUrl}`);
  
  try {
    const res = await fetch(fullUrl, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        // Add cache-busting header to prevent browser caching
        "Cache-Control": "no-cache, no-store",
        "Pragma": "no-cache"
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      // Force reload from server, not from cache
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`API error response: ${method} ${fullUrl} - Status: ${res.status}`);
      
      // For login-related errors, add more detailed logging
      if (url.includes('/api/login') || url.includes('/api/user')) {
        console.error(`Auth error details: ${res.statusText}`);
        // Try to parse and log the response body for debugging
        try {
          const errorText = await res.text();
          console.error(`Error response body: ${errorText}`);
          throw new Error(`${res.status}: ${errorText || res.statusText}`);
        } catch (textError) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }
      } else {
        await throwIfResNotOk(res);
      }
    }
    
    return res;
  } catch (error) {
    console.error(`API request failed: ${method} ${fullUrl}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getBaseApiUrl();
    const fullUrl = `${baseUrl}${queryKey[0]}`;
    
    console.log(`Making query request: GET ${fullUrl}`);
    
    try {
      const res = await fetch(fullUrl, {
        headers: {
          // Add cache-busting headers
          "Cache-Control": "no-cache, no-store",
          "Pragma": "no-cache"
        },
        credentials: "include",
        // Prevent browser caching
        cache: "no-store"
      });

      if (res.status === 401) {
        console.log(`Authentication required for: ${fullUrl}`);
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
      }

      if (!res.ok) {
        console.error(`Query error response: GET ${fullUrl} - Status: ${res.status}`);
        
        // Add special handling for auth-related endpoints for better debugging
        if (queryKey[0].includes('/api/user')) {
          console.error(`Auth query error details: ${res.statusText}`);
          try {
            const errorText = await res.text();
            console.error(`Error response body: ${errorText}`);
            throw new Error(`${res.status}: ${errorText || res.statusText}`);
          } catch (textError) {
            throw new Error(`${res.status}: ${res.statusText}`);
          }
        } else {
          await throwIfResNotOk(res);
        }
      }
      
      const data = await res.json();
      return data;
    } catch (error) {
      console.error(`Query failed: ${fullUrl}`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,  // Enable refetch on window focus
      staleTime: 30000,            // Mark data as stale after 30 seconds
      gcTime: 60000,               // Garbage collection after 1 minute
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
