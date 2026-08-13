import axios from "axios";

const API_TIMEOUT_MS = 15000;

const api = axios.create({
  // Dev: relative "/api/v1" goes through the Vite dev proxy to the local backend.
  // Prod (Vercel): default to the deployed backend on Render. Override with VITE_API_URL.
  baseURL:
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
      ? "https://college-erp-dashboard.onrender.com/api/v1"
      : "/api/v1"),
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

// Reads the current access token. "erp_token" is the primary key; "token"
// is kept for legacy sessions created by the older client.
function getAccessToken() {
  try {
    return (
      localStorage.getItem("erp_token") ||
      localStorage.getItem("token") ||
      null
    );
  } catch {
    return null;
  }
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
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
          localStorage.removeItem("erp_token");
          localStorage.removeItem("erp_user");
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