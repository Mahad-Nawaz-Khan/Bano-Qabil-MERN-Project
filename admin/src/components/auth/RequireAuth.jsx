import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "../../hooks/useAuth.js";

const Loading = () => <div className="page-loader"><Spin size="large" /></div>;

export function RequireAuth() {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();
  if (isInitializing) return <Loading />;
  if (!isAuthenticated) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return <Outlet />;
}

export function RequireVerified() {
  const { isVerified, isInitializing } = useAuth();
  const location = useLocation();
  if (isInitializing) return <Loading />;
  if (!isVerified) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/verify-email?next=${next}`} replace />;
  }
  return <Outlet />;
}

export function RequireAdmin({ loginPath = "/login" }) {
  const { isAuthenticated, isAdmin, isInitializing } = useAuth();
  if (isInitializing) return <Loading />;
  if (!isAuthenticated) return <Navigate to={loginPath} replace />;
  // A signed-in customer is told plainly rather than bounced back to a login form they already passed.
  if (!isAdmin) {
    return (
      <div className="page-loader">
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <h2>Not authorised</h2>
          <p>This area is limited to restaurant staff.</p>
        </div>
      </div>
    );
  }
  return <Outlet />;
}
