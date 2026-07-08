import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_ENDPOINTS } from "./constants";

const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Crucial for receiving HttpOnly refresh cookies
});

// Silent refresh lock parameters
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: AxiosError) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach bearer token if active
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");
    if (token && config.headers && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Silent refresh queueing and locking
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const status = error.response?.status;

    // Handle 401 Unauthorized errors (session expirations)
    if (status === 401 && !(originalRequest as any)._retry) {
      // If the refresh token route itself returns 401, clear credentials and redirect to login
      if (originalRequest.url === API_ENDPOINTS.AUTH_REFRESH || originalRequest.url?.includes("/auth/refresh")) {
        localStorage.removeItem("access_token");
        isRefreshing = false;
        window.dispatchEvent(new CustomEvent("auth-logout"));
        return Promise.reject(error);
      }

      (originalRequest as any)._retry = true;

      // If a refresh is already in progress, queue downstream requests
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject: (err: AxiosError) => {
              reject(err);
            },
          });
        });
      }

      // Lock refresh thread
      isRefreshing = true;

      try {
        // Call refresh endpoint using clean axios instance to avoid interceptor deadlock
        const response = await axios.post<{ access_token: string }>(
          `${API_URL}${API_ENDPOINTS.AUTH_REFRESH}`,
          {},
          { withCredentials: true }
        );
        const { access_token } = response.data;
        
        localStorage.setItem("access_token", access_token);
        
        // Resolve queued requests
        processQueue(null, access_token);
        
        // Retry original query
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return api(originalRequest);
        
      } catch (refreshError) {
        // Session expired, reject queue and redirect
        processQueue(refreshError as AxiosError, null);
        localStorage.removeItem("access_token");
        
        // Fire custom event to notify AuthContext to redirect
        window.dispatchEvent(new CustomEvent("auth-session-expired"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Standardized Global Error code handling
    // Fired globally so components can consume errors or display warnings
    if (status === 403) {
      window.dispatchEvent(new CustomEvent("api-forbidden", { detail: error }));
    } else if (status === 429) {
      window.dispatchEvent(new CustomEvent("api-rate-limited", { detail: error }));
    } else if (status && status >= 500) {
      window.dispatchEvent(new CustomEvent("api-server-error", { detail: error }));
    }

    return Promise.reject(error);
  }
);
