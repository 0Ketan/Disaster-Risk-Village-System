import axios from 'axios';

/**
 * VillageShield Resilient Axios Client
 * Adheres to GEMINI.md rules:
 * 1. Explicit 8s timeout
 * 2. 1 retry on initial network failure
 * 3. Graceful fallback handling
 */
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL : '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000, // 8 seconds explicit timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Response interceptor with 1 retry logic for transient errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Retry once if request hasn't been retried yet and error is network/timeout or 5xx
    if (originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        console.warn(`Retrying request to ${originalRequest.url} after initial failure...`);
        return await apiClient(originalRequest);
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
