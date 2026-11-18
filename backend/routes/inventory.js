const express = require("express");
const { db, nextId } = require("../db");
const router = express.Router();

function enrich(row) {
  const product = db.get("products").find({ id: row.productId }).value();
  const warehouse = db.get("warehouses").find({ id: row.warehouseId }).value();
  return {
    ...row,
    productName: product ? product.name : null,
    sku: product ? product.sku : null,
    warehouseName: warehouse ? warehouse.name : null
  };
}

// GET /api/inventory — full stock table across all warehouses
router.get("/", (req, res) => {
  res.json(db.get("inventory").value().map(enrich));
});

// GET /api/inventory/low-stock?threshold=10 — items below a reorder point
router.get("/low-stock", (req, res) => {
  const threshold = Number(req.query.threshold) || 10;
  const rows = db.get("inventory").value().filter((r) => r.quantity <= threshold).map(enrich);
  res.json(rows);
});

// POST /api/inventory — create or top-up a stock row for a product/warehouse pair
router.post("/", (req, res) => {
  const { productId, warehouseId, quantity } = req.body;
  if (!productId || !warehouseId) {
    return res.status(400).json({ error: "productId and warehouseId are required" });
  }
  let row = db.get("inventory").find({ productId, warehouseId }).value();
  if (row) {
    db.get("inventory").find({ productId, warehouseId }).update("quantity", (q) => q + Number(quantity || 0)).write();
    row = db.get("inventory").find({ productId, warehouseId }).value();
  } else {
    row = { id: nextId(), productId, warehouseId, quantity: Number(quantity) || 0 };
    db.get("inventory").push(row).write();
  }
  res.status(201).json(enrich(row));
});

// POST /api/inventory/transfer — move stock from one warehouse to another
router.post("/transfer", (req, res) => {
  const { productId, fromWarehouseId, toWarehouseId, quantity } = req.body;
  const qty = Number(quantity);
  if (!productId || !fromWarehouseId || !toWarehouseId || !qty || qty <= 0) {
    return res.status(400).json({ error: "productId, fromWarehouseId, toWarehouseId and a positive quantity are required" });
  }
  const source = db.get("inventory").find({ productId, warehouseId: fromWarehouseId }).value();
  if (!source || source.quantity < qty) {
    return res.status(400).json({ error: "Not enough stock at the source warehouse" });
  }
  db.get("inventory").find({ productId, warehouseId: fromWarehouseId }).update("quantity", (q) => q - qty).write();

  let dest = db.get("inventory").find({ productId, warehouseId: toWarehouseId }).value();
  if (dest) {
    db.get("inventory").find({ productId, warehouseId: toWarehouseId }).update("quantity", (q) => q + qty).write();
  } else {
    dest = { id: nextId(), productId, warehouseId: toWarehouseId, quantity: qty };
    db.get("inventory").push(dest).write();
  }
  res.json({ message: "Transfer complete", productId, fromWarehouseId, toWarehouseId, quantity: qty });
});

module.exports = router;
