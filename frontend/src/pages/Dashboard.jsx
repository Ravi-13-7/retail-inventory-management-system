import React, { useEffect, useState } from "react";
import { api } from "../api";
import Table from "../components/Table";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [products, warehouses, orders, purchaseOrders, inventory, low] = await Promise.all([
          api.getProducts(),
          api.getWarehouses(),
          api.getOrders(),
          api.getPurchaseOrders(),
          api.getInventory(),
          api.getLowStock(15)
        ]);
        const totalUnits = inventory.reduce((sum, r) => sum + r.quantity, 0);
        setStats({
          products: products.length,
          warehouses: warehouses.length,
          orders: orders.length,
          purchaseOrders: purchaseOrders.length,
          totalUnits
        });
        setLowStock(low);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="subtitle">A quick snapshot across the whole system.</p>

      {error && <div className="error-banner">{error}</div>}

      {stats && (
        <div className="stat-grid">
          <StatCard label="Products" value={stats.products} />
          <StatCard label="Warehouses" value={stats.warehouses} />
          <StatCard label="Orders" value={stats.orders} />
          <StatCard label="Purchase Orders" value={stats.purchaseOrders} />
          <StatCard label="Units in Stock" value={stats.totalUnits} />
        </div>
      )}

      <h2>Low Stock Alerts <span className="muted">(15 units or fewer)</span></h2>
      <Table
        emptyMessage="Nothing is low on stock right now."
        columns={[
          { key: "productName", header: "Product" },
          { key: "sku", header: "SKU" },
          { key: "warehouseName", header: "Warehouse" },
          { key: "quantity", header: "Quantity" }
        ]}
        rows={lowStock}
      />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
