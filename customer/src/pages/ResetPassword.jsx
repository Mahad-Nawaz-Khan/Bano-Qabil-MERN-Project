import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../services/authApi.js";
import "./Account.css";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    if (password !== confirmation) return setError("Both passwords must match");
    setError("");
    setIsSubmitting(true);
    try {
      const data = await authApi.resetPassword({ token, password });
      navigate("/login", { replace: true, state: { message: data.message } });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="account-page">
      <div className="account-card narrow">
        <h1 className="account-title">Choose a new password</h1>

        {error && <div className="alert error">{error}</div>}
        {!token && <div className="alert error">This reset link is incomplete. Request a new one.</div>}

        {token && (
          <form onSubmit={handleSubmit} noValidate>
            <label className="field">
              <span>New password</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required />
            </label>
            <label className="field">
              <span>Confirm new password</span>
              <input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" required />
            </label>
            <p className="line-meta" style={{ marginBottom: 18 }}>At least 8 characters, including a letter and a number.</p>
            <button className="btn block" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save new password"}
            </button>
          </form>
        )}

        <p className="form-note"><Link to="/forgot-password">Request a new link</Link></p>
      </div>
    </div>
  );
}
