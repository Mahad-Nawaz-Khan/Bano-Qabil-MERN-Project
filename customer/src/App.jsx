import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Spin } from "antd";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import { RequireAuth, RequireVerified } from "./components/auth/RequireAuth.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";

const Home = lazy(() => import("./pages/Home.jsx"));
const AboutUs = lazy(() => import("./pages/AboutUs.jsx"));
const Reservation = lazy(() => import("./pages/Reservation.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));
const Cart = lazy(() => import("./pages/Cart.jsx"));
const Checkout = lazy(() => import("./pages/Checkout.jsx"));
const Orders = lazy(() => import("./pages/Orders.jsx"));
const OrderDetail = lazy(() => import("./pages/OrderDetail.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

export default function App() {
  return (
    <div className="public-app">
      <ScrollToTop />
      <Navbar />
      <main className="app-main">
        <Suspense fallback={<div className="page-loader"><Spin size="large" /></div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/reservation" element={<Reservation />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/cart" element={<Cart />} />

            <Route element={<RequireAuth />}>
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route element={<RequireVerified />}>
                <Route path="/checkout" element={<Checkout />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <CartDrawer />
      <Footer />
    </div>
  );
}
