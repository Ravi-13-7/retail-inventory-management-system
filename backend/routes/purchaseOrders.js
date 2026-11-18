
const express = require("express");
const { getDB, getClient, nextId } = require("../db");

const router = express.Router();

const STATUS_FLOW = ["Draft", "Sent", "Confirmed", "Received", "Closed"];

// Helper: add product and supplier details
async function enrichPO(po, db) {
  const items = await db.collection("poItems")
    .find({ poId: po.id })
    .toArray();

  const enrichedItems = await Promise.all(
    items.map(async (item) => {
      const product = await db.collection("products").findOne({
        id: item.productId
      });

      return {
        ...item,
        productName: product ? product.name : null,
        sku: product ? product.sku : null
      };
    })
  );

  const supplier = await db.collection("suppliers").findOne({
    id: po.supplierId
  });

  return {
    ...po,
    items: enrichedItems,
    supplierName: supplier ? supplier.name : null
  };
}

// GET /api/purchase-orders - list all purchase orders
router.get("/", async (req, res) => {
  try {
    const db = getDB();

    const purchaseOrders = await db.collection("purchaseOrders")
      .find()
      .toArray();

    const result = await Promise.all(
      purchaseOrders.map((po) => enrichPO(po, db))
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch purchase orders" });
  }
});

// GET /api/purchase-orders/:id - get one purchase order
router.get("/:id", async (req, res) => {
  try {
    const db = getDB();

    const po = await db.collection("purchaseOrders").findOne({
      id: req.params.id
    });

    if (!po) {
      return res.status(404).json({ error: "Purchase order not found" });
    }

    res.json(await enrichPO(po, db));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch purchase order" });
  }
});

// POST /api/purchase-orders - create purchase order and items
router.post("/", async (req, res) => {
  const { supplierId, items } = req.body;

  if (!supplierId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: "supplierId and at least one item are required"
    });
  }

  const session = getClient().startSession();

  try {
    const db = getDB();

    const po = {
      id: await nextId(),
      supplierId,
      status: "Draft",
      date: new Date().toISOString().slice(0, 10)
    };

    const poItems = [];

    for (const item of items) {
      poItems.push({
        id: await nextId(),
        poId: po.id,
        productId: item.productId,
        quantity: Number(item.quantity) || 1
      });
    }

    await session.withTransaction(async () => {
      await db.collection("purchaseOrders").insertOne(
        po,
        { session }
      );

      await db.collection("poItems").insertMany(
        poItems,
        { session }
      );
    });

    res.status(201).json(await enrichPO(po, db));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create purchase order" });
  } finally {
    await session.endSession();
  }
});

// POST /api/purchase-orders/:id/advance
router.post("/:id/advance", async (req, res) => {
  const session = getClient().startSession();

  try {
    const db = getDB();

    let updatedPO = null;
    let failure = null;

    await session.withTransaction(async () => {
      const purchaseOrders = db.collection("purchaseOrders");
      const poItemsCollection = db.collection("poItems");
      const inventory = db.collection("inventory");

      const po = await purchaseOrders.findOne(
        { id: req.params.id },
        { session }
      );

      if (!po) {
        failure = {
          status: 404,
          error: "Purchase order not found"
        };
        return;
      }

      const currentIndex = STATUS_FLOW.indexOf(po.status);

      if (
        currentIndex === -1 ||
        currentIndex === STATUS_FLOW.length - 1
      ) {
        failure = {
          status: 400,
          error: `Purchase order is already at its final status (${po.status})`
        };
        return;
      }

      const nextStatus = STATUS_FLOW[currentIndex + 1];
      const updates = { status: nextStatus };

      if (nextStatus === "Received") {
        const { warehouseId } = req.body;

        if (!warehouseId) {
          failure = {
            status: 400,
            error: "warehouseId is required to receive goods into stock"
          };
          return;
        }

        const items = await poItemsCollection
          .find({ poId: po.id }, { session })
          .toArray();

        // Add received quantities to warehouse inventory
        for (const item of items) {
          const existingStock = await inventory.findOne(
            {
              productId: item.productId,
              warehouseId
            },
            { session }
          );

          if (existingStock) {
            await inventory.updateOne(
              { id: existingStock.id },
              { $inc: { quantity: item.quantity } },
              { session }
            );
          } else {
            await inventory.insertOne(
              {
                id: await nextId(),
                productId: item.productId,
                warehouseId,
                quantity: item.quantity
              },
              { session }
            );
          }
        }

        updates.warehouseId = warehouseId;
      }

      await purchaseOrders.updateOne(
        { id: po.id },
        { $set: updates },
        { session }
      );

      updatedPO = {
        ...po,
        ...updates
      };
    });

    if (failure) {
      return res.status(failure.status).json({
        error: failure.error
      });
    }

    res.json(await enrichPO(updatedPO, db));
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to advance purchase order"
    });
  } finally {
    await session.endSession();
  }
});

module.exports = router;
