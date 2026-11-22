import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Event from "../models/eventModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export async function backfillEventDates() {
  const uri = process.env.MONGO_DB_URI;
  if (!uri) {
    console.error("MONGO_DB_URI is not defined");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB for Event startAt/endAt backfill.");

  // Query events that need backfill (idempotent: only matches documents where startAt or endAt is missing/null)
  const query = {
    $or: [{ startAt: null }, { endAt: null }, { startAt: { $exists: false } }, { endAt: { $exists: false } }],
  };

  const eventsToBackfill = await Event.find(query);
  console.log(`Found ${eventsToBackfill.length} event(s) needing backfill.`);

  let updatedCount = 0;
  for (const event of eventsToBackfill) {
    let changed = false;

    if (
      event.eventDate &&
      event.startTime &&
      /^\d{4}-\d{2}-\d{2}$/.test(event.eventDate) &&
      /^\d{2}:\d{2}$/.test(event.startTime)
    ) {
      const startIso = `${event.eventDate}T${event.startTime}:00+05:30`;
      const start = new Date(startIso);
      if (!isNaN(start.getTime())) {
        event.startAt = start;
        changed = true;
      }
    }

    if (
      event.eventDate &&
      event.endTime &&
      /^\d{4}-\d{2}-\d{2}$/.test(event.eventDate) &&
      /^\d{2}:\d{2}$/.test(event.endTime)
    ) {
      const endIso = `${event.eventDate}T${event.endTime}:00+05:30`;
      const end = new Date(endIso);
      if (!isNaN(end.getTime())) {
        event.endAt = end;
        changed = true;
      }
    }

    if (changed) {
      await event.save();
      console.log(
        `✓ Updated event "${event.title}" (_id: ${event._id}): startAt=${event.startAt?.toISOString()} (${event.eventDate} ${event.startTime} IST), endAt=${event.endAt?.toISOString()} (${event.eventDate} ${event.endTime} IST)`
      );
      updatedCount++;
    }
  }

  console.log(`Backfill completed. ${updatedCount} event(s) updated.`);
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
  return updatedCount;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  backfillEventDates().catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  });
}
