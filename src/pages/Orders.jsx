import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { orderApi } from "../services/orderApi.js";
import { formatDate, formatPrice } from "../utils/format.js";
import "./Account.css";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    orderApi.list()
      .then((data) => setOrders(data.data))
      .catch((loadError) => setError(loadError.message))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="account-page">
      <div className="account-card">
        <h1 className="account-title">Your orders</h1>
        <p className="account-subtitle">Every order you have placed with us.</p>

        {error && <div className="alert error">{error}</div>}
        {isLoading && <p className="line-meta">Loading your orders...</p>}

        {!isLoading && orders.length === 0 && !error && (
          <div className="empty-state">
            <h3>No orders yet</h3>
            <p>Your order history will show up here.</p>
            <Link className="btn" to="/" style={{ marginTop: 16 }}>View the menu</Link>
          </div>
        )}

        {orders.map((order) => (
          <div className="order-row" key={order._id}>
            <div>
              <h4>{order.orderNumber}</h4>
              <p className="line-meta">{formatDate(order.createdAt)} · {order.items.length} item{order.items.length === 1 ? "" : "s"}</p>
            </div>
            <span className={`status-pill ${order.status}`}>{order.status}</span>
            <div style={{ textAlign: "right" }}>
              <p className="line-name">{formatPrice(order.total)}</p>
              <Link className="btn link" to={`/orders/${order._id}`}>View details</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
