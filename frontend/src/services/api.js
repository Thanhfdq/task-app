import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // backend server
  withCredentials: true, // if using cookies/session
});

export default api;
