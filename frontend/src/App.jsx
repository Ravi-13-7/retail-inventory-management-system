import React from "react";
import { Routes, Route } from "react-router-dom";
import Nav from "./components/Nav";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import Suppliers from "./pages/Suppliers";

export default function App() {
  return (
    <div className="app-shell">
      <Nav />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/suppliers" element={<Suppliers />} />
        </Routes>
      </main>
    </div>
  );
}
