import axios from "axios";
import {createBrowserHistory} from "history";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // backend server
  withCredentials: true, // if using cookies/session
});

const history = createBrowserHistory();

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Remove user from sessionStorage if unauthorized
      sessionStorage.removeItem('user');
      // Redirect to login page if unauthorized
      history.replace('/auth');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;
