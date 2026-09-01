import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header>
      <nav className="navbar">
        <div className="logo">
          <NavLink to="/">
            <img src="/images/logo.png" alt="Ghalib Restaurant logo" />
          </NavLink>
        </div>

        <ul className={`nav-links ${open ? "active" : ""}`}>
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={() => setOpen(false)}
              >
                {link.label.toUpperCase()}
              </NavLink>
            </li>
          ))}
          <li className="reserve-btn">
            <NavLink to="/reservation" onClick={() => setOpen(false)}>
              RESERVATION
            </NavLink>
          </li>
        </ul>

        <div
          className="hamburger"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
      </nav>
    </header>
  );
}
