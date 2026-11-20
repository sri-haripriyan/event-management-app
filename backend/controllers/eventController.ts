import { InputFile } from "node-appwrite/file";
import Event from "../models/eventModel.js";
import Group from "../models/groupModel.js";
import Application from "../models/applicationModel.js";
import Comment from "../models/commentModel.js";
import Like from "../models/likeModel.js";
import Notification from "../models/notificationModel.js";
import Payment from "../models/paymentModel.js";
import Message from "../models/messageModel.js";
import JoinRequest from "../models/requestModel.js";
import logger from "../utils/logger.js";
import { ID } from "node-appwrite";
import { storage, bucketId, projectId, endpoint } from "../configs/appwrite.js";
import { createNotification } from "../utils/notification.js";
import {
  createEventSchema,
  validateImageFile,
  FORBIDDEN_SERVER_FIELDS,
} from "../validation/eventValidation.js";

export const createEvent = async (req: any, res: any) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "Unauthorized, please login" });
    }

    const body = req.body || {};

    // 1. Reject server-managed fields
    for (const field of FORBIDDEN_SERVER_FIELDS) {
      if (body[field] !== undefined) {
        return res.status(400).json({
          error: `Server-managed field '${field}' cannot be provided by client`,
          errors: { [field]: `Field '${field}' is server-managed and cannot be submitted` },
        });
      }
    }

    // Reject body.user if someone tries to spoof another user ID
    if (body.user !== undefined && String(body.user) !== String(req.user._id)) {
      return res.status(403).json({
        error: "Forbidden: Cannot create event on behalf of another user",
        errors: { user: "User ID mismatch" },
      });
    }

    // 2. Parse sub-events safely
    let technical: any[] = [];
    let nonTechnical: any[] = [];
    try {
      if (body.technicalEvents) {
        technical = typeof body.technicalEvents === "string" ? JSON.parse(body.technicalEvents) : body.technicalEvents;
      } else if (body.technical) {
        technical = typeof body.technical === "string" ? JSON.parse(body.technical) : body.technical;
      }
    } catch (_) {
      return res.status(400).json({
        error: "Invalid technical sub-events format",
        errors: { technical: "Invalid JSON format for technical sub-events" },
      });
    }

    try {
      if (body.nonTechnicalEvents) {
        nonTechnical = typeof body.nonTechnicalEvents === "string" ? JSON.parse(body.nonTechnicalEvents) : body.nonTechnicalEvents;
      } else if (body.nonTechnical) {
        nonTechnical = typeof body.nonTechnical === "string" ? JSON.parse(body.nonTechnical) : body.nonTechnical;
      }
    } catch (_) {
      return res.status(400).json({
        error: "Invalid non-technical sub-events format",
        errors: { nonTechnical: "Invalid JSON format for non-technical sub-events" },
      });
    }

    // 3. Prepare payload for validation
    const rawPayload = {
      title: body.title || body.eventName,
      description: body.description,
      eventDate: body.eventDate,
      startTime: body.startTime,
      endTime: body.endTime,
      timezone: body.timezone || "UTC",
      technical,
      nonTechnical,
      paid: body.paid === true || body.paid === "true",
      amount: body.amount !== undefined ? body.amount : 0,
      swags: body.swags === true || body.swags === "true",
      refreshments: body.refreshments === true || body.refreshments === "true",
    };

    // 4. Validate with Zod
    const validationResult = createEventSchema.safeParse(rawPayload);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      return res.status(400).json({
        error: "Validation failed",
        errors: fieldErrors,
      });
    }

    const validData = validationResult.data;

    // 5. Image validation (required on create)
    const imageCheck = validateImageFile(req.file);
    if (!imageCheck.isValid) {
      return res.status(400).json({
        error: imageCheck.error,
        errors: { imageUrl: imageCheck.error || "Event poster image is required" },
      });
    }

    // 6. Duplicate guard: same user cannot create identical title, date, startTime
    const escapedTitle = validData.title.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const duplicateEvent = await Event.findOne({
      userId: req.user._id,
      title: { $regex: new RegExp(`^${escapedTitle}$`, "i") },
      eventDate: validData.eventDate,
      startTime: validData.startTime,
    });

    if (duplicateEvent) {
      return res.status(400).json({
        error: "Duplicate event detected",
        errors: {
          title: "You have already created an event with this title, date, and start time",
        },
      });
    }

    // 7. Upload to Appwrite storage
    let fileId = "";
    let link = "";
    try {
      const r = await storage.createFile(
        bucketId,
        ID.unique(),
        InputFile.fromBuffer(req.file.buffer, req.file.originalname || "name")
      );
      fileId = r.$id;
      link = `${endpoint}/storage/buckets/${bucketId}/files/${r.$id}/view?project=${projectId}`;
    } catch (uploadError: any) {
      logger.error("Appwrite upload failed:", uploadError);
      return res.status(500).json({
        error: "Failed to upload event poster image",
        errors: { imageUrl: "Image upload failed. Please try again." },
      });
    }

    // 8. Create event document in MongoDB
    const event = new Event({
      title: validData.title,
      description: validData.description,
      userId: req.user._id, // Enforce auth token ID
      imageUrl: link,
      fileId,
      technical: validData.technical,
      nonTechnical: validData.nonTechnical,
      eventDate: validData.eventDate,
      startTime: validData.startTime,
      endTime: validData.endTime,
      swags: validData.swags,
      refreshments: validData.refreshments,
      amount: validData.paid ? validData.amount : 0,
      paid: validData.paid,
    });

    const newEvent = await event.save();

    // 9. Create sub-event groups
    const technicalGroups = validData.technical.map((data) => ({
      name: data.name,
      description: validData.description,
      eventId: newEvent._id,
      admin: req.user._id,
      members: [req.user._id],
      isHead: false,
      limit: data.limit,
    }));

    const nonTechnicalGroups = validData.nonTechnical.map((data) => ({
      name: data.name,
      description: validData.description,
      eventId: newEvent._id,
      admin: req.user._id,
      members: [req.user._id],
      isHead: false,
      limit: data.limit,
    }));

    const headGroup = {
      name: "Moderators",
      description: validData.description,
      eventId: newEvent._id,
      admin: req.user._id,
      members: [req.user._id],
      isHead: true,
      limit: 15,
    };

    await Promise.all([
      Group.insertMany(technicalGroups),
      Group.insertMany(nonTechnicalGroups),
      new Group(headGroup).save(),
    ]);

    // 10. Create notification for event creator
    await createNotification({
      userId: newEvent.userId,
      eventId: newEvent._id,
      title: "Event Created",
      message: `You created event "${newEvent.title}". Manage tracks, view registrations, and coordinate attendance.`,
      type: "event_created",
    });

    return res.status(201).json({ message: "event created", data: newEvent });
  } catch (error: any) {
    logger.error("Create event controller error", error.message);
    return res.status(400).json({ error: error.message });
  }
};
export const updateEvent = async (req: any, res: any) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "Unauthorized, please login" });
    }

    const event = await Event.findById(req.params.id);
    if (event == null) {
      return res.status(404).json({ message: "Event not found" });
    }

    const isCreator = req.user?._id?.toString() === event.userId?.toString();
    const isSuperAdmin = req.user?.role === "admin";
    if (!isCreator && !isSuperAdmin) {
      return res.status(403).json({
        error: "Forbidden: you are not authorized to edit this event",
      });
    }

    const body = req.body || {};

    // Reject server-managed fields
    for (const field of FORBIDDEN_SERVER_FIELDS) {
      if (body[field] !== undefined) {
        return res.status(400).json({
          error: `Server-managed field '${field}' cannot be provided by client`,
          errors: { [field]: `Field '${field}' is server-managed and cannot be modified` },
        });
      }
    }

    if (body.user !== undefined && String(body.user) !== String(event.userId)) {
      return res.status(403).json({
        error: "Forbidden: Cannot change event ownership",
        errors: { user: "Cannot change event owner" },
      });
    }

    if (req.file) {
      const fileCheck = validateImageFile(req.file);
      if (!fileCheck.isValid) {
        return res.status(400).json({
          error: fileCheck.error,
          errors: { imageUrl: fileCheck.error },
        });
      }
    }

    // Parse sub-events if passed as JSON string from FormData
    let technical = event.technical;
    let nonTechnical = event.nonTechnical;
    if (body.technicalEvents !== undefined || body.technical !== undefined) {
      const rawTech = body.technicalEvents !== undefined ? body.technicalEvents : body.technical;
      technical = typeof rawTech === "string" ? JSON.parse(rawTech) : rawTech;
    }
    if (body.nonTechnicalEvents !== undefined || body.nonTechnical !== undefined) {
      const rawNonTech = body.nonTechnicalEvents !== undefined ? body.nonTechnicalEvents : body.nonTechnical;
      nonTechnical = typeof rawNonTech === "string" ? JSON.parse(rawNonTech) : rawNonTech;
    }

    const rawPayload = {
      title: body.title || body.eventName || event.title,
      description: body.description || event.description,
      eventDate: body.eventDate || event.eventDate,
      startTime: body.startTime || event.startTime,
      endTime: body.endTime || event.endTime,
      timezone: body.timezone || "UTC",
      technical,
      nonTechnical,
      paid: body.paid !== undefined ? (body.paid === true || body.paid === "true") : event.paid,
      amount: body.amount !== undefined ? body.amount : event.amount,
      swags: body.swags !== undefined ? (body.swags === true || body.swags === "true") : event.swags,
      refreshments: body.refreshments !== undefined ? (body.refreshments === true || body.refreshments === "true") : event.refreshments,
      existingImageUrl: event.imageUrl,
    };

    const validationResult = createEventSchema.safeParse(rawPayload);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      return res.status(400).json({
        error: "Validation failed",
        errors: fieldErrors,
      });
    }

    const validData = validationResult.data;

    if (req.file) {
      if (event.fileId) {
        try {
          await storage.getFile(bucketId, event.fileId);
          await storage.deleteFile(bucketId, event.fileId);
        } catch (error) {
          console.warn("File not found, skipping delete.");
        }
      }
      const r = await storage.createFile(
        bucketId,
        ID.unique(),
        InputFile.fromBuffer(req.file.buffer, req.file.originalname || "name")
      );
      const link = `${endpoint}/storage/buckets/${bucketId}/files/${r.$id}/view?project=${projectId}`;
      event.fileId = r.$id;
      event.imageUrl = link || event.imageUrl;
    }

    event.title = validData.title;
    event.description = validData.description;
    event.eventDate = validData.eventDate;
    event.startTime = validData.startTime;
    event.endTime = validData.endTime;
    event.technical = validData.technical as any;
    event.nonTechnical = validData.nonTechnical as any;
    event.paid = validData.paid;
    event.amount = validData.paid ? validData.amount : 0;
    event.swags = validData.swags;
    event.refreshments = validData.refreshments;

    const updatedevent = await event.save();

    // Synchronize sub-event groups
    if (technical || nonTechnical) {
      const allNewTracks = [
        ...(Array.isArray(technical) ? technical : []),
        ...(Array.isArray(nonTechnical) ? nonTechnical : []),
      ];

      for (const track of allNewTracks) {
        if (!track?.name) continue;
        const existingGroup = await Group.findOne({ eventId: event._id, name: track.name, isHead: false });
        if (existingGroup) {
          if (track.limit !== undefined) existingGroup.limit = track.limit;
          existingGroup.description = event.description;
          await existingGroup.save();
        } else {
          await Group.create({
            name: track.name,
            description: event.description,
            eventId: event._id,
            admin: event.userId,
            members: [req.user._id],
            isHead: false,
            limit: track.limit || 0,
          });
        }
      }
    }

    // Keep head group title and description in sync
    await Group.updateOne(
      { eventId: event._id, isHead: true },
      { name: "Moderators", description: event.description }
    );

    res.status(200).json({
      updatedevent,
      message: "Event updated successfully",
    });
  } catch (error) {
    logger.error("update event controller error: " + error.message);
    res.status(400).json({ error: error.message });
  }
};
export const deleteEvent = async (req: any, res: any) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "Unauthorized, please login" });
    }

    const event = await Event.findById(req.params.id);
    if (event == null) {
      return res.status(404).json({ message: "Event not found!" });
    }

    const eventUserId = event.userId?._id
      ? event.userId._id.toString()
      : event.userId
      ? event.userId.toString()
      : null;

    const isCreator = req.user._id.toString() === eventUserId;
    const isSuperAdmin = req.user.role === "admin";

    if (!isCreator && !isSuperAdmin) {
      return res.status(403).json({
        error: "Unauthorized! You are not authorized to delete this event",
      });
    }

    try {
      if (event.fileId) {
        await storage.deleteFile(bucketId, event.fileId);
      }
    } catch (delErr) {
      logger.warn("Could not delete file from Appwrite: " + delErr);
    }

    // Find all groups for this event to delete group-associated messages and requests
    const groups = await Group.find({ eventId: event._id });
    const groupIds = groups.map((g) => g._id);

    // Delete event and all its associated data
    await Promise.all([
      event.deleteOne(),
      Group.deleteMany({ eventId: event._id }),
      Application.deleteMany({ eventId: event._id }),
      Comment.deleteMany({ event: event._id }),
      Like.deleteMany({ eventId: event._id }),
      Notification.deleteMany({ eventId: event._id }),
      Payment.deleteMany({ eventId: event._id }),
      Message.deleteMany({ groupId: { $in: groupIds } }),
      JoinRequest.deleteMany({ group: { $in: groupIds } }),
    ]);

    res.status(200).json({ message: "Event and all associated data deleted successfully" });
  } catch (error: any) {
    logger.error("delete event controller error: " + error.message);
    res.status(400).json({ error: error.message });
  }
};
export const getEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const userId = req.query.userId;
    const events = await Event.find(userId ? { userId } : {})
      .populate("userId", "-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const totalEvents = await Event.countDocuments();
    if (events == null || totalEvents === 0) {
      return res.status(200).json({ message: " No event Found" });
    }
    res.json({
      events,
      success: true,
      page,
      totalEvents,
      totalPages: Math.ceil(totalEvents / limit),
    });
  } catch (error) {
    logger.error("getEvents  controller error" + error.message);
    res.status(400).json({ error: error.message });
  }
};
export const getEventById = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const event = await Event.findById(eventId).populate("userId", [
      "-password",
    ]);

    if (event == null) {
      return res.status(200).json({ message: " Event Not Found" });
    }

    res.json({ event: event });
  } catch (error) {
    logger.error("getEventById  controller error" + error.message);
    res.status(400).json({ error: error.message });
  }
};
