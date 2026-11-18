const dns = require("dns");

if (process.platform === "win32") {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

require("dotenv").config();

const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

async function migrateData() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    const dataPath = path.join(__dirname, "data", "db.json");
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    await client.connect();

    const database = client.db(process.env.DB_NAME || "retail_ims");

    const collections = [
      "categories",
      "products",
      "warehouses",
      "inventory",
      "orders",
      "orderItems",
      "suppliers",
      "purchaseOrders",
      "poItems"
    ];

    // Check before importing anything
    for (const name of collections) {
      const count = await database.collection(name).countDocuments();

      if (count > 0) {
        throw new Error(
          `${name} already contains ${count} records. Migration stopped to protect existing data.`
        );
      }
    }

    const counterCount = await database
      .collection("counters")
      .countDocuments();

    if (counterCount > 0) {
      throw new Error("Counters already exist. Migration stopped.");
    }

    // Import existing records
    for (const name of collections) {
      const records = data[name] || [];

      if (records.length > 0) {
        await database.collection(name).insertMany(records);
      }

      console.log(`${name}: ${records.length} records imported`);
    }

    // Preserve the next available ID
    await database.collection("counters").insertOne({
      _id: "global",
      seq: (data._meta?.nextId || 1) - 1
    });

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

migrateData();
