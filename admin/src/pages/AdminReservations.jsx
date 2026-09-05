import { useEffect, useState } from "react";
import { Alert, Button, Card, Select, Space, Table, Tag, Typography } from "antd";
import { reservationApi } from "../services/reservationApi.js";
import "./MenuAdmin.css";
const { Title, Text } = Typography;
const statuses = ["pending", "confirmed", "cancelled", "completed"];
export default function AdminReservations() {
  const [items, setItems] = useState([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); reservationApi.listAll().then((r) => { setItems(r.data); setError(""); }).catch((e) => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(load, []);
  const update = async (item, status) => { try { const r = await reservationApi.updateStatus(item._id, status); setItems((all) => all.map((row) => row._id === item._id ? r.data : row)); } catch (e) { setError(e.message); } };
  const columns = [{ title: "Reference", dataIndex: "reservationNumber" }, { title: "Guest", render: (_, r) => <div><strong>{r.name}</strong><br /><Text type="secondary">{r.email}<br />{r.phone}</Text></div> }, { title: "Slot", render: (_, r) => `${r.date} · ${r.time}` }, { title: "Guests", dataIndex: "partySize" }, { title: "Requests", dataIndex: "specialRequests", render: (v) => v || "—" }, { title: "Status", render: (_, r) => <Space><Tag>{r.status}</Tag><Select value={r.status} style={{ width: 120 }} options={statuses.map((s) => ({ value: s, label: s }))} onChange={(value) => update(r, value)} /></Space> }];
  return <><div className="admin-title"><div><Text className="eyebrow">RESTAURANT CONTROL</Text><Title level={2}>Reservations</Title><Text type="secondary">Confirm and manage table bookings.</Text></div><Button onClick={load}>Refresh</Button></div>{error && <Alert type="warning" showIcon message={error} /> }<Card className="admin-table-card"><Table rowKey="_id" loading={loading} columns={columns} dataSource={items} scroll={{ x: 900 }} /></Card></>;
}
