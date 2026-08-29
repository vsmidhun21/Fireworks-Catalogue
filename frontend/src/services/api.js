import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rr_admin_token");
  if (token && config.url?.includes("/admin")) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.message || "Something went wrong. Please try again.";
    return Promise.reject({ ...err, message });
  }
);

// ---------- Public ----------
export const CategoryService = {
  list: () => api.get("/categories"),
  bySlug: (slug) => api.get(`/categories/${slug}`),
};

export const ProductService = {
  list: (params) => api.get("/products", { params }),
  featured: () => api.get("/products/featured"),
  bySlug: (slug) => api.get(`/products/${slug}`),
};

export const SettingsService = {
  public: () => api.get("/settings/public"),
};

export const EstimateService = {
  submit: (payload) => api.post("/estimates", payload),
  byNumber: (num) => api.get(`/estimates/${num}`),
};

// ---------- Admin ----------
export const AdminAuthService = {
  login: (username, password) => api.post("/admin/auth/login", { username, password }),
  me: () => api.get("/admin/auth/me"),
  logout: () => api.post("/admin/auth/logout"),
};

export const AdminDashboardService = {
  get: () => api.get("/admin/dashboard"),
};

export const AdminCategoryService = {
  list: () => api.get("/admin/categories"),
  create: (data) => api.post("/admin/categories", data),
  update: (id, data) => api.put(`/admin/categories/${id}`, data),
  setStatus: (id, isActive) => api.patch(`/admin/categories/${id}/status`, { isActive }),
  remove: (id) => api.delete(`/admin/categories/${id}`),
};

export const AdminProductService = {
  list: (params) => api.get("/admin/products", { params }),
  get: (id) => api.get(`/admin/products/${id}`),
  create: (data) => api.post("/admin/products", data),
  update: (id, data) => api.put(`/admin/products/${id}`, data),
  setStatus: (id, isActive) => api.patch(`/admin/products/${id}/status`, { isActive }),
  setFeatured: (id, isFeatured) => api.patch(`/admin/products/${id}/featured`, { isFeatured }),
  remove: (id) => api.delete(`/admin/products/${id}`),
};

export const AdminEstimateService = {
  list: (params) => api.get("/admin/estimates", { params }),
  get: (id) => api.get(`/admin/estimates/${id}`),
  setStatus: (id, status) => api.patch(`/admin/estimates/${id}/status`, { status }),
  setNotes: (id, adminNotes) => api.patch(`/admin/estimates/${id}/notes`, { adminNotes }),
};

export const AdminCustomerService = {
  list: () => api.get("/admin/customers"),
  get: (id) => api.get(`/admin/customers/${id}`),
};

export const AdminSettingsService = {
  get: () => api.get("/admin/settings"),
  update: (data) => api.put("/admin/settings", data),
};

export default api;
