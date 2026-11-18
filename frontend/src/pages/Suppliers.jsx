import React, { useEffect, useState } from "react";
import { api } from "../api";
import Table from "../components/Table";

const STATUS_ORDER = ["Draft", "Sent", "Confirmed", "Received", "Closed"];

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [pos, setPos] = useState([]);

  const [supplierForm, setSupplierForm] = useState({ name: "", contact: "" });
  const [poSupplierId, setPoSupplierId] = useState("");
  const [lineItems, setLineItems] = useState([{ productId: "", quantity: 10 }]);
  const [receiveWarehouse, setReceiveWarehouse] = useState({});
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  async function load() {
    const [s, p, w, po] = await Promise.all([
      api.getSuppliers(), api.getProducts(), api.getWarehouses(), api.getPurchaseOrders()
    ]);
    setSuppliers(s);
    setProducts(p);
    setWarehouses(w);
    setPos(po.slice().reverse());
  }

  useEffect(() => { load(); }, []);

  async function handleAddSupplier(e) {
    e.preventDefault();
    if (!supplierForm.name.trim()) return;
    await api.createSupplier(supplierForm);
    setSupplierForm({ name: "", contact: "" });
    await load();
  }

  function updateLine(i, field, value) {
    const next = [...lineItems];
    next[i] = { ...next[i], [field]: value };
    setLineItems(next);
  }
  function addLine() { setLineItems([...lineItems, { productId: "", quantity: 10 }]); }
  function removeLine(i) { setLineItems(lineItems.filter((_, idx) => idx !== i)); }

  async function handleCreatePO(e) {
    e.preventDefault();
    setError(null);
    try {
      await api.createPurchaseOrder({
        supplierId: poSupplierId,
        items: lineItems.filter((l) => l.productId).map((l) => ({ productId: l.productId, quantity: Number(l.quantity) || 1 }))
      });
      setPoSupplierId("");
      setLineItems([{ productId: "", quantity: 10 }]);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAdvance(po) {
    setActionError(null);
    const nextStatus = STATUS_ORDER[STATUS_ORDER.indexOf(po.status) + 1];
    try {
      if (nextStatus === "Received") {
        const wh = receiveWarehouse[po.id];
        if (!wh) {
          setActionError(`PO ${po.id}: choose a warehouse to receive goods into first.`);
          return;
        }
        await api.advancePurchaseOrder(po.id, { warehouseId: wh });
      } else {
        await api.advancePurchaseOrder(po.id);
      }
      await load();
    } catch (err) {
      setActionError(`PO ${po.id}: ${err.message}`);
    }
  }

  return (
    <div>
      <h1>Suppliers & Purchase Orders</h1>
      <p className="subtitle">Manage suppliers and move purchase orders from draft through to received stock.</p>

      <div className="panel-grid">
        <div className="panel">
          <h2>Add Supplier</h2>
          <form onSubmit={handleAddSupplier} className="form">
            <label>Name
              <input value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} placeholder="e.g. Meridian Supplies" />
            </label>
            <label>Contact Email
              <input value={supplierForm.contact} onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })} placeholder="e.g. orders@meridian.example" />
            </label>
            <button type="submit">Add Supplier</button>
          </form>
          <h3 className="mini-heading">Existing Suppliers</h3>
          <Table
            columns={[{ key: "name", header: "Name" }, { key: "contact", header: "Contact" }]}
            rows={suppliers}
          />
        </div>

        <div className="panel">
          <h2>New Purchase Order</h2>
          <form onSubmit={handleCreatePO} className="form">
            <label>Supplier
              <select required value={poSupplierId} onChange={(e) => setPoSupplierId(e.target.value)}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
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
            <button type="submit">Create Purchase Order</button>
          </form>
        </div>
      </div>

      {actionError && <div className="error-banner">{actionError}</div>}

      <h2>All Purchase Orders</h2>
      <div className="order-list">
        {pos.length === 0 && <div className="empty-state">No purchase orders yet.</div>}
        {pos.map((po) => (
          <div className="order-card" key={po.id}>
            <div className="order-card-header">
              <div>
                <strong>PO #{po.id}</strong> — {po.supplierName}
                <div className="muted small">{po.date}</div>
              </div>
              <span className={`badge badge-${po.status.toLowerCase()}`}>{po.status}</span>
            </div>
            <ul className="order-items">
              {po.items.map((it) => (
                <li key={it.id}>{it.productName} ({it.sku}) × {it.quantity}</li>
              ))}
            </ul>
            <div className="order-progress">
              {STATUS_ORDER.map((s, i) => (
                <React.Fragment key={s}>
                  <span className={STATUS_ORDER.indexOf(po.status) >= i ? "step done" : "step"}>{s}</span>
                  {i < STATUS_ORDER.length - 1 && <span className="step-arrow">→</span>}
                </React.Fragment>
              ))}
            </div>

            {po.status === "Sent" && (
              <div className="inline-note">Next step requires nothing extra — click Advance to mark as Confirmed by the supplier.</div>
            )}
            {po.status === "Confirmed" && (
              <label className="receive-select">
                Receive into warehouse:
                <select
                  value={receiveWarehouse[po.id] || ""}
                  onChange={(e) => setReceiveWarehouse({ ...receiveWarehouse, [po.id]: e.target.value })}
                >
                  <option value="">Select warehouse</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </label>
            )}

            {po.status !== "Closed" ? (
              <button onClick={() => handleAdvance(po)}>
                Advance to {STATUS_ORDER[STATUS_ORDER.indexOf(po.status) + 1]}
              </button>
            ) : (
              <span className="done-label">✓ Closed</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
