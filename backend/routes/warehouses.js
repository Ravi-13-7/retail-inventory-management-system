const express = require("express");
const { db, nextId } = require("../db");
const router = express.Router();

router.get("/", (req, res) => {
  res.json(db.get("warehouses").value());
});

router.post("/", (req, res) => {
  const { name, location } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const warehouse = { id: nextId(), name, location: location || "" };
  db.get("warehouses").push(warehouse).write();
  res.status(201).json(warehouse);
});

router.put("/:id", (req, res) => {
  const warehouse = db.get("warehouses").find({ id: req.params.id });
  if (!warehouse.value()) return res.status(404).json({ error: "Warehouse not found" });
  warehouse.assign(req.body).write();
  res.json(warehouse.value());
});

router.delete("/:id", (req, res) => {
  db.get("warehouses").remove({ id: req.params.id }).write();
  res.status(204).end();
});

module.exports = router;
