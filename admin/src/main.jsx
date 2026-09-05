import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { App as AntApp, ConfigProvider, theme } from "antd";
import "antd/dist/reset.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { RequireAdmin } from "./components/auth/RequireAuth.jsx";
import AdminLayout from "./pages/AdminLayout.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminOrders from "./pages/AdminOrders.jsx";
import MenuAdmin from "./pages/MenuAdmin.jsx";
import "./index.css";

const adminTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
    colorPrimary: "#cdb894",
    colorPrimaryHover: "#dfceb0",
    colorPrimaryActive: "#bda57d",
    colorBgBase: "#071a1b",
    colorBgContainer: "rgba(10, 32, 33, 0.85)",
    colorBgElevated: "#0c2829",
    colorBgLayout: "#061818",
    colorBorder: "rgba(205, 184, 148, 0.2)",
    colorBorderSecondary: "rgba(205, 184, 148, 0.12)",
    colorText: "#f4ecdd",
    colorTextSecondary: "#9db0ae",
    colorTextTertiary: "#768c89",
    colorTextHeading: "#fbf6ec",
    colorLink: "#cdb894",
    colorLinkHover: "#ebdcc0",
    colorLinkActive: "#bda57d",
    colorSuccess: "#62ab73",
    colorWarning: "#d69f4c",
    colorError: "#e06b6b",
    colorInfo: "#cdb894",
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
  },
  components: {
    Button: {
      primaryColor: "#0b2c2d",
      fontWeight: 600,
    },
    Table: {
      headerBg: "rgba(13, 38, 39, 0.95)",
      headerColor: "#f7edd8",
      rowHoverBg: "rgba(205, 184, 148, 0.06)",
      borderColor: "rgba(205, 184, 148, 0.12)",
    },
    Card: {
      colorBgContainer: "rgba(10, 32, 33, 0.82)",
      colorBorderSecondary: "rgba(205, 184, 148, 0.2)",
    },
    Modal: {
      contentBg: "#0c2829",
      headerBg: "#0c2829",
    },
    Tabs: {
      itemSelectedColor: "#cdb894",
      inkBarColor: "#cdb894",
      itemHoverColor: "#dfceb0",
      itemColor: "#9db0ae",
    },
    Input: {
      colorBgContainer: "rgba(6, 22, 22, 0.65)",
      colorBorder: "rgba(205, 184, 148, 0.25)",
    },
    InputNumber: {
      colorBgContainer: "rgba(6, 22, 22, 0.65)",
      colorBorder: "rgba(205, 184, 148, 0.25)",
    },
    Select: {
      colorBgContainer: "rgba(6, 22, 22, 0.65)",
      colorBgElevated: "#0c2829",
      colorBorder: "rgba(205, 184, 148, 0.25)",
    },
  },
};

// Hash routing: admin.html is served as a static file with no rewrite rules, so a
// refresh on /orders would 404 under BrowserRouter.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConfigProvider theme={adminTheme}>
      <AntApp>
        <HashRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<AdminLogin />} />
              <Route element={<RequireAdmin loginPath="/login" />}>
                <Route element={<AdminLayout />}>
                  <Route index element={<MenuAdmin />} />
                  <Route path="orders" element={<AdminOrders />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </HashRouter>
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>,
);
