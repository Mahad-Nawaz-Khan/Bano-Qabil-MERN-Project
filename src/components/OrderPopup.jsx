import { useEffect, useRef, useState } from "react";
import { useCart } from "../hooks/useCart.js";
import { useModalDialog } from "../hooks/useModalDialog.js";
import "./OrderPopup.css";

export default function OrderPopup({ item, onClose }) {
  const { addItem, maxQuantity } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (item) {
      setQuantity(1);
      setError("");
    }
  }, [item]);

  const guardedClose = () => {
    if (isAdding) return;
    onClose();
  };

  useModalDialog({
    isOpen: Boolean(item),
    dialogRef,
    initialFocusRef: closeBtnRef,
    onRequestClose: guardedClose,
  });

  if (!item) return null;

  async function handleAdd() {
    setError("");
    setIsAdding(true);
    try {
      await addItem(item, quantity);
      setQuantity(1);
      onClose();
    } catch (addError) {
      setError(addError.message);
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="popup" onClick={guardedClose}>
      <div
        className="popup-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-title"
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          ref={closeBtnRef}
          className="close-btn"
          onClick={guardedClose}
          disabled={isAdding}
          aria-label="Close dialog"
        >
          &times;
        </button>
        <div className="popup-grid">
          <img
            className="popup-img"
            src={item.img || item.image || "/images/logo.png"}
            alt={item.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/images/logo.png";
            }}
          />
          <div>
            <h2 id="popup-title">{item.name}</h2>
            <h3>Rs {item.price}</h3>
            {(item.description || item.desc) && <p>{item.description || item.desc}</p>}
            {error && (
              <p className="popup-error" role="alert">
                {error}
              </p>
            )}
            <div className="popup-qty">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || isAdding}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={quantity >= maxQuantity || isAdding}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button className="order-btn" onClick={handleAdd} disabled={isAdding}>
              {isAdding ? "Adding..." : "Add to cart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
