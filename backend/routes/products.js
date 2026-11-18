const express = require("express");
const { db, nextId } = require("../db");
const router = express.Router();

// GET /api/products — list all, with category name joined in
router.get("/", (req, res) => {
  const categories = db.get("categories").value();
  const products = db.get("products").value().map((p) => ({
    ...p,
    categoryName: categories.find((c) => c.id === p.categoryId)?.name || null
  }));
  res.json(products);
});

router.get("/:id", (req, res) => {
  const product = db.get("products").find({ id: req.params.id }).value();
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

router.post("/", (req, res) => {
  const { sku, name, price, categoryId } = req.body;
  if (!sku || !name) return res.status(400).json({ error: "sku and name are required" });
  const product = { id: nextId(), sku, name, price: Number(price) || 0, categoryId: categoryId || null };
  db.get("products").push(product).write();
  res.status(201).json(product);
});

router.put("/:id", (req, res) => {
  const product = db.get("products").find({ id: req.params.id });
  if (!product.value()) return res.status(404).json({ error: "Product not found" });
  product.assign(req.body).write();
  res.json(product.value());
});

router.delete("/:id", (req, res) => {
  db.get("products").remove({ id: req.params.id }).write();
  res.status(204).end();
});

module.exports = router;
