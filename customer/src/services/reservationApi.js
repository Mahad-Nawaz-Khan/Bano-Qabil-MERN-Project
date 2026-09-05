import { request } from "./apiClient.js";
export const reservationApi = {
  create: (body) => request("/reservations", { method: "POST", body }),
  list: () => request("/reservations"),
  cancel: (id) => request(`/reservations/${id}/cancel`, { method: "POST" }),
};
