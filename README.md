# Retail Inventory Management System (RIMS)

A working full-stack prototype built for Capstone Project P_022 — covering
Product Catalog, Multi-Warehouse Inventory, Order Fulfillment, and
Supplier / Purchase Order management.

- **Backend:** Node.js + Express, with a JSON-file database (lowdb) — no
  native modules, no external database server needed, runs anywhere Node runs.
- **Frontend:** React + Vite, plain CSS (no framework lock-in).

This is a prototype of the core epics, not the full 15-sprint, cloud-deployed,
CI/CD-piped production system described in the capstone brief — see
"What's included vs. what's not" below.

---

## 1. Requirements

- [Node.js](https://nodejs.org/) version 18 or later (18, 20, or 22 all work)
- npm (comes with Node)

Check your versions:
```bash
node -v
npm -v
```

---

## 2. Run the Backend

```bash
cd backend
npm install
npm run seed     # creates backend/data/db.json with sample data
npm start        # starts the API on http://localhost:4000
```

Leave this running in its own terminal. Confirm it's up:
```bash
curl http://localhost:4000/api/health
# {"status":"ok","service":"retail-ims-backend"}
```

## 3. Run the Frontend

Open a **second terminal**:
```bash
cd frontend
npm install
npm run dev       # starts the UI on http://localhost:5173
```

Open **http://localhost:5173** in your browser. The frontend automatically
proxies `/api/*` requests to the backend on port 4000 (see `vite.config.js`),
so both must be running at the same time.

---

## 4. What's Included

| Epic | What you can do in the app |
|---|---|
| **Product Catalog** | Add categories, add products with SKU/price/category |
| **Multi-Warehouse Inventory** | View stock per product per warehouse, add/top-up stock, transfer stock between warehouses, add new warehouses |
| **Order Fulfillment** | Create a multi-item order against a warehouse, advance it through Confirmed → Picked → Packed → Shipped. Stock is deducted on Ship, and the app blocks shipment with a clear error if stock is insufficient |
| **Supplier & Purchase Orders** | Add suppliers, create multi-item purchase orders, advance through Draft → Sent → Confirmed → Received → Closed. Stock is added automatically when a PO is marked Received |
| **Dashboard** | Live counts (products, warehouses, orders, POs, total units) and a low-stock alert table |

The database schema matches the ER diagram from the project documentation:
`Category → Product → Inventory ← Warehouse`, `Order → OrderItem → Product`,
`Supplier → PurchaseOrder → POItem → Product`.

---

## 5. What's Not Included (and why)

This is a working prototype of the core application, not the full enterprise
delivery described in the capstone brief. Specifically **not** included:

- **Cloud deployment** (AWS/Azure) — the app runs locally; deploying it is an
  infrastructure exercise on top of this code, not a code change.
- **Docker / Kubernetes** — no Dockerfile or K8s manifests are included yet.
  Ask if you'd like a `Dockerfile` + `docker-compose.yml` added — they're
  straightforward to add on top of this codebase.
- **A live Jenkins CI/CD pipeline** — the CI/CD *design* (stages, tools) is in
  the project documentation; an actual Jenkinsfile can be added on request.
- **Authentication / role-based access** (Admin, Warehouse Manager, etc.) —
  the prototype has no login; every user currently has full access.
- **A real relational database** (MySQL/PostgreSQL) — the prototype uses a
  JSON file (`backend/data/db.json`) for zero-setup simplicity. The data
  shapes match the ER diagram closely enough that swapping in a real SQL
  database later is a backend-only change — the frontend wouldn't need to change.
- **Multi-sprint Agile delivery** — this was built as one working codebase in
  a single session, not across 15 sprints by a team.

---

## 6. Project Structure

```
retail-ims/
├── backend/
│   ├── server.js          # Express app entry point
│   ├── db.js               # JSON-file database setup (lowdb)
│   ├── seed.js              # Sample data loader
│   └── routes/
│       ├── categories.js
│       ├── warehouses.js
│       ├── products.js
│       ├── inventory.js     # includes stock transfer logic
│       ├── suppliers.js
│       ├── orders.js        # includes fulfillment flow logic
│       └── purchaseOrders.js # includes PO receiving logic
├── frontend/
│   └── src/
│       ├── pages/            # Dashboard, Products, Inventory, Orders, Suppliers
│       ├── components/       # Nav, Table
│       ├── api.js            # all backend calls in one place
│       └── styles.css
└── README.md (this file)
```

## 7. Resetting the Data

To wipe and reseed the database at any time:
```bash
cd backend
rm -f data/db.json
npm run seed
```
