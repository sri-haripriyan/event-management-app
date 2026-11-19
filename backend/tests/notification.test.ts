import { test, describe } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";
import Event from "../models/eventModel.js";
import Group from "../models/groupModel.js";
import JoinRequest from "../models/requestModel.js";
import Application from "../models/applicationModel.js";
import { createNotification } from "../utils/notification.js";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";
import { signUp } from "../controllers/authController.js";
import { approveRequest } from "../controllers/groupController.js";

const createMockReqRes = (body: any = {}, params: any = {}, query: any = {}, user: any = null) => {
  const req: any = {
    body,
    params,
    query,
    user,
  };
  const res: any = {
    statusCode: 200,
    jsonData: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.jsonData = data;
      return this;
    },
  };
  return { req, res };
};

describe("Notification Model & Controller Unit Tests", () => {
  const mockUserId = new mongoose.Types.ObjectId();
  const mockEventId = new mongoose.Types.ObjectId();
  const mockNotificationId = new mongoose.Types.ObjectId();

  test("1. Notification model creates with valid fields and default isRead = false", async () => {
    const origCreate = Notification.create;
    try {
      let createdDoc: any = null;
      (Notification as any).create = async (doc: any) => {
        createdDoc = {
          _id: mockNotificationId,
          ...doc,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return createdDoc;
      };

      const result = await createNotification({
        userId: mockUserId,
        title: "Test Notification",
        message: "This is a test notification message",
        type: "info",
        eventId: mockEventId,
        subEventName: "Hackathon",
      });

      assert.ok(result);
      assert.equal(result.title, "Test Notification");
      assert.equal(result.message, "This is a test notification message");
      assert.equal(result.type, "info");
      assert.equal(result.isRead, false);
      assert.equal(result.subEventName, "Hackathon");
    } finally {
      (Notification as any).create = origCreate;
    }
  });

  test("2. signUp creates welcome notification for newly registered user", async () => {
    const origFindOne = User.findOne;
    const origUserSave = User.prototype.save;
    const origNotifCreate = Notification.create;

    let notificationCreated: any = null;
    (User as any).findOne = async () => null;
    User.prototype.save = async function () {
      return {
        _id: mockUserId,
        userName: "testuser",
        email: "test@example.com",
        profile_image_url: "",
      };
    };
    (Notification as any).create = async (doc: any) => {
      notificationCreated = doc;
      return doc;
    };

    try {
      const { req, res } = createMockReqRes({
        userName: "testuser",
        email: "test@example.com",
        password: "password123",
      });

      await signUp(req, res);

      assert.equal(res.statusCode, 201);
      assert.ok(notificationCreated, "Welcome notification should be created");
      assert.equal(notificationCreated.type, "welcome");
      assert.match(notificationCreated.title, /Welcome/i);
    } finally {
      (User as any).findOne = origFindOne;
      User.prototype.save = origUserSave;
      (Notification as any).create = origNotifCreate;
    }
  });

  test("3. Registration for subevent creates notification 'Registered for this subevent in the event'", async () => {
    const origNotifCreate = Notification.create;
    const origJoinFind = JoinRequest.findById;
    const origJoinSave = JoinRequest.prototype.save;
    const origGroupUpdate = Group.findByIdAndUpdate;
    const origUserUpdate = User.findByIdAndUpdate;
    const origAppFind = Application.findOne;
    const origAppCreate = Application.create;
    const origEventFind = Event.findById;

    let notificationCreated: any = null;
    (Notification as any).create = async (doc: any) => {
      notificationCreated = doc;
      return doc;
    };

    const mockGroup = {
      _id: new mongoose.Types.ObjectId(),
      name: "Web Dev Workshop",
      eventId: mockEventId,
      admin: mockUserId,
      members: [],
      requests: [],
    };

    const mockJoinReq: any = {
      _id: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
      group: mockGroup,
      status: "pending",
      save: async () => {},
    };

    (JoinRequest as any).findById = () => ({
      populate: () => Promise.resolve(mockJoinReq),
    });
    (Group as any).findByIdAndUpdate = async () => mockGroup;
    (User as any).findByIdAndUpdate = async () => ({});
    (Application as any).findOne = async () => null;
    (Application as any).create = async () => ({ _id: new mongoose.Types.ObjectId() });
    (Event as any).findById = () => ({
      select: () => ({
        lean: () => Promise.resolve({ _id: mockEventId, title: "Tech Fest 2026" }),
      }),
    });

    try {
      const { req, res } = createMockReqRes(
        { requestId: mockJoinReq._id.toString(), action: "approve" },
        {},
        {},
        { _id: mockUserId, role: "admin" }
      );

      await approveRequest(req, res);

      assert.ok(notificationCreated, "Registration notification should be created");
      assert.equal(notificationCreated.title, "Registered for this subevent in the event");
      assert.equal(notificationCreated.type, "event_registration");
      assert.match(notificationCreated.message, /Registered for this subevent in the event/i);
      assert.match(notificationCreated.message, /Web Dev Workshop/i);
      assert.match(notificationCreated.message, /Tech Fest 2026/i);
    } finally {
      (Notification as any).create = origNotifCreate;
      (JoinRequest as any).findById = origJoinFind;
      (Group as any).findByIdAndUpdate = origGroupUpdate;
      (User as any).findByIdAndUpdate = origUserUpdate;
      (Application as any).findOne = origAppFind;
      (Application as any).create = origAppCreate;
      (Event as any).findById = origEventFind;
    }
  });

  test("4. getUserNotifications returns user's notifications and unreadCount", async () => {
    const origFind = Notification.find;
    const origCount = Notification.countDocuments;

    const mockList = [
      {
        _id: mockNotificationId,
        userId: mockUserId,
        title: "Registered for this subevent in the event",
        message: "Registered for CodeSprint in Hackathon 2026",
        isRead: false,
      },
    ];

    (Notification as any).find = () => ({
      populate: () => ({
        sort: () => ({
          limit: () => Promise.resolve(mockList),
        }),
      }),
    });
    (Notification as any).countDocuments = async () => 1;

    try {
      const { req, res } = createMockReqRes({}, {}, {}, { _id: mockUserId });
      await getUserNotifications(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.notifications.length, 1);
      assert.equal(res.jsonData.unreadCount, 1);
    } finally {
      (Notification as any).find = origFind;
      (Notification as any).countDocuments = origCount;
    }
  });

  test("5. markNotificationAsRead updates notification isRead to true", async () => {
    const origUpdate = Notification.findOneAndUpdate;

    (Notification as any).findOneAndUpdate = async (filter: any, update: any) => ({
      _id: filter._id,
      userId: filter.userId,
      isRead: update.isRead,
    });

    try {
      const { req, res } = createMockReqRes({}, { id: mockNotificationId.toString() }, {}, { _id: mockUserId });
      await markNotificationAsRead(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.isRead, true);
    } finally {
      (Notification as any).findOneAndUpdate = origUpdate;
    }
  });

  test("6. markAllNotificationsAsRead marks all user notifications as read", async () => {
    const origUpdateMany = Notification.updateMany;
    let updateFilter: any = null;

    (Notification as any).updateMany = async (filter: any, update: any) => {
      updateFilter = filter;
      return { modifiedCount: 3 };
    };

    try {
      const { req, res } = createMockReqRes({}, {}, {}, { _id: mockUserId });
      await markAllNotificationsAsRead(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.message, "All notifications marked as read");
      assert.equal(updateFilter.isRead, false);
    } finally {
      (Notification as any).updateMany = origUpdateMany;
    }
  });

  test("7. deleteNotification removes the notification", async () => {
    const origDelete = Notification.findOneAndDelete;

    (Notification as any).findOneAndDelete = async () => ({ _id: mockNotificationId });

    try {
      const { req, res } = createMockReqRes({}, { id: mockNotificationId.toString() }, {}, { _id: mockUserId });
      await deleteNotification(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.message, "Notification deleted successfully");
    } finally {
      (Notification as any).findOneAndDelete = origDelete;
    }
  });

  test("8. createNotification for event_created creates proper notification", async () => {
    let createdNotif: any = null;
    const origCreate = Notification.create;
    (Notification as any).create = async (doc: any) => {
      createdNotif = doc;
      return doc;
    };

    try {
      await createNotification({
        userId: mockUserId,
        eventId: mockEventId,
        title: "Event Created",
        message: 'You created event "Tech Gala 2026".',
        type: "event_created",
      });

      assert.ok(createdNotif);
      assert.equal(createdNotif.type, "event_created");
      assert.equal(createdNotif.title, "Event Created");
      assert.match(createdNotif.message, /Tech Gala 2026/);
    } finally {
      (Notification as any).create = origCreate;
    }
  });
});
