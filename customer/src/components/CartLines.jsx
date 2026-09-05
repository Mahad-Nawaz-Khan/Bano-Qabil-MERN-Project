import { useCart } from "../hooks/useCart.js";
import { formatPrice } from "../utils/format.js";

export default function CartLines({ compact = false }) {
  const { items, isLoading, maxQuantity, updateQuantity, removeItem } = useCart();

  return (
    <div className="line-list">
      {items.map((line) => (
        <div className="line-item" key={line.menuItem}>
          <img
            src={line.image || "/images/logo.png"}
            alt={line.name}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = "/images/logo.png";
            }}
          />
          <div>
            <p className="line-name">{line.name}</p>
            <p className="line-meta">{formatPrice(line.unitPrice)} each</p>
            {!compact && <p className="line-meta">Line total {formatPrice(line.lineTotal)}</p>}
          </div>
          <div className="line-actions">
            <div className="qty">
              <button
                type="button"
                aria-label={`Decrease ${line.name}`}
                disabled={isLoading || line.quantity <= 1}
                onClick={() => updateQuantity(line.menuItem, line.quantity - 1).catch(() => null)}
              >
                −
              </button>
              <span>{line.quantity}</span>
              <button
                type="button"
                aria-label={`Increase ${line.name}`}
                disabled={isLoading || line.quantity >= maxQuantity}
                onClick={() => updateQuantity(line.menuItem, line.quantity + 1).catch(() => null)}
              >
                +
              </button>
            </div>
            <button
              type="button"
              className="btn link"
              disabled={isLoading}
              onClick={() => removeItem(line.menuItem).catch(() => null)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
