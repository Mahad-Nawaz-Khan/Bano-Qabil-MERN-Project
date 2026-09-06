import { Layout, Typography } from "antd";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import "./MenuAdmin.css";
import "./AdminLayout.css";

const { Header, Content } = Layout;
const { Text } = Typography;

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <Layout className="admin-layout">
      <Header className="admin-header">
        <div className="admin-nav">
          <Link to="/" className="brand">GHALIB <span>ADMIN</span></Link>
          <NavLink to="/" end className={({ isActive }) => (isActive ? "admin-nav-link active" : "admin-nav-link")}>Menu</NavLink>
          <NavLink to="/orders" className={({ isActive }) => (isActive ? "admin-nav-link active" : "admin-nav-link")}>Orders</NavLink>
          <NavLink to="/reservations" className={({ isActive }) => (isActive ? "admin-nav-link active" : "admin-nav-link")}>Reservations</NavLink>
        </div>
        <div className="admin-nav">
          <Text className="admin-user">{user?.name}</Text>
          <button type="button" className="admin-signout" onClick={() => logout()}>Sign out</button>
        </div>
      </Header>
      <Content className="admin-content">
        <Outlet />
      </Content>
    </Layout>
  );
}
