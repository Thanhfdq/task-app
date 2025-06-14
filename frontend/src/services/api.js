import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api", // backend server
  withCredentials: true, // if using cookies/session
});

export default api;
