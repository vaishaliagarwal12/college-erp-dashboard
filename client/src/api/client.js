// Single shared API client. All pages and services go through the same
// axios instance configured in services/api.js (base URL, auth header, 401 handling).
import api from "../services/api";

export default api;
