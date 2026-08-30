import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  headers: { "Content-Type": "application/json" },
});

export const API_BASE_URL = api.defaults.baseURL.replace(/\/api\/v1\/?$/, "");

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rr_admin_token");
  if (token && config.url?.includes("/admin")) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
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

export const PromotionService = {
  list: (params) => api.get("/promotions", { params }),
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
  list: (params) => api.get("/admin/categories", { params }),
  create: (data) => api.post("/admin/categories", data),
  update: (id, data) => api.put(`/admin/categories/${id}`, data),
  setStatus: (id, isActive) => api.patch(`/admin/categories/${id}/status`, { isActive }),
  remove: (id) => api.delete(`/admin/categories/${id}`),
};

export const AdminProductService = {
  list: (params) => api.get("/admin/products", { params }),
  get: (id) => api.get(`/admin/products/${id}`),
  create: (data) => api.post("/admin/products", toProductFormData(data)),
  update: (id, data) => api.put(`/admin/products/${id}`, toProductFormData(data)),
  setStatus: (id, isActive) => api.patch(`/admin/products/${id}/status`, { isActive }),
  setFeatured: (id, isFeatured) => api.patch(`/admin/products/${id}/featured`, { isFeatured }),
  remove: (id) => api.delete(`/admin/products/${id}`),
};

function toProductFormData(data) {
  const formData = new FormData();
  Object.entries(data || {}).forEach(([key, value]) => {
    if (value === undefined || key === "imageFile" || key === "image") return;
    if (value === null) {
      formData.append(key, "");
      return;
    }
    formData.append(key, value);
  });
  const imageFile = data?.imageFile ?? data?.image;
  if (imageFile instanceof File || imageFile instanceof Blob) {
    formData.append("image", imageFile);
  }
  return formData;
}

export const AdminEstimateService = {
  list: (params) => api.get("/admin/estimates", { params }),
  get: (id) => api.get(`/admin/estimates/${id}`),
  setStatus: (id, status) => api.patch(`/admin/estimates/${id}/status`, { status }),
  setNotes: (id, adminNotes) => api.patch(`/admin/estimates/${id}/notes`, { adminNotes }),
};

export const AdminCustomerService = {
  list: (params) => api.get("/admin/customers", { params }),
  get: (id) => api.get(`/admin/customers/${id}`),
};

export const AdminSettingsService = {
  get: () => api.get("/admin/settings"),
  update: (data) => api.put("/admin/settings", data),
  uploadLogo: (file) => {
    const formData = new FormData();
    formData.append("logo", file);
    return api.post("/admin/settings/logo", formData);
  },
};

export const AdminPromotionService = {
  list: (params) => api.get("/admin/promotions", { params }),
  create: (data) => api.post("/admin/promotions", toPromotionFormData(data)),
  update: (id, data) => api.put(`/admin/promotions/${id}`, toPromotionFormData(data)),
  setStatus: (id, isActive) => api.patch(`/admin/promotions/${id}/status`, { isActive }),
  remove: (id) => api.delete(`/admin/promotions/${id}`),
};

function toPromotionFormData(data) {
  const formData = new FormData();
  Object.entries(data || {}).forEach(([key, value]) => {
    if (value === undefined || key === "imageFile" || key === "image") return;
    if (value === null) {
      formData.append(key, "");
      return;
    }
    formData.append(key, value);
  });
  const imageFile = data?.imageFile ?? data?.image;
  if (imageFile instanceof File || imageFile instanceof Blob) {
    formData.append("image", imageFile);
  }
  return formData;
}

export default api;
