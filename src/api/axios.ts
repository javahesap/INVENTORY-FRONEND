import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080", // backend adresin
  withCredentials: false,
});

// İsteklere token ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401/403 yakala → oturum düşür
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      // Küçük bir işaret bırak, Provider logout yapabilsin
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    return Promise.reject(err);
  }
);

export default api;
