import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URI } from './uri';
import { router } from 'expo-router';

const axiosInstance = axios.create({
  baseURL: SERVER_URI,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.request.use(
  async (config) => {
    const accessToken = await AsyncStorage.getItem('access_token');
    if (accessToken) {
      config.headers['access-token'] = accessToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['access-token'] = token;
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error("No refresh token");

        // THE FIX: Use a completely separate axios instance for the refresh call.
        // This prevents any potential loops or header conflicts with the main instance.
        const refreshAxios = axios.create();
        const res = await refreshAxios.get(`${SERVER_URI}/refresh`, {
          headers: { 'refresh-token': refreshToken },
        });

        const { accessToken, refreshToken: newRefreshToken } = res.data;
        await AsyncStorage.setItem('access_token', accessToken);
        await AsyncStorage.setItem('refresh_token', newRefreshToken);
        
        axiosInstance.defaults.headers.common['access-token'] = accessToken;
        originalRequest.headers['access-token'] = accessToken;
        
        processQueue(null, accessToken);
        return axiosInstance(originalRequest);

      } catch (refreshError: any) {
        processQueue(refreshError, null);
        console.log("Session refresh failed. Logging out.");
        await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
        router.replace("/(routes)/login"); // Redirect to login
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;