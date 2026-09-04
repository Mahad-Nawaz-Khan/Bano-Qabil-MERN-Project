import { Link } from "react-router-dom";
import "./NotFound.css";

export default function NotFound() {
  return (
    <section className="nf">
      <div className="nf-inner">
        <p className="nf-eyebrow">Page Not Found</p>
        <h1 className="nf-code">404</h1>
        <div className="nf-rule" aria-hidden="true">
          <i />
        </div>
        <p className="nf-tagline">
          This table isn&rsquo;t set. The page you&rsquo;re looking for has been
          moved, renamed, or <b>never existed</b>.
        </p>
        <div className="nf-actions">
          <Link className="nf-btn nf-btn-primary" to="/">Return Home</Link>
          <Link className="nf-btn nf-btn-ghost" to="/reservation">Reserve a Table</Link>
        </div>
      </div>
    </section>
  );
}
