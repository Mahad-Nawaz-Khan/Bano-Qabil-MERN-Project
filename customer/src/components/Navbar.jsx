import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { useCart } from "../hooks/useCart.js";
import "./Navbar.css";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { count, openCart } = useCart();
  const navigate = useNavigate();
  const accountRef = useRef(null);

  useEffect(() => {
    if (!accountOpen) return undefined;
    const close = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [accountOpen]);

  const closeMenus = () => { setOpen(false); setAccountOpen(false); };

  async function handleLogout() {
    closeMenus();
    await logout();
    navigate("/");
  }

  return (
    <header>
      <nav className="navbar">
        <div className="logo">
          <NavLink to="/">
            <img src="/images/logo.png" alt="Ghalib Restaurant logo" />
          </NavLink>
        </div>

        <ul id="primary-nav" className={`nav-links ${open ? "active" : ""}`}>
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={closeMenus}
              >
                {link.label.toUpperCase()}
              </NavLink>
            </li>
          ))}

          <li>
            <a href="/#con" onClick={closeMenus}>CONTACT US</a>
          </li>

          <li>
            <button
              type="button"
              className="nav-icon-btn"
              onClick={() => { setOpen(false); openCart(); }}
              aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
            >
              CART
              {count > 0 && <span className="cart-badge">{count}</span>}
            </button>
          </li>

          <li className="account-menu" ref={accountRef}>
            {isAuthenticated ? (
              <>
                <button type="button" className="nav-icon-btn" onClick={() => setAccountOpen((prev) => !prev)}>
                  {user.name.split(" ")[0].toUpperCase()} ▾
                </button>
                {accountOpen && (
                  <ul className="account-dropdown">
                    <li><NavLink to="/orders" onClick={closeMenus}>My Orders</NavLink></li>
                    <li><NavLink to="/profile" onClick={closeMenus}>Profile</NavLink></li>
                    <li><button type="button" onClick={handleLogout}>Sign out</button></li>
                  </ul>
                )}
              </>
            ) : (
              <NavLink to="/login" onClick={closeMenus}>SIGN IN</NavLink>
            )}
          </li>

          <li className="reserve-btn">
            <NavLink to="/reservation" onClick={closeMenus}>
              RESERVATION
            </NavLink>
          </li>
        </ul>

        <button
          type="button"
          className="hamburger"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-controls="primary-nav"
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>
    </header>
  );
}
