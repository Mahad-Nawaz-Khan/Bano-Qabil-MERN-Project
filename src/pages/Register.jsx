import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { safeNext } from "../utils/safeNext.js";
import "./Account.css";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const data = await register(form);
      navigate(next, { replace: true, state: { message: data.message } });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="account-page">
      <div className="account-card narrow">
        <h1 className="account-title">Create your account</h1>
        <p className="account-subtitle">One account for ordering and tracking your food.</p>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Full name</span>
            <input value={form.name} onChange={update("name")} autoComplete="name" required />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={update("email")} autoComplete="email" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={form.password} onChange={update("password")} autoComplete="new-password" required />
          </label>
          <p className="line-meta" style={{ marginBottom: 18 }}>At least 6 characters, including a letter and a number.</p>
          <button className="btn block" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="form-note">Already have an account? <Link to={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link></p>
      </div>
    </div>
  );
}
