// seed.js — populates the database with sample data so the app is usable immediately.
// Run with: npm run seed

const { db, nextId } = require("./db");

function reset() {
  db.set("categories", []).write();
  db.set("products", []).write();
  db.set("warehouses", []).write();
  db.set("inventory", []).write();
  db.set("orders", []).write();
  db.set("orderItems", []).write();
  db.set("suppliers", []).write();
  db.set("purchaseOrders", []).write();
  db.set("poItems", []).write();
}

reset();

// --- Categories ---
const categories = [
  { id: nextId(), name: "Apparel" },
  { id: nextId(), name: "Footwear" },
  { id: nextId(), name: "Electronics" },
  { id: nextId(), name: "Home & Kitchen" }
];
db.set("categories", categories).write();

// --- Warehouses ---
const warehouses = [
  { id: nextId(), name: "North Distribution Center", location: "Delhi, IN" },
  { id: nextId(), name: "South Fulfillment Hub", location: "Bengaluru, IN" },
  { id: nextId(), name: "West Regional Store", location: "Mumbai, IN" }
];
db.set("warehouses", warehouses).write();

// --- Suppliers ---
const suppliers = [
  { id: nextId(), name: "Apex Textiles Ltd.", contact: "sales@apextextiles.example" },
  { id: nextId(), name: "StrideWell Footwear Co.", contact: "orders@stridewell.example" },
  { id: nextId(), name: "CircuitPoint Electronics", contact: "procurement@circuitpoint.example" }
];
db.set("suppliers", suppliers).write();

// --- Products ---
const products = [
  { id: nextId(), sku: "APL-TSH-001", name: "Classic Cotton T-Shirt", price: 499, categoryId: categories[0].id },
  { id: nextId(), sku: "APL-JKT-002", name: "Windbreaker Jacket", price: 1799, categoryId: categories[0].id },
  { id: nextId(), sku: "FTW-SNK-001", name: "Running Sneakers", price: 2499, categoryId: categories[1].id },
  { id: nextId(), sku: "ELC-EBD-001", name: "Wireless Earbuds", price: 1999, categoryId: categories[2].id },
  { id: nextId(), sku: "HMK-MUG-001", name: "Ceramic Coffee Mug", price: 299, categoryId: categories[3].id }
];
db.set("products", products).write();

// --- Inventory (stock per product per warehouse) ---
const inventory = [];
products.forEach((p, pi) => {
  warehouses.forEach((w, wi) => {
    inventory.push({
      id: nextId(),
      productId: p.id,
      warehouseId: w.id,
      quantity: 20 + pi * 5 + wi * 3
    });
  });
});
db.set("inventory", inventory).write();

// --- A sample order ---
const order1 = {
  id: nextId(),
  customerName: "Asha Verma",
  warehouseId: warehouses[0].id,
  status: "Confirmed",
  date: new Date().toISOString().slice(0, 10)
};
db.set("orders", [order1]).write();

const orderItems = [
  { id: nextId(), orderId: order1.id, productId: products[0].id, quantity: 2 },
  { id: nextId(), orderId: order1.id, productId: products[3].id, quantity: 1 }
];
db.set("orderItems", orderItems).write();

// --- A sample purchase order ---
const po1 = {
  id: nextId(),
  supplierId: suppliers[0].id,
  status: "Sent",
  date: new Date().toISOString().slice(0, 10)
};
db.set("purchaseOrders", [po1]).write();

const poItems = [
  { id: nextId(), poId: po1.id, productId: products[1].id, quantity: 50 }
];
db.set("poItems", poItems).write();

console.log("Database seeded successfully.");
console.log(`  Categories: ${categories.length}`);
console.log(`  Warehouses: ${warehouses.length}`);
console.log(`  Suppliers:  ${suppliers.length}`);
console.log(`  Products:   ${products.length}`);
console.log(`  Inventory rows: ${inventory.length}`);
console.log(`  Sample order: ${order1.id} (${orderItems.length} items)`);
console.log(`  Sample PO: ${po1.id} (${poItems.length} items)`);
