const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://darshraj3104_db_user:YOUR_PASSWORD@panditconnect.wtw6wzh.mongodb.net/";

async function testConnection() {
  const client = new MongoClient(uri);

  try {
    await client.connect();

    console.log("✅ Connected to MongoDB Atlas");

    const db = client.db("test_db");
    const collection = db.collection("test_collection");

    const insertResult = await collection.insertOne({
      name: "Darsh",
      createdAt: new Date(),
    });

    console.log("✅ Document inserted:", insertResult.insertedId);

    const document = await collection.findOne({
      _id: insertResult.insertedId,
    });

    console.log("✅ Document fetched:");
    console.log(document);

    const collections = await db.listCollections().toArray();
    console.log(
      "📂 Collections:",
      collections.map((c) => c.name)
    );
  } catch (error) {
    console.error("❌ Connection failed");
    console.error(error);
  } finally {
    await client.close();
  }
}

testConnection();