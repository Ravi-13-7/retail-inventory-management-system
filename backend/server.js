const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const categoriesRouter = require("./routes/categories");
const warehousesRouter = require("./routes/warehouses");
const productsRouter = require("./routes/products");
const inventoryRouter = require("./routes/inventory");
const suppliersRouter = require("./routes/suppliers");
const ordersRouter = require("./routes/orders");
const purchaseOrdersRouter = require("./routes/purchaseOrders");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "retail-ims-backend" }));

app.use("/api/categories", categoriesRouter);
app.use("/api/warehouses", warehousesRouter);
app.use("/api/products", productsRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/suppliers", suppliersRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/purchase-orders", purchaseOrdersRouter);

app.use((req, res) => res.status(404).json({ error: "Not found" }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Retail IMS backend running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
