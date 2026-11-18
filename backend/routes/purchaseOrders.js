const express = require("express");
const { db, nextId } = require("../db");
const router = express.Router();

const STATUS_FLOW = ["Draft", "Sent", "Confirmed", "Received", "Closed"];

function enrichPO(po) {
  const items = db.get("poItems").filter({ poId: po.id }).value().map((it) => {
    const product = db.get("products").find({ id: it.productId }).value();
    return { ...it, productName: product ? product.name : null, sku: product ? product.sku : null };
  });
  const supplier = db.get("suppliers").find({ id: po.supplierId }).value();
  return { ...po, items, supplierName: supplier ? supplier.name : null };
}

// GET /api/purchase-orders — list all, with items + supplier joined
router.get("/", (req, res) => {
  res.json(db.get("purchaseOrders").value().map(enrichPO));
});

router.get("/:id", (req, res) => {
  const po = db.get("purchaseOrders").find({ id: req.params.id }).value();
  if (!po) return res.status(404).json({ error: "Purchase order not found" });
  res.json(enrichPO(po));
});

// POST /api/purchase-orders — create a PO (Procurement creates a Purchase Order)
router.post("/", (req, res) => {
  const { supplierId, items } = req.body;
  if (!supplierId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "supplierId and at least one item are required" });
  }
  const po = { id: nextId(), supplierId, status: "Draft", date: new Date().toISOString().slice(0, 10) };
  db.get("purchaseOrders").push(po).write();

  items.forEach((it) => {
    db.get("poItems").push({
      id: nextId(),
      poId: po.id,
      productId: it.productId,
      quantity: Number(it.quantity) || 1
    }).write();
  });

  res.status(201).json(enrichPO(po));
});

// POST /api/purchase-orders/:id/advance — move through Draft -> Sent -> Confirmed -> Received -> Closed.
// Stock is added to a chosen warehouse the moment the PO reaches "Received"
// (mirrors "Warehouse receives goods" -> "Update stock levels" in the flow diagram).
router.post("/:id/advance", (req, res) => {
  const poWrap = db.get("purchaseOrders").find({ id: req.params.id });
  const po = poWrap.value();
  if (!po) return res.status(404).json({ error: "Purchase order not found" });

  const currentIndex = STATUS_FLOW.indexOf(po.status);
  if (currentIndex === -1 || currentIndex === STATUS_FLOW.length - 1) {
    return res.status(400).json({ error: `Purchase order is already at its final status (${po.status})` });
  }
  const nextStatus = STATUS_FLOW[currentIndex + 1];

  if (nextStatus === "Received") {
    const { warehouseId } = req.body;
    if (!warehouseId) {
      return res.status(400).json({ error: "warehouseId is required to receive goods into stock" });
    }
    const items = db.get("poItems").filter({ poId: po.id }).value();
    items.forEach((it) => {
      let row = db.get("inventory").find({ productId: it.productId, warehouseId }).value();
      if (row) {
        db.get("inventory").find({ productId: it.productId, warehouseId })
          .update("quantity", (q) => q + it.quantity).write();
      } else {
        db.get("inventory").push({ id: nextId(), productId: it.productId, warehouseId, quantity: it.quantity }).write();
      }
    });
    poWrap.assign({ status: nextStatus, warehouseId }).write();
  } else {
    poWrap.assign({ status: nextStatus }).write();
  }

  res.json(enrichPO(poWrap.value()));
});

module.exports = router;
