const BASE = "/api";

export interface Category {
  id: number;
  name: string;
  slug: string;
  image_url?: string | null;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  image_url?: string | null;
}

export interface Product {
  id: number;
  sku: string | null;
  name: string;
  application: string | null;
  category: Category;
  brand: Brand;
  position: string | null;
  measure: string | null;
  price_pvp: number;
  stock: number;
  image_url: string | null;
  model_name: string | null;
  is_promo: boolean;
  promo_price: number | null;
  promo_ends_at: string | null;
  // admin-only
  price_cost?: number;
  price_cash?: number | null;
  active?: boolean;
  created_at?: string;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface GalleryImage {
  id: number;
  url: string;
  caption: string | null;
  display_order: number;
}

export interface ProductFilters {
  category?: string;
  brand?: string;
  application?: string;
  measure?: string;
  model?: string;
  segment?: string;
  min_price?: number;
  max_price?: number;
  is_promo?: boolean;
  search?: string;
  page?: number;
  per_page?: number;
}

export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("/uploads") ? `/api${url}` : url;
}

function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      q.set(k, String(v));
    }
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

function authHeader(): Record<string, string> {
  const token = localStorage.getItem("tww_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeader(), ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error de red" }));
    throw new Error(err.detail ?? "Error desconocido");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Public ───────────────────────────────────────────────────────────────

export const api = {
  getCategories: () => request<Category[]>("/categories/"),
  getBrands: (category?: string) =>
    request<Brand[]>(`/categories/brands${category ? `?category=${category}` : ""}`),
  getProducts: (filters: ProductFilters = {}) =>
    request<ProductListResponse>(`/products/${buildQuery(filters as Record<string, unknown>)}`),
  getProduct: (id: number) => request<Product>(`/products/${id}`),
  getMeasures: (category?: string, brand?: string) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    const qs = params.toString();
    return request<string[]>(`/products/measures${qs ? `?${qs}` : ""}`);
  },
  getModels: (category?: string, brand?: string) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    const qs = params.toString();
    return request<string[]>(`/products/models${qs ? `?${qs}` : ""}`);
  },
  getPromos: () => request<Product[]>("/products/promos"),
  getGallery: () => request<GalleryImage[]>("/gallery/"),

  // ── Auth ────────────────────────────────────────────────────────────────
  login: (username: string, password: string) =>
    request<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  // ── Admin ───────────────────────────────────────────────────────────────
  admin: {
    getStats: () =>
      request<{ total: number; active: number; no_stock: number; promo: number }>("/admin/stats"),

    getProducts: (params: Record<string, unknown> = {}) =>
      request<ProductListResponse>(`/admin/products${buildQuery(params)}`),

    getModels: (brandId?: number) =>
      request<string[]>(`/admin/models${brandId ? `?brand_id=${brandId}` : ""}`),

    createProduct: (body: Partial<Product>) =>
      request<Product>("/admin/products", { method: "POST", body: JSON.stringify(body) }),

    updateProduct: (id: number, body: Partial<Product>) =>
      request<Product>(`/admin/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),

    deleteProduct: (id: number) =>
      request<void>(`/admin/products/${id}`, { method: "DELETE" }),

    createCategory: (name: string, slug: string, image_url?: string) =>
      request<Category>("/admin/categories", {
        method: "POST",
        body: JSON.stringify({ name, slug, image_url }),
      }),

    updateCategory: (id: number, name: string, slug: string, image_url?: string | null) =>
      request<Category>(`/admin/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name, slug, image_url }),
      }),

    deleteCategory: (id: number) =>
      request<void>(`/admin/categories/${id}`, { method: "DELETE" }),

    createBrand: (name: string, slug: string, image_url?: string) =>
      request<Brand>("/admin/brands", {
        method: "POST",
        body: JSON.stringify({ name, slug, image_url }),
      }),

    updateBrand: (id: number, name: string, slug: string, image_url?: string | null) =>
      request<Brand>(`/admin/brands/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name, slug, image_url }),
      }),

    deleteBrand: (id: number) =>
      request<void>(`/admin/brands/${id}`, { method: "DELETE" }),

    addGalleryImage: (url: string, caption?: string, display_order?: number) =>
      request<GalleryImage>("/admin/gallery", {
        method: "POST",
        body: JSON.stringify({ url, caption, display_order: display_order ?? 0 }),
      }),

    deleteGalleryImage: (id: number) =>
      request<void>(`/admin/gallery/${id}`, { method: "DELETE" }),

    importExcel: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return fetch(`${BASE}/admin/import-excel`, {
        method: "POST",
        headers: authHeader(),
        body: form,
      }).then((r) => r.json());
    },
  },
};
