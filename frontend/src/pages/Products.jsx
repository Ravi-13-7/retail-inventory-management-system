import React, { useEffect, useState } from "react";
import { api } from "../api";
import Table from "../components/Table";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ sku: "", name: "", price: "", categoryId: "" });
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [p, c] = await Promise.all([api.getProducts(), api.getCategories()]);
    setProducts(p);
    setCategories(c);
  }

  useEffect(() => { load(); }, []);

  async function handleAddProduct(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.createProduct({ ...form, price: Number(form.price) });
      setForm({ sku: "", name: "", price: "", categoryId: "" });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCategory.trim()) return;
    await api.createCategory({ name: newCategory.trim() });
    setNewCategory("");
    await load();
  }

  return (
    <div>
      <h1>Product Catalog</h1>
      <p className="subtitle">Manage products and their categories.</p>

      <div className="panel-grid">
        <div className="panel">
          <h2>Add Product</h2>
          <form onSubmit={handleAddProduct} className="form">
            <label>SKU
              <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. APL-TSH-002" />
            </label>
            <label>Name
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Graphic T-Shirt" />
            </label>
            <label>Price (₹)
              <input required type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </label>
            <label>Category
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">— none —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            {error && <div className="error-text">{error}</div>}
            <button type="submit" disabled={busy}>{busy ? "Adding…" : "Add Product"}</button>
          </form>
        </div>

        <div className="panel">
          <h2>Add Category</h2>
          <form onSubmit={handleAddCategory} className="form">
            <label>Name
              <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Accessories" />
            </label>
            <button type="submit">Add Category</button>
          </form>
          <h3 className="mini-heading">Existing Categories</h3>
          <ul className="chip-list">
            {categories.map((c) => <li key={c.id} className="chip">{c.name}</li>)}
          </ul>
        </div>
      </div>

      <h2>All Products</h2>
      <Table
        columns={[
          { key: "sku", header: "SKU" },
          { key: "name", header: "Name" },
          { key: "categoryName", header: "Category", render: (r) => r.categoryName || "—" },
          { key: "price", header: "Price", render: (r) => `₹${r.price}` }
        ]}
        rows={products}
      />
    </div>
  );
}
