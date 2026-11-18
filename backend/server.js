const dns = require("dns");

if (process.platform === "win32") {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

require("dotenv").config();
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { connectDB } = require("./db");

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

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "retail-ims-backend"
  });
});

app.use("/api/categories", categoriesRouter);
app.use("/api/warehouses", warehousesRouter);
app.use("/api/products", productsRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/suppliers", suppliersRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/purchase-orders", purchaseOrdersRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Retail IMS backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error);
    process.exit(1);
  }
}

startServer();
