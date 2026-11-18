const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  // Categories
  getCategories: () => request("/categories"),
  createCategory: (body) => request("/categories", { method: "POST", body: JSON.stringify(body) }),

  // Warehouses
  getWarehouses: () => request("/warehouses"),
  createWarehouse: (body) => request("/warehouses", { method: "POST", body: JSON.stringify(body) }),

  // Products
  getProducts: () => request("/products"),
  createProduct: (body) => request("/products", { method: "POST", body: JSON.stringify(body) }),

  // Inventory
  getInventory: () => request("/inventory"),
  getLowStock: (threshold = 10) => request(`/inventory/low-stock?threshold=${threshold}`),
  addStock: (body) => request("/inventory", { method: "POST", body: JSON.stringify(body) }),
  transferStock: (body) => request("/inventory/transfer", { method: "POST", body: JSON.stringify(body) }),

  // Suppliers
  getSuppliers: () => request("/suppliers"),
  createSupplier: (body) => request("/suppliers", { method: "POST", body: JSON.stringify(body) }),

  // Orders
  getOrders: () => request("/orders"),
  createOrder: (body) => request("/orders", { method: "POST", body: JSON.stringify(body) }),
  advanceOrder: (id) => request(`/orders/${id}/advance`, { method: "POST" }),

  // Purchase Orders
  getPurchaseOrders: () => request("/purchase-orders"),
  createPurchaseOrder: (body) => request("/purchase-orders", { method: "POST", body: JSON.stringify(body) }),
  advancePurchaseOrder: (id, body) =>
    request(`/purchase-orders/${id}/advance`, { method: "POST", body: JSON.stringify(body || {}) })
};
