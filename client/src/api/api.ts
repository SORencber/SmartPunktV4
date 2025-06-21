import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
// @ts-ignore
import JSONbig from 'json-bigint';

// Development ortamında proxy kullan, production'da tam URL kullan
const baseURL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: (status) => {
    return status >= 200 && status < 300;
  },
  transformResponse: [(data) => JSONbig.parse(data)]
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    
    // Decode and log token if present
    if (token) {
      try {
        // Check if token is in valid JWT format
        const parts = token.split('.');
        if (parts.length !== 3) {
          console.warn('Invalid token format: Token is not a valid JWT');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          return config;
        }

        const base64Url = parts[1];
        if (!base64Url) {
          console.warn('Invalid token format: Missing payload');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          return config;
        }

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const decodedToken = JSON.parse(jsonPayload);
        console.log('🔑 Token Details:', {
          exp: new Date(decodedToken.exp * 1000).toISOString(),
          iat: new Date(decodedToken.iat * 1000).toISOString(),
          now: new Date().toISOString(),
          isExpired: decodedToken.exp * 1000 < Date.now(),
          userId: decodedToken.id,
          role: decodedToken.role
        });

        // If token is expired, remove it and trigger refresh
        if (decodedToken.exp * 1000 < Date.now()) {
          console.log('Token is expired, removing...');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login?session=expired';
          }
          return config;
        }
      } catch (error) {
        console.error('Failed to decode token:', error);
        // Clear invalid tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?error=invalid_token';
        }
        return config;
      }
    }
    
    // Request detaylarını logla
    console.log('🚀 API İsteği:', {
      url: config.url,
      method: config.method,
      headers: {
        ...config.headers,
        Authorization: token ? `Bearer ${token.substring(0, 10)}...` : 'Yok'
      },
      data: config.data ? {
        ...config.data,
        parts: config.data.parts ? `${config.data.parts.length} parça` : undefined
      } : undefined,
      baseURL: config.baseURL,
      timestamp: new Date().toISOString()
    });

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Tüm isteklere /api prefix'i ekle
    if (!config.url?.startsWith('/api/')) {
      config.url = `/api${config.url?.startsWith('/') ? '' : '/'}${config.url}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Interceptor Hatası:', error);
    return Promise.reject(error);
  }
);

// Add a flag to track ongoing refresh attempts
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Function to subscribe to token refresh
const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// Function to notify subscribers of token refresh
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Başarılı yanıtı logla
    console.log('✅ API Yanıtı:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      timestamp: new Date().toISOString()
    });
    return response;
  },
  async (error) => {
    // Hata detaylarını logla
    console.error('❌ API Hatası:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.config?.headers,
      timestamp: new Date().toISOString()
    });

    const originalRequest = error.config;

    // Skip token refresh for login and refresh token endpoints
    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh-token')) {
      return Promise.reject(error);
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      console.log('Rate limit exceeded, redirecting to login');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?error=rate_limit';
      }
      return Promise.reject(error);
    }

    // Token refresh logic for 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If already refreshing, wait for the refresh to complete
      if (isRefreshing) {
        try {
          const token = await new Promise<string>((resolve) => {
            subscribeTokenRefresh(token => resolve(token));
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          console.log('No refresh token available, redirecting to login');
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login?session=expired';
          }
          return Promise.reject(error);
        }

        console.log('Attempting to refresh token...');
        // Token refresh request
        const response = await axios.post('/api/auth/refresh-token', {
          refreshToken,
        }, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const refreshed = response.data?.data;
        if (refreshed?.accessToken) {
          console.log('Token refresh successful, updating tokens');
          const { accessToken, refreshToken: newRefreshToken } = refreshed;

          // Update tokens in localStorage
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Update the original request's authorization header
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          
          // Notify all subscribers
          onTokenRefreshed(accessToken);
          
          // Retry the original request with new token
          console.log('Retrying original request with new token');
          return api(originalRequest);
        }

        console.error('Invalid refresh token response:', refreshed);
        throw new Error('Invalid refresh token response');
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear tokens and redirect to login only if we're not already there
        if (!window.location.pathname.includes('/login')) {
          console.log('Token refresh failed, clearing tokens and redirecting to login');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login?session=expired';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For non-JSON responses, try to parse the error message
    if (error.response?.data && typeof error.response.data === 'string') {
      error.response.data = { message: error.response.data };
    }

    return Promise.reject(error);
  }
);
