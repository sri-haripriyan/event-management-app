import { InputFile } from "node-appwrite/file";
import Event from "../models/eventModel.js";
import Group from "../models/groupModel.js";
import logger from "../utils/logger.js";
import { ID } from "node-appwrite";
import { storage, bucketId, projectId, endpoint } from "../configs/appwrite.js";

export const createEvent = async (req, res) => {
  try {
    const body = req.body;
    const technical = JSON.parse(body.technicalEvents);
    const nonTechnical = JSON.parse(body.nonTechnicalEvents);

    const r = await storage.createFile(
      bucketId,
      ID.unique(),
      InputFile.fromBuffer(req.file.buffer, req.file.originalname || "name")
    );
    const link = `${endpoint}/storage/buckets/${bucketId}/files/${r.$id}/view?project=${projectId}`;
    const event = new Event({
      title: body.title,
      description: body.description,
      userId: body.user,
      imageUrl: link,
      fileId: r.$id,
      technical: technical,
      nonTechnical: nonTechnical,
      eventDate: body.eventDate,
      startTime: body.startTime,
      endTime: body.endTime,
      swags: body.swags,
      refreshments: body.refreshments,
      amount: body.amount,
      paid: body.paid,
    });
    const newEvent = await event.save();
    const technicalGroups = technical.map((data) => {
      return {
        name: data.name,
        description: body.description,
        eventId: newEvent._id,
        admin: body.user,
        members: [req.user._id],
        isHead: false,
        limit: data.limit,
      };
    });
    const nonTechnicalGroups = nonTechnical.map((data) => {
      return {
        name: data.name,
        description: body.description,
        eventId: newEvent._id,
        admin: body.user,
        members: [req.user._id],
        isHead: false,
        limit: data.limit,
      };
    });
    const headGroup = {
      name: body.title,
      description: body.description,
      eventId: newEvent._id,
      admin: body.user,
      members: [req.user._id],
      isHead: true,
      limit: 15,
    };
    Promise.all([
      Group.insertMany(technicalGroups),
      Group.insertMany(nonTechnicalGroups),
      new Group(headGroup).save(),
    ]).catch((err) => {
      throw err;
    });

    res.status(201).json({ message: "event created", data: newEvent });
  } catch (error) {
    logger.error("Create event controller error", error.message);
    console.log(error);
    return res.status(400).json({ error: error.message });
  }
};
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (event == null) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (req.user._id.toString() !== event.userId.toString()) {
      return res.status(401).json({
        error: "unautorized you are not able to edit the event",
      });
    }
    if (req.file) {
      if (req.file && event.fileId) {
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
    event.title = req.body.title || event.title;
    event.description = req.body.description || event.description;
    event.userId = req.user._id || event.userId;
    event.technical = req.body.technical || event.technical;
    event.nonTechnical = req.body.nonTechnical || event.nonTechnical;
    event.startTime = req.body.startTime || event.startTime;
    event.endTime = req.body.endTime || event.endTime;
    event.swags = req.body.swags;
    event.refreshments = req.body.refreshments;
    const updatedevent = await event.save();
    res.status(200).json({
      updatedevent,
      message: "Event updated successfully",
    });
  } catch (error) {
    logger.error("update event controller error" + error.message);
    res.status(400).json({ error: error.message });
  }
};
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("userId");
    if (event == null) {
      return res.status(404).json({ message: "Event not found!" });
    }

    if (req.user._id.toString() !== event.userId._id.toString()) {
      return res.status(401).json({
        error: "Unauthorized! You are not able to delete the event",
      });
    }
    try {
      if (event.fileId) {
        await storage.deleteFile(bucketId, event.fileId);
      }
    } catch (delErr) {
      console.warn("Could not delete file from Appwrite: " + delErr);
    }

    await Promise.all([
      event.deleteOne(),
      Group.deleteMany({ eventId: event._id }),
    ]);

    // const user = await User.findById(event.user._id);

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    logger.error("delete event controller error" + error);
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
