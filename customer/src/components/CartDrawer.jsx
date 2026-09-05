import { useRef } from "react";
import { Link } from "react-router-dom";
import CartLines from "./CartLines.jsx";
import { useCart } from "../hooks/useCart.js";
import { useModalDialog } from "../hooks/useModalDialog.js";
import { formatPrice } from "../utils/format.js";
import "./CartDrawer.css";

export default function CartDrawer() {
  const { isOpen, closeCart, items, total, count, error, dismissError } = useCart();
  const drawerRef = useRef(null);
  const closeBtnRef = useRef(null);

  useModalDialog({
    isOpen,
    dialogRef: drawerRef,
    initialFocusRef: closeBtnRef,
    onRequestClose: closeCart,
  });

  return (
    <>
      <div className={`drawer-backdrop ${isOpen ? "open" : ""}`} onClick={closeCart} />
      <aside
        ref={drawerRef}
        className={`cart-drawer ${isOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        aria-hidden={!isOpen}
      >
        <header className="cart-drawer-head">
          <h2 id="cart-drawer-title">Your cart ({count})</h2>
          <button
            ref={closeBtnRef}
            type="button"
            className="cart-drawer-close"
            onClick={closeCart}
            aria-label="Close cart"
          >
            &times;
          </button>
        </header>

        <div className="cart-drawer-body">
          {error && (
            <div className="alert error">
              {error} <button type="button" className="btn link" onClick={dismissError}>Dismiss</button>
            </div>
          )}
          {items.length === 0 ? (
            <div className="empty-state">
              <h3>Your cart is empty</h3>
              <p>Pick something from the menu to get started.</p>
            </div>
          ) : (
            <CartLines compact />
          )}
        </div>

        {items.length > 0 && (
          <footer className="cart-drawer-foot">
            <div className="summary-row total"><span>Total</span><span>{formatPrice(total)}</span></div>
            <Link className="btn block" to="/checkout" onClick={closeCart}>Checkout</Link>
            <Link className="btn ghost block" to="/cart" onClick={closeCart}>View full cart</Link>
          </footer>
        )}
      </aside>
    </>
  );
}
