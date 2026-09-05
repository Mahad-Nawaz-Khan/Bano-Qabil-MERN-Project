import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../services/authApi.js";
import "./Account.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const data = await authApi.forgotPassword({ email });
      setMessage(data.message);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="account-page">
      <div className="account-card narrow">
        <h1 className="account-title">Reset your password</h1>
        <p className="account-subtitle">Enter your email and we will send you a reset link.</p>

        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        {!message && (
          <form onSubmit={handleSubmit} noValidate>
            <label className="field">
              <span>Email</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            </label>
            <button className="btn block" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <p className="form-note"><Link to="/login">Back to sign in</Link></p>
      </div>
    </div>
  );
}
