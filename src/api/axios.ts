import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
});

api.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      // İstersen otomatik logout veya login sayfasına yönlendirme
      // localStorage.clear();
      // window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
