import { NavLink } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-box">
          <div id="footer-logo">
            <NavLink to="/">
              <img src="/images/logo.png" alt="Ghalib Restaurant logo" />
            </NavLink>
          </div>
          <p className="more-info">
            Ghalib Restaurant, nestled in the heart of bustling downtown,
            invites patrons to indulge in an exquisite culinary journey
            through the flavors of South Asian cuisine.
          </p>
        </div>

        <div className="footer-box">
          <h3 className="footer-title">Quick Links</h3>
          <ul className="footer-links">
            <li><NavLink to="/">Home</NavLink></li>
            <li><NavLink to="/about">About Us</NavLink></li>
            <li><NavLink to="/reservation">Reservation</NavLink></li>
          </ul>
        </div>

        <div className="footer-box" id="con">
          <h3 className="footer-title">Contact Us</h3>
          <p className="more-info">Email: support@ghalib.com</p>
          <p className="more-info">Phone: +92 98765 43210</p>
          <p className="more-info">Location: Rooftop, Habitt Building, Main Tipu Sultan Road, off Shahrah-e-Faisal, Karachi.</p>
          <p className="more-info">Hours: 5:00pm to 12:00am </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} GHALIB Restaurant. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
