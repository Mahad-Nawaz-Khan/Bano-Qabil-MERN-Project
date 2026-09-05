import { request } from "./apiClient.js";

export const menuApi = {
  getMenu: () => request("/menu"),
  getCategories: () => request("/categories"),
  createCategory: (payload) => request("/categories", { method: "POST", body: payload }),
  updateCategory: (id, payload) => request(`/categories/${id}`, { method: "PATCH", body: payload }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: "DELETE" }),
  getItems: () => request("/menu-items?includeInactive=true"),
  uploadImage: (file) => {
    const body = new FormData();
    body.append("image", file);
    return request("/menu-images", { method: "POST", body });
  },
  createItem: (payload) => request("/menu-items", { method: "POST", body: payload }),
  updateItem: (id, payload) => request(`/menu-items/${id}`, { method: "PATCH", body: payload }),
  deleteItem: (id) => request(`/menu-items/${id}`, { method: "DELETE" }),
};
