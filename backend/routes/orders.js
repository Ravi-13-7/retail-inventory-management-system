
const express = require("express");
const { getDB, getClient, nextId } = require("../db");

const router = express.Router();

const STATUS_FLOW = ["Confirmed", "Picked", "Packed", "Shipped"];

// Helper: add items and warehouse details to an order
async function enrichOrder(order, db) {
  const items = await db.collection("orderItems")
    .find({ orderId: order.id })
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

  const warehouse = await db.collection("warehouses").findOne({
    id: order.warehouseId
  });

  return {
    ...order,
    items: enrichedItems,
    warehouseName: warehouse ? warehouse.name : null
  };
}

// GET /api/orders - list all orders
router.get("/", async (req, res) => {
  try {
    const db = getDB();

    const orders = await db.collection("orders")
      .find()
      .toArray();

    const result = await Promise.all(
      orders.map((order) => enrichOrder(order, db))
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// GET /api/orders/:id - get one order
router.get("/:id", async (req, res) => {
  try {
    const db = getDB();

    const order = await db.collection("orders").findOne({
      id: req.params.id
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(await enrichOrder(order, db));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// POST /api/orders - create order and order items
router.post("/", async (req, res) => {
  const { customerName, warehouseId, items } = req.body;

  if (
    !customerName ||
    !warehouseId ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({
      error: "customerName, warehouseId and at least one item are required"
    });
  }

  const session = getClient().startSession();

  try {
    const db = getDB();

    const order = {
      id: await nextId(),
      customerName,
      warehouseId,
      status: "Confirmed",
      date: new Date().toISOString().slice(0, 10)
    };

    const orderItems = [];

    for (const item of items) {
      orderItems.push({
        id: await nextId(),
        orderId: order.id,
        productId: item.productId,
        quantity: Number(item.quantity) || 1
      });
    }

    await session.withTransaction(async () => {
      await db.collection("orders").insertOne(order, { session });

      await db.collection("orderItems").insertMany(
        orderItems,
        { session }
      );
    });

    res.status(201).json(await enrichOrder(order, db));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create order" });
  } finally {
    await session.endSession();
  }
});

// POST /api/orders/:id/advance - advance order status
router.post("/:id/advance", async (req, res) => {
  const session = getClient().startSession();

  try {
    const db = getDB();

    let updatedOrder = null;
    let failure = null;

    await session.withTransaction(async () => {
      const orders = db.collection("orders");
      const orderItemsCollection = db.collection("orderItems");
      const inventory = db.collection("inventory");

      const order = await orders.findOne(
        { id: req.params.id },
        { session }
      );

      if (!order) {
        failure = {
          status: 404,
          error: "Order not found"
        };
        return;
      }

      const currentIndex = STATUS_FLOW.indexOf(order.status);

      if (
        currentIndex === -1 ||
        currentIndex === STATUS_FLOW.length - 1
      ) {
        failure = {
          status: 400,
          error: `Order is already at its final status (${order.status})`
        };
        return;
      }

      const nextStatus = STATUS_FLOW[currentIndex + 1];

      if (nextStatus === "Shipped") {
        const items = await orderItemsCollection
          .find({ orderId: order.id }, { session })
          .toArray();

        // Combine quantities if the same product appears more than once
        const requiredStock = {};

        for (const item of items) {
          requiredStock[item.productId] =
            (requiredStock[item.productId] || 0) + item.quantity;
        }

        // Check stock availability first
        for (const [productId, quantity] of Object.entries(requiredStock)) {
          const stock = await inventory.findOne(
            {
              productId,
              warehouseId: order.warehouseId,
              quantity: { $gte: quantity }
            },
            { session }
          );

          if (!stock) {
            failure = {
              status: 409,
              error: "Insufficient stock to ship this order. Transfer stock in or raise a purchase order first.",
              productId
            };
            return;
          }
        }

        // Deduct stock inside the same transaction
        for (const [productId, quantity] of Object.entries(requiredStock)) {
          const result = await inventory.updateOne(
            {
              productId,
              warehouseId: order.warehouseId,
              quantity: { $gte: quantity }
            },
            {
              $inc: { quantity: -quantity }
            },
            { session }
          );

          if (result.matchedCount === 0) {
            throw new Error("INSUFFICIENT_STOCK");
          }
        }
      }

      await orders.updateOne(
        { id: order.id },
        { $set: { status: nextStatus } },
        { session }
      );

      updatedOrder = {
        ...order,
        status: nextStatus
      };
    });

    if (failure) {
      return res.status(failure.status).json(failure);
    }

    res.json(await enrichOrder(updatedOrder, db));
  } catch (error) {
    console.error(error);

    if (error.message === "INSUFFICIENT_STOCK") {
      return res.status(409).json({
        error: "Insufficient stock to ship this order."
      });
    }

    res.status(500).json({ error: "Failed to advance order" });
  } finally {
    await session.endSession();
  }
});

module.exports = router;
