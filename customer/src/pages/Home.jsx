import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card.jsx";
import OrderPopup from "../components/OrderPopup.jsx";
import { menuData } from "../data/menuData.js";
import { menuApi } from "../services/menuApi.js";
import "./Home.css";

// Mirrors Category.js so bundled sections get the same ids the API would send.
const toSlug = (value) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Each strip already contains the category word, so the <h2> beside it is sr-only.
const CATEGORY_BANNERS = {
  platters: "/images/Platters.png",
  mutton: "/images/mutton%20logo.png",
  chicken: "/images/chicken-logo.png",
  fish: "/images/fish-logo.png",
  "grill-bbq": "/images/grill-logo.png",
  "istanbul-specials": "/images/Stanbul-logo.png",
  "hot-appetizers": "/images/Hot-Appe-logo.png",
  dessert: "/images/Dessert-logo.png",
  bread: "/images/Breads-logo.png",
  beverages: "/images/Beverages-logo.png",
};

function MenuSection({ section, onOrder }) {
  const [bannerFailed, setBannerFailed] = useState(false);
  const slug = section.slug || toSlug(section.category);
  const headingId = `cat-${slug}`;
  // Admin-created categories have no artwork, and a 404 must not leave an
  // untitled section behind — both fall back to the lettered banner.
  const artwork = bannerFailed ? null : CATEGORY_BANNERS[slug];

  return (
    <section id={slug} aria-labelledby={headingId}>
      <div className={artwork ? "banner" : "banner banner--text"}>
        <h2 id={headingId} className={artwork ? "sr-only" : "category-title"}>
          {section.category}
        </h2>
        {artwork && (
          <img
            className="banner-img"
            src={artwork}
            alt=""
            width="1000"
            height="300"
            loading="lazy"
            decoding="async"
            onError={() => setBannerFailed(true)}
          />
        )}
      </div>

      <div className="plater-con">
        {section.items.map((item, index) => (
          <Card
            key={item._id || item.name}
            item={item}
            onOrder={onOrder}
            revealSide={index % 2 === 0 ? "left" : "right"}
            revealDelay={index}
          />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [menu, setMenu] = useState(menuData);

  useEffect(() => {
    menuApi.getMenu()
      .then((response) => {
        // Only replace the bundled menu when the API actually has items.
        // An empty database (not yet seeded) returns { data: [] } with HTTP 200,
        // which would wipe the static menu if we set it unconditionally.
        if (response.data?.length) setMenu(response.data);
      })
      .catch(() => {
        // The restaurant can still show its bundled menu while the API is not configured.
      });
  }, []);

  return (
    <>
      <section className="hero" aria-labelledby="hero-wordmark">
        <img
          className="hero-photo"
          src="/images/gal%20bg.png"
          alt=""
          width="1536"
          height="1024"
          fetchpriority="high"
          decoding="async"
        />

        <div className="hero-inner">
          <p className="hero-eyebrow">Arabian &amp; Turkish Fine Dining</p>

          <h1 className="hero-wordmark" id="hero-wordmark">GHALIB</h1>

          <div className="hero-rule" aria-hidden="true"><i /></div>

          <p className="hero-tagline">
            Charcoal-grilled kababs, slow-cooked mandi and{" "}
            <b>Istanbul specials</b> &mdash; served under the lanterns.
          </p>

          <div className="hero-actions">
            <a className="hero-btn hero-btn-primary" href="#menu">View Our Menu</a>
            <Link className="hero-btn hero-btn-ghost" to="/reservation">Reserve a Table</Link>
          </div>
        </div>
      </section>

      <div className="heading">
        <p>Welcome To The GHALIB Restaurant</p>
        <p>Experience Culinary Excellence</p>
        <a className="menu-btn" href="#menu">View Our Menu</a>
      </div>

      <div className="menu-area" id="menu">
        <div className="main-container">
          {menu.map((section) => (
            <MenuSection
              key={section.slug || section.category}
              section={section}
              onOrder={setSelectedItem}
            />
          ))}
        </div>
      </div>

      <OrderPopup item={selectedItem} onClose={() => setSelectedItem(null)} />
    </>
  );
}
