import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Spin } from "antd";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import "./App.css";

const Home = lazy(() => import("./pages/Home.jsx"));
const AboutUs = lazy(() => import("./pages/AboutUs.jsx"));
const Reservation = lazy(() => import("./pages/Reservation.jsx"));

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Suspense fallback={<div className="page-loader"><Spin size="large" /></div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/reservation" element={<Reservation />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
