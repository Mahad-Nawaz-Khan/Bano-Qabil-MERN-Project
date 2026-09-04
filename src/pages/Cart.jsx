import { Link } from "react-router-dom";
import CartLines from "../components/CartLines.jsx";
import { useCart } from "../hooks/useCart.js";
import { formatPrice } from "../utils/format.js";
import "./Account.css";

export default function Cart() {
  const { items, subtotal, total, count, error, dismissError, clear, isLoading } = useCart();

  return (
    <div className="account-page">
      <div className="account-card">
        <h1 className="account-title">Your cart</h1>
        <p className="account-subtitle">{count} item{count === 1 ? "" : "s"} ready to go.</p>

        {error && (
          <div className="alert error">
            {error} <button type="button" className="btn link" onClick={dismissError}>Dismiss</button>
          </div>
        )}

        {items.length === 0 ? (
          <div className="empty-state">
            <h3>Nothing here yet</h3>
            <p>Browse the menu and add something you like.</p>
            <Link className="btn" to="/" style={{ marginTop: 16 }}>View the menu</Link>
          </div>
        ) : (
          <>
            <CartLines />
            <div className="summary">
              <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <div className="summary-row total"><span>Total</span><span>{formatPrice(total)}</span></div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
              <Link className="btn" to="/checkout">Proceed to checkout</Link>
              <button type="button" className="btn ghost" disabled={isLoading} onClick={() => clear().catch(() => null)}>
                Empty cart
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
