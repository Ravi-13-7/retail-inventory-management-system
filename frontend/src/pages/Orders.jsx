import React, { useEffect, useState } from "react";
import { api } from "../api";

const STATUS_ORDER = ["Confirmed", "Picked", "Packed", "Shipped"];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [lineItems, setLineItems] = useState([{ productId: "", quantity: 1 }]);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  async function load() {
    const [o, p, w] = await Promise.all([api.getOrders(), api.getProducts(), api.getWarehouses()]);
    setOrders(o.slice().reverse());
    setProducts(p);
    setWarehouses(w);
  }

  useEffect(() => { load(); }, []);

  function updateLine(i, field, value) {
    const next = [...lineItems];
    next[i] = { ...next[i], [field]: value };
    setLineItems(next);
  }

  function addLine() {
    setLineItems([...lineItems, { productId: "", quantity: 1 }]);
  }

  function removeLine(i) {
    setLineItems(lineItems.filter((_, idx) => idx !== i));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      await api.createOrder({
        customerName,
        warehouseId,
        items: lineItems
          .filter((l) => l.productId)
          .map((l) => ({ productId: l.productId, quantity: Number(l.quantity) || 1 }))
      });
      setCustomerName("");
      setWarehouseId("");
      setLineItems([{ productId: "", quantity: 1 }]);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAdvance(id) {
    setActionError(null);
    try {
      await api.advanceOrder(id);
      await load();
    } catch (err) {
      setActionError(`Order ${id}: ${err.message}`);
    }
  }

  return (
    <div>
      <h1>Orders & Fulfillment</h1>
      <p className="subtitle">Create customer orders and move them through pick → pack → ship.</p>

      <div className="panel">
        <h2>New Order</h2>
        <form onSubmit={handleCreate} className="form">
          <label>Customer Name
            <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. Rohan Mehta" />
          </label>
          <label>Fulfilling Warehouse
            <select required value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
              <option value="">Select warehouse</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </label>

          <div className="line-items">
            <h3 className="mini-heading">Items</h3>
            {lineItems.map((line, i) => (
              <div className="line-item-row" key={i}>
                <select value={line.productId} onChange={(e) => updateLine(i, "productId", e.target.value)}>
                  <option value="">Select product</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
                <input type="number" min="1" value={line.quantity} onChange={(e) => updateLine(i, "quantity", e.target.value)} style={{ width: "80px" }} />
                {lineItems.length > 1 && <button type="button" className="btn-link" onClick={() => removeLine(i)}>Remove</button>}
              </div>
            ))}
            <button type="button" className="btn-secondary" onClick={addLine}>+ Add Item</button>
          </div>

          {error && <div className="error-text">{error}</div>}
          <button type="submit">Create Order</button>
        </form>
      </div>

      {actionError && <div className="error-banner">{actionError}</div>}

      <h2>All Orders</h2>
      <div className="order-list">
        {orders.length === 0 && <div className="empty-state">No orders yet.</div>}
        {orders.map((o) => (
          <div className="order-card" key={o.id}>
            <div className="order-card-header">
              <div>
                <strong>Order #{o.id}</strong> — {o.customerName}
                <div className="muted small">{o.warehouseName || "No warehouse set"} • {o.date}</div>
              </div>
              <StatusBadge status={o.status} />
            </div>
            <ul className="order-items">
              {o.items.map((it) => (
                <li key={it.id}>{it.productName} ({it.sku}) × {it.quantity}</li>
              ))}
            </ul>
            <div className="order-progress">
              {STATUS_ORDER.map((s, i) => (
                <React.Fragment key={s}>
                  <span className={STATUS_ORDER.indexOf(o.status) >= i ? "step done" : "step"}>{s}</span>
                  {i < STATUS_ORDER.length - 1 && <span className="step-arrow">→</span>}
                </React.Fragment>
              ))}
            </div>
            {o.status !== "Shipped" ? (
              <button onClick={() => handleAdvance(o.id)}>
                Advance to {STATUS_ORDER[STATUS_ORDER.indexOf(o.status) + 1]}
              </button>
            ) : (
              <span className="done-label">✓ Shipped</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>;
}
