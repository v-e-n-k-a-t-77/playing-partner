import axios from 'axios';

const api = axios.create({
  baseURL: 'https://playing-partner.onrender.com/api',
  withCredentials: true,
});

// This function will be set by AuthContext so axios can update the token
let onTokenRefreshed = null;
export const setOnTokenRefreshed = (callback) => {
  onTokenRefreshed = callback;
};

let accessToken = null;
export const setAccessToken = (token) => {
  accessToken = token;
};

// Attach the current access token to every outgoing request
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// If a request fails because the token expired, try refreshing once, then retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(
          'http://localhost:5000/api/auth/refresh',
          {},
          { withCredentials: true }
        );
        const newToken = res.data.accessToken;
        setAccessToken(newToken);
        if (onTokenRefreshed) onTokenRefreshed(newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;