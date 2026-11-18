
const express = require("express");
const { getDB, nextId } = require("../db");

const router = express.Router();

// GET /api/warehouses - get all warehouses
router.get("/", async (req, res) => {
  try {
    const db = getDB();

    const warehouses = await db.collection("warehouses")
      .find()
      .toArray();

    res.json(warehouses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch warehouses" });
  }
});

// POST /api/warehouses - add warehouse
router.post("/", async (req, res) => {
  try {
    const { name, location } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "name is required" });
    }

    const warehouse = {
      id: await nextId(),
      name: name.trim(),
      location: location || ""
    };

    const db = getDB();

    await db.collection("warehouses").insertOne(warehouse);

    res.status(201).json(warehouse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add warehouse" });
  }
});

// PUT /api/warehouses/:id - update warehouse
router.put("/:id", async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection("warehouses");

    const { name, location } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Invalid warehouse name" });
      }
      updates.name = name.trim();
    }

    if (location !== undefined) {
      updates.location = location;
    }

    const result = await collection.updateOne(
      { id: req.params.id },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Warehouse not found" });
    }

    const warehouse = await collection.findOne({
      id: req.params.id
    });

    res.json(warehouse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update warehouse" });
  }
});

// DELETE /api/warehouses/:id - delete warehouse
router.delete("/:id", async (req, res) => {
  try {
    const db = getDB();

    await db.collection("warehouses").deleteOne({
      id: req.params.id
    });

    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete warehouse" });
  }
});

module.exports = router;
