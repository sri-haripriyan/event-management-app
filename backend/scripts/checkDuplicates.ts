import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function runCheck() {
  const uri = process.env.MONGO_DB_URI;
  if (!uri) {
    console.error("MONGO_DB_URI is not defined");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB for duplicate audit.");
  const db = mongoose.connection.db;
  if (!db) {
    console.error("Database connection not available");
    process.exit(1);
  }

  // 1. Collection stats
  const collections = ["payments", "applications", "events", "users", "groups", "joinrequests"];
  console.log("\n=== 1. Collection Document Counts ===");
  for (const colName of collections) {
    try {
      const count = await db.collection(colName).countDocuments();
      console.log(`- ${colName}: ${count} documents`);
    } catch (e: any) {
      console.log(`- ${colName}: error (${e.message})`);
    }
  }

  // 2. Existing indexes on collections
  console.log("\n=== 2. Existing Indexes ===");
  for (const colName of collections) {
    try {
      const idxs = await db.collection(colName).indexes();
      console.log(`- ${colName} indexes:`, idxs.map((i: any) => ({ name: i.name, key: i.key, unique: !!i.unique })));
    } catch (e: any) {
      console.log(`- ${colName}: error (${e.message})`);
    }
  }

  // 3. Payment razorpayPaymentId duplicates
  console.log("\n=== 3. Payment razorpayPaymentId Duplicates ===");
  const paymentIdDupes = await db.collection("payments").aggregate([
    { $match: { razorpayPaymentId: { $exists: true, $ne: null } } },
    { $group: { _id: "$razorpayPaymentId", count: { $sum: 1 }, ids: { $push: "$_id" } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  console.log(`Found ${paymentIdDupes.length} duplicate razorpayPaymentId values:`);
  console.dir(paymentIdDupes, { depth: null });

  // 4. Payment razorpayOrderId duplicates
  console.log("\n=== 4. Payment razorpayOrderId Duplicates ===");
  const orderIdDupes = await db.collection("payments").aggregate([
    { $match: { razorpayOrderId: { $exists: true, $ne: null } } },
    { $group: { _id: "$razorpayOrderId", count: { $sum: 1 }, ids: { $push: "$_id" } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  console.log(`Found ${orderIdDupes.length} duplicate razorpayOrderId values:`);
  console.dir(orderIdDupes, { depth: null });

  // 5. Application { eventId, userId, appliedTo } duplicates
  console.log("\n=== 5. Application { eventId, userId, appliedTo } Duplicates ===");
  const appDupes = await db.collection("applications").aggregate([
    {
      $group: {
        _id: { eventId: "$eventId", userId: "$userId", appliedTo: "$appliedTo" },
        count: { $sum: 1 },
        ids: { $push: "$_id" }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  console.log(`Found ${appDupes.length} duplicate Application compound values:`);
  console.dir(appDupes, { depth: null });

  // 6. Distinct values of roleType in users
  console.log("\n=== 6. User roleType distinct values ===");
  const distinctRoleTypes = await db.collection("users").distinct("roleType");
  console.log("Distinct roleType values in users collection:", distinctRoleTypes);

  // Also check role values (just in case role vs roleType is used)
  const distinctRoles = await db.collection("users").distinct("role");
  console.log("Distinct role values in users collection:", distinctRoles);

  // Count by roleType
  const roleTypeCounts = await db.collection("users").aggregate([
    { $group: { _id: "$roleType", count: { $sum: 1 } } }
  ]).toArray();
  console.log("roleType counts:", roleTypeCounts);

  await mongoose.disconnect();
  console.log("\nAudit finished and disconnected.");
}

runCheck().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
