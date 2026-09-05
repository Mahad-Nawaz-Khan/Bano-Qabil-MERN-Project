import { request } from "./apiClient.js";
export const reservationApi = { listAll: () => request("/reservations/admin/all"), updateStatus: (id, status) => request(`/reservations/${id}/status`, { method: "PATCH", body: { status } }) };
