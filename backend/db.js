// db.js — lightweight JSON-file database (lowdb v1: synchronous, zero native deps)
// Collections mirror the ER diagram: categories, products, warehouses,
// inventory, orders, orderItems, suppliers, purchaseOrders, poItems

const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const path = require("path");

const file = path.join(__dirname, "data", "db.json");
const adapter = new FileSync(file);
const db = low(adapter);

db.defaults({
  categories: [],
  products: [],
  warehouses: [],
  inventory: [],
  orders: [],
  orderItems: [],
  suppliers: [],
  purchaseOrders: [],
  poItems: [],
  _meta: { nextId: 1 }
}).write();

// Simple auto-increment ID helper shared across all collections
function nextId() {
  const id = db.get("_meta.nextId").value();
  db.set("_meta.nextId", id + 1).write();
  return String(id);
}

module.exports = { db, nextId };
