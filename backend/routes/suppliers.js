const express = require("express");
const { db, nextId } = require("../db");
const router = express.Router();

router.get("/", (req, res) => {
  res.json(db.get("suppliers").value());
});

router.post("/", (req, res) => {
  const { name, contact } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const supplier = { id: nextId(), name, contact: contact || "" };
  db.get("suppliers").push(supplier).write();
  res.status(201).json(supplier);
});

router.put("/:id", (req, res) => {
  const supplier = db.get("suppliers").find({ id: req.params.id });
  if (!supplier.value()) return res.status(404).json({ error: "Supplier not found" });
  supplier.assign(req.body).write();
  res.json(supplier.value());
});

router.delete("/:id", (req, res) => {
  db.get("suppliers").remove({ id: req.params.id }).write();
  res.status(204).end();
});

module.exports = router;
