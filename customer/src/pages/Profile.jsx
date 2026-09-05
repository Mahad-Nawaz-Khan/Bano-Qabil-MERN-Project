import { useState } from "react";
import { useAuth } from "../hooks/useAuth.js";
import { authApi } from "../services/authApi.js";
import "./Account.css";

export default function Profile() {
  const { user, updateProfile, logoutAll } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [feedback, setFeedback] = useState({ profile: "", password: "", error: "" });
  const [busy, setBusy] = useState("");

  async function saveProfile(event) {
    event.preventDefault();
    setBusy("profile");
    setFeedback({ profile: "", password: "", error: "" });
    try {
      await updateProfile({ name });
      setFeedback((prev) => ({ ...prev, profile: "Profile updated" }));
    } catch (error) {
      setFeedback((prev) => ({ ...prev, error: error.message }));
    } finally {
      setBusy("");
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setBusy("password");
    setFeedback({ profile: "", password: "", error: "" });
    try {
      const data = await authApi.changePassword(passwords);
      setPasswords({ currentPassword: "", newPassword: "" });
      setFeedback((prev) => ({ ...prev, password: data.message }));
    } catch (error) {
      setFeedback((prev) => ({ ...prev, error: error.message }));
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="account-page">
      <div className="account-card narrow">
        <h1 className="account-title">Your profile</h1>
        <p className="account-subtitle">{user?.email}</p>

        {feedback.error && <div className="alert error">{feedback.error}</div>}
        {feedback.profile && <div className="alert success">{feedback.profile}</div>}
        <form onSubmit={saveProfile} noValidate>
          <label className="field">
            <span>Full name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
          </label>
          <button className="btn block" type="submit" disabled={busy === "profile"}>
            {busy === "profile" ? "Saving..." : "Save profile"}
          </button>
        </form>

        <h2 className="account-title" style={{ fontSize: "1.3rem", marginTop: 34 }}>Change password</h2>
        {feedback.password && <div className="alert success">{feedback.password}</div>}
        <form onSubmit={savePassword} noValidate>
          <label className="field">
            <span>Current password</span>
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={(event) => setPasswords((prev) => ({ ...prev, currentPassword: event.target.value }))}
              autoComplete="current-password"
              required
            />
          </label>
          <label className="field">
            <span>New password</span>
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(event) => setPasswords((prev) => ({ ...prev, newPassword: event.target.value }))}
              autoComplete="new-password"
              required
            />
          </label>
          <button className="btn block" type="submit" disabled={busy === "password"}>
            {busy === "password" ? "Updating..." : "Update password"}
          </button>
        </form>

        <h2 className="account-title" style={{ fontSize: "1.3rem", marginTop: 34 }}>Sessions</h2>
        <p className="line-meta" style={{ marginBottom: 14 }}>
          Signs you out on every device, including this one.
        </p>
        <button type="button" className="btn ghost block" onClick={() => logoutAll()}>
          Sign out everywhere
        </button>
      </div>
    </div>
  );
}
