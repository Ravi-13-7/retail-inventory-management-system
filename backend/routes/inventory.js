
const express = require("express");
const { getDB, nextId } = require("../db");

const router = express.Router();

// Helper: add product and warehouse details
async function enrich(row, db) {
  const product = await db.collection("products").findOne({
    id: row.productId
  });

  const warehouse = await db.collection("warehouses").findOne({
    id: row.warehouseId
  });

  return {
    ...row,
    productName: product ? product.name : null,
    sku: product ? product.sku : null,
    warehouseName: warehouse ? warehouse.name : null
  };
}

// GET /api/inventory - full stock table
router.get("/", async (req, res) => {
  try {
    const db = getDB();

    const rows = await db.collection("inventory").find().toArray();

    const result = await Promise.all(
      rows.map((row) => enrich(row, db))
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// GET /api/inventory/low-stock?threshold=10
router.get("/low-stock", async (req, res) => {
  try {
    const db = getDB();
    const threshold = Number(req.query.threshold) || 10;

    const rows = await db.collection("inventory")
      .find({ quantity: { $lte: threshold } })
      .toArray();

    const result = await Promise.all(
      rows.map((row) => enrich(row, db))
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch low-stock items" });
  }
});

// POST /api/inventory - create or top-up stock
router.post("/", async (req, res) => {
  try {
    const { productId, warehouseId, quantity } = req.body;
    const qty = Number(quantity) || 0;

    if (!productId || !warehouseId) {
      return res.status(400).json({
        error: "productId and warehouseId are required"
      });
    }

    if (!Number.isFinite(qty) || qty < 0) {
      return res.status(400).json({
        error: "Quantity must be a non-negative number"
      });
    }

    const db = getDB();
    const collection = db.collection("inventory");

    let row = await collection.findOne({
      productId,
      warehouseId
    });

    if (row) {
      await collection.updateOne(
        { id: row.id },
        { $inc: { quantity: qty } }
      );

      row = await collection.findOne({ id: row.id });
    } else {
      row = {
        id: await nextId(),
        productId,
        warehouseId,
        quantity: qty
      };

      await collection.insertOne(row);
    }

    res.status(201).json(await enrich(row, db));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update inventory" });
  }
});

// POST /api/inventory/transfer
router.post("/transfer", async (req, res) => {
  try {
    const {
      productId,
      fromWarehouseId,
      toWarehouseId,
      quantity
    } = req.body;

    const qty = Number(quantity);

    if (
      !productId ||
      !fromWarehouseId ||
      !toWarehouseId ||
      !Number.isFinite(qty) ||
      qty <= 0 ||
      fromWarehouseId === toWarehouseId
    ) {
      return res.status(400).json({
        error: "Valid product, different warehouses and positive quantity are required"
      });
    }

    const db = getDB();
    const collection = db.collection("inventory");

    const source = await collection.findOneAndUpdate(
      {
        productId,
        warehouseId: fromWarehouseId,
        quantity: { $gte: qty }
      },
      {
        $inc: { quantity: -qty }
      },
      {
        returnDocument: "after"
      }
    );

    if (!source) {
      return res.status(400).json({
        error: "Not enough stock at the source warehouse"
      });
    }

    const dest = await collection.findOne({
      productId,
      warehouseId: toWarehouseId
    });

    if (dest) {
      await collection.updateOne(
        { id: dest.id },
        { $inc: { quantity: qty } }
      );
    } else {
      await collection.insertOne({
        id: await nextId(),
        productId,
        warehouseId: toWarehouseId,
        quantity: qty
      });
    }

    res.json({
      message: "Transfer complete",
      productId,
      fromWarehouseId,
      toWarehouseId,
      quantity: qty
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to transfer inventory" });
  }
});

module.exports = router;
