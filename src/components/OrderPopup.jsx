import "./OrderPopup.css";

export default function OrderPopup({ item, onClose }) {
  if (!item) return null;

  return (
    <div className="popup" onClick={onClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-btn" onClick={onClose}>
          &times;
        </span>
        <div className="popup-grid">
          <img
            className="popup-img"
            src={item.img}
            alt={item.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/images/logo.png";
            }}
          />
          <div>
            <h2>{item.name}</h2>
            <h3>Rs {item.price}</h3>
            {item.desc && <p>{item.desc}</p>}
            <button className="order-btn" onClick={onClose}>
              Confirm Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
