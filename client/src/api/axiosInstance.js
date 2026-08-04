import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Intercept requests to attach Authorization Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "[API Error]",
      error.config?.method?.toUpperCase(),
      error.config?.url,
      "→",
      error.response?.status,
      error.response?.data ?? error.message,
    );
    return Promise.reject(error);
  },
);

export default api;
