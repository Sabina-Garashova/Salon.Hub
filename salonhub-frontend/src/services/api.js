import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:7289/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const lang = localStorage.getItem("language") || "az";
  config.headers["Accept-Language"] = lang;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      const protectedPaths = ["/dashboard", "/admin", "/employee-dashboard", "/loyalty"];
      const isOnProtectedPage = protectedPaths.some((p) => window.location.pathname.startsWith(p));
      if (isOnProtectedPage) {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);

export default api;


