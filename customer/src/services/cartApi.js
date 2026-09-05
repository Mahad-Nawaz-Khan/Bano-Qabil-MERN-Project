import { request } from "./apiClient.js";

export const cartApi = {
  get: () => request("/cart"),
  addItem: (menuItem, quantity = 1) => request("/cart/items", { method: "POST", body: { menuItem, quantity } }),
  updateItem: (menuItem, quantity) => request(`/cart/items/${menuItem}`, { method: "PATCH", body: { quantity } }),
  removeItem: (menuItem) => request(`/cart/items/${menuItem}`, { method: "DELETE" }),
  clear: () => request("/cart", { method: "DELETE" }),
  merge: (items) => request("/cart/merge", { method: "POST", body: { items } }),
};
