const express = require("express");
const { db, nextId } = require("../db");
const router = express.Router();

const STATUS_FLOW = ["Confirmed", "Picked", "Packed", "Shipped"];

function enrichOrder(order) {
  const items = db.get("orderItems").filter({ orderId: order.id }).value().map((it) => {
    const product = db.get("products").find({ id: it.productId }).value();
    return { ...it, productName: product ? product.name : null, sku: product ? product.sku : null };
  });
  const warehouse = db.get("warehouses").find({ id: order.warehouseId }).value();
  return { ...order, items, warehouseName: warehouse ? warehouse.name : null };
}

// GET /api/orders — list all orders with their line items
router.get("/", (req, res) => {
  res.json(db.get("orders").value().map(enrichOrder));
});

router.get("/:id", (req, res) => {
  const order = db.get("orders").find({ id: req.params.id }).value();
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(enrichOrder(order));
});

// POST /api/orders — create an order + items. Stock is only checked, not yet deducted
// (deduction happens on shipment, matching the order fulfillment flow diagram).
router.post("/", (req, res) => {
  const { customerName, warehouseId, items } = req.body;
  if (!customerName || !warehouseId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "customerName, warehouseId and at least one item are required" });
  }

  const order = {
    id: nextId(),
    customerName,
    warehouseId,
    status: "Confirmed",
    date: new Date().toISOString().slice(0, 10)
  };
  db.get("orders").push(order).write();

  items.forEach((it) => {
    db.get("orderItems").push({
      id: nextId(),
      orderId: order.id,
      productId: it.productId,
      quantity: Number(it.quantity) || 1
    }).write();
  });

  res.status(201).json(enrichOrder(order));
});

// POST /api/orders/:id/advance — move the order to the next status in the flow.
// When moving into "Shipped", stock is deducted from the order's warehouse.
// If stock is short, the order is NOT advanced and a 409 is returned
// (mirrors the "Stock available?" decision in the flow diagram).
router.post("/:id/advance", (req, res) => {
  const orderWrap = db.get("orders").find({ id: req.params.id });
  const order = orderWrap.value();
  if (!order) return res.status(404).json({ error: "Order not found" });

  const currentIndex = STATUS_FLOW.indexOf(order.status);
  if (currentIndex === -1 || currentIndex === STATUS_FLOW.length - 1) {
    return res.status(400).json({ error: `Order is already at its final status (${order.status})` });
  }
  const nextStatus = STATUS_FLOW[currentIndex + 1];

  if (nextStatus === "Shipped") {
    const items = db.get("orderItems").filter({ orderId: order.id }).value();
    for (const it of items) {
      const stock = db.get("inventory").find({ productId: it.productId, warehouseId: order.warehouseId }).value();
      if (!stock || stock.quantity < it.quantity) {
        return res.status(409).json({
          error: "Insufficient stock to ship this order. Transfer stock in or raise a purchase order first.",
          productId: it.productId
        });
      }
    }
    items.forEach((it) => {
      db.get("inventory").find({ productId: it.productId, warehouseId: order.warehouseId })
        .update("quantity", (q) => q - it.quantity).write();
    });
  }

  orderWrap.assign({ status: nextStatus }).write();
  res.json(enrichOrder(orderWrap.value()));
});

module.exports = router;
