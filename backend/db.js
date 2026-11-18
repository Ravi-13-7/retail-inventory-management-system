const dns = require("dns");

if (process.platform === "win32") {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}
const { MongoClient } = require("mongodb");

let client;
let database;

async function connectDB() {
  if (database) return database;

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing in .env file");
  }

  client = new MongoClient(uri);

  await client.connect();

  database = client.db(process.env.DB_NAME || "retail_ims");

  console.log("MongoDB connected successfully");

  return database;
}

function getDB() {
  if (!database) {
    throw new Error("Database is not connected. Call connectDB() first.");
  }

  return database;
}

function getClient() {
  if (!client) {
    throw new Error("MongoDB client is not connected.");
  }
  return client;
}


async function nextId() {
  const counters = getDB().collection("counters");

  const counter = await counters.findOneAndUpdate(
    { _id: "global" },
    { $inc: { seq: 1 } },
    {
      upsert: true,
      returnDocument: "after",
      includeResultMetadata: false
    }
  );

  if (!counter) {
    throw new Error("Failed to generate next ID");
  }

  return String(counter.seq);
}


module.exports = {
  connectDB,
  getDB,
  nextId,
  getClient
};
