import axios from "axios";

// One Axios instance for the whole app. The base URL comes from frontend/.env (VITE_API_URL).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token is rejected (expired/invalid), log the user out everywhere.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthForm = url.includes("/auth/login") || url.includes("/auth/register");
    if (error.response?.status === 401 && !isAuthForm) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(error);
  }
);

export default api;
