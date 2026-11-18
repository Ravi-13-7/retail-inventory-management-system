
const express = require("express");
const { getDB, nextId } = require("../db");

const router = express.Router();

// GET /api/products - list all, with category name
router.get("/", async (req, res) => {
  try {
    const db = getDB();

    const categories = await db.collection("categories").find().toArray();
    const products = await db.collection("products").find().toArray();

    const result = products.map((product) => ({
      ...product,
      categoryName:
        categories.find((category) => category.id === product.categoryId)?.name || null
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const db = getDB();

    const product = await db.collection("products").findOne({
      id: req.params.id
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// POST /api/products
router.post("/", async (req, res) => {
  try {
    const { sku, name, price, categoryId } = req.body;

    if (!sku || !name) {
      return res.status(400).json({
        error: "sku and name are required"
      });
    }

    const db = getDB();

    const product = {
      id: await nextId(),
      sku,
      name,
      price: Number(price) || 0,
      categoryId: categoryId || null
    };

    await db.collection("products").insertOne(product);

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// PUT /api/products/:id
router.put("/:id", async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection("products");

    const updates = { ...req.body };

    // Protect the product ID
    delete updates.id;
    delete updates._id;

    if (updates.price !== undefined) {
      updates.price = Number(updates.price);

      if (!Number.isFinite(updates.price)) {
        return res.status(400).json({ error: "Invalid price" });
      }
    }

    const result = await collection.updateOne(
      { id: req.params.id },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const updatedProduct = await collection.findOne({
      id: req.params.id
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// DELETE /api/products/:id
router.delete("/:id", async (req, res) => {
  try {
    const db = getDB();

    await db.collection("products").deleteOne({
      id: req.params.id
    });

    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;
