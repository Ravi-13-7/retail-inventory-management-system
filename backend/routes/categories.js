
const express = require("express");
const { getDB, nextId } = require("../db");

const router = express.Router();

// GET /api/categories - list all
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const categories = await db.collection("categories").find().toArray();

    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// POST /api/categories - create
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "name is required" });
    }

    const db = getDB();

    const category = {
      id: await nextId(),
      name: name.trim()
    };

    await db.collection("categories").insertOne(category);

    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// PUT /api/categories/:id - update
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Valid name is required" });
    }

    const db = getDB();
    const collection = db.collection("categories");

    const result = await collection.updateOne(
      { id: req.params.id },
      { $set: { name: name.trim() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    const updatedCategory = await collection.findOne({
      id: req.params.id
    });

    res.json(updatedCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update category" });
  }
});

// DELETE /api/categories/:id
router.delete("/:id", async (req, res) => {
  try {
    const db = getDB();

    const result = await db.collection("categories").deleteOne({
      id: req.params.id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

module.exports = router;
