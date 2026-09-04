import { useEffect, useRef, useState } from "react";
import { useCart } from "../hooks/useCart.js";
import "./Card.css";

const FALLBACK_IMAGE = "/images/logo.png";

// The bundled menu stores prices as formatted strings, the database as integers.
const formatPrice = (value) =>
  typeof value === "number" ? value.toLocaleString("en-PK") : value;

export default function Card({ item, onOrder }) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const addedTimer = useRef(null);

  // Cards remount when the API menu replaces the bundled one, so the
  // confirmation timer has to be cancelled on the way out.
  useEffect(() => () => clearTimeout(addedTimer.current), []);

  // addItem throws for items without an _id, which is every item in the
  // offline fallback menu — offer the shortcut only when it can succeed.
  const canQuickAdd = Boolean(item._id);
  const rawImage = item.img || item.image || "";
  const showFallback = imageFailed || !rawImage;

  async function handleAdd() {
    setIsAdding(true);
    setError("");
    try {
      await addItem(item);
      setAdded(true);
      clearTimeout(addedTimer.current);
      addedTimer.current = setTimeout(() => setAdded(false), 1600);
    } catch (err) {
      setError(err.message || "Could not add to cart");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="product-card">
      <div className="card-media">
        <img
          className={showFallback ? "card-img card-img--fallback" : "card-img"}
          src={showFallback ? FALLBACK_IMAGE : rawImage}
          alt={item.name}
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      </div>

      {canQuickAdd && (
        <button
          type="button"
          className={added ? "quick-add is-added" : "quick-add"}
          onClick={handleAdd}
          disabled={isAdding}
          aria-label={`Add one ${item.name} to cart`}
        >
          <span aria-hidden="true">{added ? "✓" : "+"}</span>
        </button>
      )}

      <h3>{item.name}</h3>
      <p className="card-price">Rs {formatPrice(item.price)}</p>
      {/* Always present: appearing on demand would reflow the whole grid row. */}
      <p className="card-error">{error}</p>

      <div className="card-actions">
        <button type="button" className="order" onClick={() => onOrder(item)}>
          Order Now
        </button>
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {added ? `${item.name} added to cart` : ""}
      </span>
    </div>
  );
}
