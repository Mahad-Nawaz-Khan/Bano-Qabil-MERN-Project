import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { authApi } from "../services/authApi.js";
import { safeNext as toSafeNext } from "../utils/safeNext.js";
import "./Account.css";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const safeNext = toSafeNext(params.get("next"), null);

  const { isAuthenticated, isVerified, refreshUser } = useAuth();
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleVerify() {
    if (!token) return;
    setStatus("verifying");
    try {
      const data = await authApi.verifyEmail(token);
      setStatus("done");
      setMessage(data.message || "Email verified. You can place orders now.");
      if (isAuthenticated) await refreshUser().catch(() => null);
    } catch (error) {
      if (/already verified/i.test(error.message)) {
        await refreshUser().catch(() => null);
        setStatus("done");
        setMessage("Your email address is already verified!");
        return;
      }
      setStatus("failed");
      setMessage(error.message);
    }
  }

  async function resend() {
    setStatus("sending");
    try {
      const data = await authApi.resendVerification(safeNext ? { next: safeNext } : undefined);
      setStatus("sent");
      setMessage(data.message);
    } catch (error) {
      if (/already verified/i.test(error.message)) {
        await refreshUser().catch(() => null);
        setStatus("done");
        setMessage("Your email address is already verified!");
        return;
      }
      setStatus("failed");
      setMessage(error.message);
    }
  }

  return (
    <div className="account-page">
      <div className="account-card narrow">
        <h1 className="account-title">Email verification</h1>

        {status === "verifying" && <p className="account-subtitle">Verifying your email...</p>}
        {status === "done" && <div className="alert success">{message}</div>}
        {status === "failed" && <div className="alert error">{message}</div>}
        {status === "sent" && <div className="alert success">{message}</div>}

        {status !== "done" && !isVerified && (
          <>
            {token ? (
              <>
                <p className="account-subtitle">
                  Click the button below to confirm and verify your email address.
                </p>
                <button
                  className="btn block"
                  type="button"
                  onClick={handleVerify}
                  disabled={status === "verifying"}
                >
                  {status === "verifying" ? "Verifying..." : "Verify email"}
                </button>
              </>
            ) : (
              <>
                <p className="account-subtitle">
                  We need to confirm your email address before you can place an order. Check your inbox for the
                  link, or send yourself a new one.
                </p>
                {isAuthenticated ? (
                  <button className="btn block" type="button" onClick={resend} disabled={status === "sending"}>
                    {status === "sending" ? "Sending..." : "Send a new link"}
                  </button>
                ) : (
                  <p className="form-note"><Link to="/login">Sign in</Link> to request a new link.</p>
                )}
              </>
            )}
          </>
        )}

        {(status === "done" || isVerified) && (
          <div className="form-note" style={{ marginTop: "1.5rem" }}>
            {safeNext && (
              <p>
                <Link to={safeNext} className="btn block" style={{ textDecoration: "none", marginBottom: "0.75rem", display: "inline-block", textAlign: "center" }}>
                  {safeNext.includes("checkout") ? "Proceed to checkout" : "Continue to destination"}
                </Link>
              </p>
            )}
            <p><Link to="/">Back to the menu</Link></p>
          </div>
        )}
      </div>
    </div>
  );
}
