import axios from "axios";

const API_TIMEOUT_MS = 15000;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: API_TIMEOUT_MS,
});

export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;

  if (error.code === "ECONNABORTED" || /timeout/i.test(error.message || "")) {
    return "The request timed out. Please try again.";
  }

  if (!error.response) {
    return "Unable to connect to the server. Please try again.";
  }

  const { status } = error.response;

  if (status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (status === 404) {
    return "The requested resource was not found.";
  }

  if (status >= 500) {
    return "The server encountered an error. Please try again later.";
  }

  const serverMessage = error.response.data?.message;
  if (typeof serverMessage === "string" && serverMessage.trim()) {
    return serverMessage;
  }

  return fallback;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const isAuthRequest =
      url.includes("/auth/login") || url.includes("/auth/register");
    const alreadyOnLogin = window.location.pathname.startsWith("/login");

    if (status === 401 && !isAuthRequest && !alreadyOnLogin) {
      if (unauthorizedHandler) {
        unauthorizedHandler();
      } else {
        try {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        } catch {
          /* localStorage unavailable */
        }
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default api;