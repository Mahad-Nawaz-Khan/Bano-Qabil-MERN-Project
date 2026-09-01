import "./Card.css";

export default function Card({ item, onOrder }) {
  return (
    <div className="product-card">
      <img
        className="card-img"
        src={item.img}
        alt={item.name}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "/images/logo.png";
        }}
      />
      <h3>{item.name}</h3>
      <p>Rs {item.price}</p>
      <button className="order" onClick={() => onOrder(item)}>
        Order Now
      </button>
    </div>
  );
}
