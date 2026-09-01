const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "The server could not complete this request.");
  }
  return data;
}

export const menuApi = {
  getMenu: () => request("/menu"),
  getCategories: () => request("/categories"),
  createCategory: (payload) => request("/categories", { method: "POST", body: JSON.stringify(payload) }),
  updateCategory: (id, payload) => request(`/categories/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: "DELETE" }),
  getItems: () => request("/menu-items?includeInactive=true"),
  createItem: (payload) => request("/menu-items", { method: "POST", body: JSON.stringify(payload) }),
  updateItem: (id, payload) => request(`/menu-items/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteItem: (id) => request(`/menu-items/${id}`, { method: "DELETE" }),
};
