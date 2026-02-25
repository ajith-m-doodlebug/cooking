import axios, { type AxiosError } from "axios";
import { useAuthStore } from "./auth-store";

const baseURL =
  typeof process.env.NEXT_PUBLIC_API_BASE_URL !== "undefined"
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : "http://localhost:8001";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (token: string | null, err: unknown = null) => {
  failedQueue.forEach((p) => (err ? p.reject(err) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().tokens?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken =
      useAuthStore.getState().tokens?.refresh_token ??
      useAuthStore.getState().getStoredRefreshToken();

    if (!refreshToken) {
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    return api
      .post<{ access_token: string; refresh_token: string; token_type: string }>(
        "/auth/refresh",
        { refresh_token: refreshToken }
      )
      .then((res) => {
        const { access_token, refresh_token } = res.data;
        useAuthStore.getState().setTokens({
          access_token,
          refresh_token,
          token_type: "bearer",
        });
        useAuthStore.getState().setStoredRefreshToken(refresh_token);
        processQueue(access_token);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return api(originalRequest);
      })
      .catch((err) => {
        processQueue(null, err);
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(err);
      })
      .finally(() => {
        isRefreshing = false;
      });
  }
);

export default api;
