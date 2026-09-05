import { useEffect, useState } from "react";
import { reservationApi } from "../services/reservationApi.js";
import "./Account.css";
export default function Reservations() {
  const [items, setItems] = useState([]); const [error, setError] = useState("");
  useEffect(() => { reservationApi.list().then((r) => setItems(r.data)).catch((e) => setError(e.message)); }, []);
  const cancel = async (id) => { try { const r = await reservationApi.cancel(id); setItems((all) => all.map((item) => item._id === id ? r.data : item)); } catch (e) { setError(e.message); } };
  return <div className="account-page"><div className="account-card"><h1 className="account-title">Your reservations</h1>{error && <div className="alert error">{error}</div>}{!items.length && !error && <p className="line-meta">No reservations yet.</p>}{items.map((item) => <div className="order-row" key={item._id}><div><h4>{item.reservationNumber}</h4><p className="line-meta">{item.date} · {item.time} · {item.partySize} guests</p>{item.specialRequests && <p className="line-meta">{item.specialRequests}</p>}</div><span className={`status-pill ${item.status}`}>{item.status}</span>{["pending", "confirmed"].includes(item.status) && <button className="btn link" onClick={() => cancel(item._id)}>Cancel</button>}</div>)}</div></div>;
}
