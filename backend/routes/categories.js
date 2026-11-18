const express = require("express");
const { db, nextId } = require("../db");
const router = express.Router();

// GET /api/categories — list all
router.get("/", (req, res) => {
  res.json(db.get("categories").value());
});

// POST /api/categories — create
router.post("/", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const category = { id: nextId(), name };
  db.get("categories").push(category).write();
  res.status(201).json(category);
});

// PUT /api/categories/:id — update
router.put("/:id", (req, res) => {
  const category = db.get("categories").find({ id: req.params.id });
  if (!category.value()) return res.status(404).json({ error: "Category not found" });
  category.assign(req.body).write();
  res.json(category.value());
});

// DELETE /api/categories/:id
router.delete("/:id", (req, res) => {
  db.get("categories").remove({ id: req.params.id }).write();
  res.status(204).end();
});

module.exports = router;
