import { useEffect, useState } from "react";
import Card from "../components/Card.jsx";
import OrderPopup from "../components/OrderPopup.jsx";
import { menuData } from "../data/menuData.js";
import { menuApi } from "../services/menuApi.js";
import "./Home.css";

export default function Home() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [menu, setMenu] = useState(menuData);

  useEffect(() => {
    menuApi.getMenu()
      .then((response) => setMenu(response.data))
      .catch(() => {
        // The restaurant can still show its bundled menu while the API is not configured.
      });
  }, []);

  return (
    <>
      <div className="heading">
        <p>Welcome To The GHALIB Restaurant</p>
        <p>Experience Culinary Excellence</p>
        <a href="#platters">
          <button className="menu-btn">View Our Menu</button>
        </a>
      </div>

      <div className="main-container">
        {menu.map((section) => (
          <section
            key={section.category}
            id={section.category.toLowerCase().replace(/\s+/g, "-")}
          >
            <div className="banner">
              <h2 className="category-title">{section.category}</h2>
            </div>
            <div className="plater-con">
              {section.items.map((item) => (
                <Card key={item.name} item={item} onOrder={setSelectedItem} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <OrderPopup item={selectedItem} onClose={() => setSelectedItem(null)} />
    </>
  );
}
