import React from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/products", label: "Catalog" },
  { to: "/inventory", label: "Inventory" },
  { to: "/orders", label: "Orders" },
  { to: "/suppliers", label: "Suppliers & POs" }
];

export default function Nav() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">RIMS</span>
        <span className="brand-sub">Retail Inventory</span>
      </div>
      <nav>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
