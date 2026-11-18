
const express = require("express");
const { getDB, nextId } = require("../db");

const router = express.Router();

// GET /api/suppliers - get all suppliers
router.get("/", async (req, res) => {
  try {
    const db = getDB();

    const suppliers = await db.collection("suppliers")
      .find()
      .toArray();

    res.json(suppliers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
});

// POST /api/suppliers - add supplier
router.post("/", async (req, res) => {
  try {
    const { name, contact } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "name is required" });
    }

    const supplier = {
      id: await nextId(),
      name: name.trim(),
      contact: contact || ""
    };

    const db = getDB();

    await db.collection("suppliers").insertOne(supplier);

    res.status(201).json(supplier);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add supplier" });
  }
});

// PUT /api/suppliers/:id - update supplier
router.put("/:id", async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection("suppliers");

    const { name, contact } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Invalid supplier name" });
      }
      updates.name = name.trim();
    }

    if (contact !== undefined) {
      updates.contact = contact;
    }

    const result = await collection.updateOne(
      { id: req.params.id },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    const supplier = await collection.findOne({
      id: req.params.id
    });

    res.json(supplier);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update supplier" });
  }
});

// DELETE /api/suppliers/:id - delete supplier
router.delete("/:id", async (req, res) => {
  try {
    const db = getDB();

    await db.collection("suppliers").deleteOne({
      id: req.params.id
    });

    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete supplier" });
  }
});

module.exports = router;
