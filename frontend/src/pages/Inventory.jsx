import React, { useEffect, useState } from "react";
import { api } from "../api";
import Table from "../components/Table";

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stockForm, setStockForm] = useState({ productId: "", warehouseId: "", quantity: "" });
  const [transferForm, setTransferForm] = useState({ productId: "", fromWarehouseId: "", toWarehouseId: "", quantity: "" });
  const [warehouseForm, setWarehouseForm] = useState({ name: "", location: "" });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    const [inv, p, w] = await Promise.all([api.getInventory(), api.getProducts(), api.getWarehouses()]);
    setInventory(inv);
    setProducts(p);
    setWarehouses(w);
  }

  useEffect(() => { load(); }, []);

  async function handleAddStock(e) {
    e.preventDefault();
    setError(null);
    try {
      await api.addStock({ ...stockForm, quantity: Number(stockForm.quantity) });
      setStockForm({ productId: "", warehouseId: "", quantity: "" });
      setMessage("Stock added.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleTransfer(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await api.transferStock({ ...transferForm, quantity: Number(transferForm.quantity) });
      setTransferForm({ productId: "", fromWarehouseId: "", toWarehouseId: "", quantity: "" });
      setMessage("Transfer complete.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddWarehouse(e) {
    e.preventDefault();
    if (!warehouseForm.name.trim()) return;
    await api.createWarehouse(warehouseForm);
    setWarehouseForm({ name: "", location: "" });
    await load();
  }

  return (
    <div>
      <h1>Multi-Warehouse Inventory</h1>
      <p className="subtitle">Stock levels across every warehouse, plus stock-in and transfers.</p>

      {message && <div className="success-banner">{message}</div>}
      {error && <div className="error-banner">{error}</div>}

      <div className="panel-grid">
        <div className="panel">
          <h2>Add / Top-up Stock</h2>
          <form onSubmit={handleAddStock} className="form">
            <label>Product
              <select required value={stockForm.productId} onChange={(e) => setStockForm({ ...stockForm, productId: e.target.value })}>
                <option value="">Select product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </label>
            <label>Warehouse
              <select required value={stockForm.warehouseId} onChange={(e) => setStockForm({ ...stockForm, warehouseId: e.target.value })}>
                <option value="">Select warehouse</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </label>
            <label>Quantity
              <input required type="number" min="1" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} />
            </label>
            <button type="submit">Add Stock</button>
          </form>
        </div>

        <div className="panel">
          <h2>Transfer Between Warehouses</h2>
          <form onSubmit={handleTransfer} className="form">
            <label>Product
              <select required value={transferForm.productId} onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })}>
                <option value="">Select product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </label>
            <label>From Warehouse
              <select required value={transferForm.fromWarehouseId} onChange={(e) => setTransferForm({ ...transferForm, fromWarehouseId: e.target.value })}>
                <option value="">Select warehouse</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </label>
            <label>To Warehouse
              <select required value={transferForm.toWarehouseId} onChange={(e) => setTransferForm({ ...transferForm, toWarehouseId: e.target.value })}>
                <option value="">Select warehouse</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </label>
            <label>Quantity
              <input required type="number" min="1" value={transferForm.quantity} onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })} />
            </label>
            <button type="submit">Transfer Stock</button>
          </form>
        </div>

        <div className="panel">
          <h2>Add Warehouse</h2>
          <form onSubmit={handleAddWarehouse} className="form">
            <label>Name
              <input value={warehouseForm.name} onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })} placeholder="e.g. East Depot" />
            </label>
            <label>Location
              <input value={warehouseForm.location} onChange={(e) => setWarehouseForm({ ...warehouseForm, location: e.target.value })} placeholder="e.g. Kolkata, IN" />
            </label>
            <button type="submit">Add Warehouse</button>
          </form>
        </div>
      </div>

      <h2>Stock Levels</h2>
      <Table
        columns={[
          { key: "productName", header: "Product" },
          { key: "sku", header: "SKU" },
          { key: "warehouseName", header: "Warehouse" },
          { key: "quantity", header: "Quantity", render: (r) => (
              <span className={r.quantity <= 15 ? "qty-low" : ""}>{r.quantity}</span>
            ) }
        ]}
        rows={inventory}
      />
    </div>
  );
}
