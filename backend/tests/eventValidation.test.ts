import test, { describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Event from "../models/eventModel.js";
import Group from "../models/groupModel.js";
import Application from "../models/applicationModel.js";
import Comment from "../models/commentModel.js";
import Like from "../models/likeModel.js";
import Notification from "../models/notificationModel.js";
import Payment from "../models/paymentModel.js";
import Message from "../models/messageModel.js";
import JoinRequest from "../models/requestModel.js";
import {
  createEventSchema,
  validateImageFile,
  containsHtml,
  sanitizeString,
  getNowInTimezone,
  parseTimeToMinutes,
  isGoogleMapsUrl,
} from "../validation/eventValidation.js";
import { createEvent, updateEvent, deleteEvent } from "../controllers/eventController.js";

// Helper to mock req and res
const createMockReqRes = (body: any = {}, file?: any, user?: any, params: any = {}) => {
  const req: any = {
    body,
    file,
    user,
    params,
    cookies: {},
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

describe("Event Validation & Controller Security Unit Tests", () => {
  const mockUserId = new mongoose.Types.ObjectId();
  const mockUser = { _id: mockUserId, email: "organizer@example.com", role: "user" };

  describe("1. Basic Info & XSS Sanitization", () => {
    test("rejects title shorter than 3 chars or longer than 100 chars", () => {
      const resShort = createEventSchema.safeParse({
        title: "Hi",
        description: "This is a valid long description for the test event.",
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "12:00",
        technical: [{ name: "Hackathon", limit: 20 }],
        paid: false,
      });
      assert.equal(resShort.success, false);

      const resLong = createEventSchema.safeParse({
        title: "A".repeat(101),
        description: "This is a valid long description for the test event.",
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "12:00",
        technical: [{ name: "Hackathon", limit: 20 }],
        paid: false,
      });
      assert.equal(resLong.success, false);
    });

    test("rejects HTML tags in title and description to prevent XSS", () => {
      assert.equal(containsHtml("<script>alert(1)</script>"), true);
      assert.equal(containsHtml("<b>Bold</b>"), true);
      assert.equal(containsHtml("Clean Title"), false);

      const resHtmlTitle = createEventSchema.safeParse({
        title: "<script>alert('hack')</script>",
        description: "This is a valid long description for the test event.",
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "12:00",
        technical: [{ name: "Hackathon", limit: 20 }],
        paid: false,
      });
      assert.equal(resHtmlTitle.success, false);

      const resHtmlDesc = createEventSchema.safeParse({
        title: "Clean Event Title",
        description: "Description with <img src=x onerror=alert(1)> malicious tag",
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "12:00",
        technical: [{ name: "Hackathon", limit: 20 }],
        paid: false,
      });
      assert.equal(resHtmlDesc.success, false);
    });

    test("description must be at least 20 chars and at most 2000 chars", () => {
      const resShort = createEventSchema.safeParse({
        title: "Valid Title",
        description: "Too short",
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "12:00",
        technical: [{ name: "Hackathon", limit: 20 }],
        paid: false,
      });
      assert.equal(resShort.success, false);

      const resLong = createEventSchema.safeParse({
        title: "Valid Title",
        description: "A".repeat(2001),
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "12:00",
        technical: [{ name: "Hackathon", limit: 20 }],
        paid: false,
      });
      assert.equal(resLong.success, false);
    });
  });

  describe("2. Image Upload Validation", () => {
    test("rejects missing file in create mode", () => {
      const check = validateImageFile(undefined);
      assert.equal(check.isValid, false);
      assert.match(check.error || "", /image is required/i);
    });

    test("rejects invalid MIME types (e.g. gif, pdf, txt)", () => {
      const fakePdf: any = {
        mimetype: "application/pdf",
        size: 1024,
      };
      const checkPdf = validateImageFile(fakePdf);
      assert.equal(checkPdf.isValid, false);
      assert.match(checkPdf.error || "", /only jpg, png, and webp/i);

      const fakeGif: any = {
        mimetype: "image/gif",
        size: 1024,
      };
      const checkGif = validateImageFile(fakeGif);
      assert.equal(checkGif.isValid, false);
    });

    test("rejects files larger than 5 MB", () => {
      const largeFile: any = {
        mimetype: "image/png",
        size: 6 * 1024 * 1024, // 6 MB
      };
      const check = validateImageFile(largeFile);
      assert.equal(check.isValid, false);
      assert.match(check.error || "", /exceeds the 5 MB limit/i);
    });

    test("accepts valid JPG, PNG, and WebP files under 5 MB", () => {
      const validJpg: any = { mimetype: "image/jpeg", size: 2 * 1024 * 1024 };
      const validPng: any = { mimetype: "image/png", size: 1024 * 1024 };
      const validWebp: any = { mimetype: "image/webp", size: 500 * 1024 };

      assert.equal(validateImageFile(validJpg).isValid, true);
      assert.equal(validateImageFile(validPng).isValid, true);
      assert.equal(validateImageFile(validWebp).isValid, true);
    });
  });

  describe("3. Date & Time Validation with Timezone Strategy", () => {
    test("rejects dates in the past", () => {
      const res = createEventSchema.safeParse({
        title: "Valid Title",
        description: "This is a valid long description for the test event.",
        eventDate: "2020-01-01",
        startTime: "10:00",
        endTime: "12:00",
        technical: [{ name: "Hackathon", limit: 20 }],
        paid: false,
      });
      assert.equal(res.success, false);
    });

    test("rejects date more than 1 year in future", () => {
      const res = createEventSchema.safeParse({
        title: "Valid Title",
        description: "This is a valid long description for the test event.",
        eventDate: "2099-01-01",
        startTime: "10:00",
        endTime: "12:00",
        technical: [{ name: "Hackathon", limit: 20 }],
        paid: false,
      });
      assert.equal(res.success, false);
    });

    test("rejects endTime earlier than or equal to startTime (no overnight events)", () => {
      const resEqual = createEventSchema.safeParse({
        title: "Valid Title",
        description: "This is a valid long description for the test event.",
        eventDate: "2027-05-15",
        startTime: "14:00",
        endTime: "14:00",
        technical: [{ name: "Hackathon", limit: 20 }],
        paid: false,
      });
      assert.equal(resEqual.success, false);

      const resEarlier = createEventSchema.safeParse({
        title: "Valid Title",
        description: "This is a valid long description for the test event.",
        eventDate: "2027-05-15",
        startTime: "16:00",
        endTime: "10:00",
        technical: [{ name: "Hackathon", limit: 20 }],
        paid: false,
      });
      assert.equal(resEarlier.success, false);
    });

    test("enforces duration minimum 1 hour and maximum 8 hours", () => {
      // 30 mins duration -> reject
      const resShort = createEventSchema.safeParse({
        title: "Valid Title",
        description: "This is a valid long description for the test event.",
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "10:30",
        technical: [{ name: "Hackathon", limit: 20 }],
        paid: false,
      });
      assert.equal(resShort.success, false);

      // 9 hours duration -> reject
      const resLong = createEventSchema.safeParse({
        title: "Valid Title",
        description: "This is a valid long description for the test event.",
        eventDate: "2027-05-15",
        startTime: "09:00",
        endTime: "18:00",
        technical: [{ name: "Hackathon", limit: 20 }],
        paid: false,
      });
      assert.equal(resLong.success, false);

      // Exactly 1 hour -> valid
      const res1h = createEventSchema.safeParse({
        title: "Valid Title",
        description: "This is a valid long description for the test event.",
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "11:00",
        technical: [{ name: "Hackathon", limit: 20 }],
        paid: false,
      });
      assert.equal(res1h.success, true);

      // Exactly 8 hours -> valid
      const res8h = createEventSchema.safeParse({
        title: "Valid Title",
        description: "This is a valid long description for the test event.",
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "18:00",
        technical: [{ name: "Hackathon", limit: 20 }],
        paid: false,
      });
      assert.equal(res8h.success, true);
    });
  });

  describe("4. Sub-Events & Pricing Rules", () => {
    test("rejects when both technical and nonTechnical lists are empty", () => {
      const res = createEventSchema.safeParse({
        title: "Valid Title",
        description: "This is a valid long description for the test event.",
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "12:00",
        technical: [],
        nonTechnical: [],
        paid: false,
      });
      assert.equal(res.success, false);
    });

    test("rejects sub-event track with empty name or name > 50 chars", () => {
      const resEmptyName = createEventSchema.safeParse({
        title: "Valid Title",
        description: "This is a valid long description for the test event.",
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "12:00",
        technical: [{ name: "   ", limit: 10 }],
        paid: false,
      });
      assert.equal(resEmptyName.success, false);

      const resLongName = createEventSchema.safeParse({
        title: "Valid Title",
        description: "This is a valid long description for the test event.",
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "12:00",
        technical: [{ name: "X".repeat(51), limit: 10 }],
        paid: false,
      });
      assert.equal(resLongName.success, false);
    });

    test("rejects case-insensitive duplicate sub-event names within a category", () => {
      const res = createEventSchema.safeParse({
        title: "Valid Title",
        description: "This is a valid long description for the test event.",
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "12:00",
        technical: [
          { name: "Code Hack", limit: 10 },
          { name: "code hack", limit: 15 },
        ],
        paid: false,
      });
      assert.equal(res.success, false);
    });

    test("paid false forces amount to 0", () => {
      const res = createEventSchema.safeParse({
        title: "Valid Title",
        description: "This is a valid long description for the test event.",
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "12:00",
        technical: [{ name: "Code Hack", limit: 10 }],
        paid: false,
        amount: 500,
      });
      assert.equal(res.success, true);
      if (res.success) {
        assert.equal(res.data.amount, 0);
      }
    });

    test("paid true rejects amount <= 0, > 100000, NaN, or exponent notation (1e5)", () => {
      const resZero = createEventSchema.safeParse({
        title: "Valid Title",
        description: "This is a valid long description for the test event.",
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "12:00",
        technical: [{ name: "Code Hack", limit: 10 }],
        paid: true,
        amount: 0,
      });
      assert.equal(resZero.success, false);

      const resExp = createEventSchema.safeParse({
        title: "Valid Title",
        description: "This is a valid long description for the test event.",
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "12:00",
        technical: [{ name: "Code Hack", limit: 10 }],
        paid: true,
        amount: "1e5",
      });
      assert.equal(resExp.success, false);

      const resDecimals = createEventSchema.safeParse({
        title: "Valid Title",
        description: "This is a valid long description for the test event.",
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "12:00",
        technical: [{ name: "Code Hack", limit: 10 }],
        paid: true,
        amount: "99.999",
      });
      assert.equal(resDecimals.success, false);

      const resValid = createEventSchema.safeParse({
        title: "Valid Title",
        description: "This is a valid long description for the test event.",
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "12:00",
        technical: [{ name: "Code Hack", limit: 10 }],
        paid: true,
        amount: "99.50",
      });
      assert.equal(resValid.success, true);
    });
  });

  describe("5. Controller Request Validation & Security", () => {
    test("rejects request if server-managed fields are supplied in client body", async () => {
      const { req, res } = createMockReqRes(
        {
          title: "Hackathon",
          description: "This is a valid description for the test event.",
          userId: new mongoose.Types.ObjectId().toString(),
        },
        undefined,
        mockUser
      );

      await createEvent(req, res);
      assert.equal(res.statusCode, 400);
      assert.match(res.jsonData.error, /server-managed/i);
    });

    test("returns 401 when user is not authenticated", async () => {
      const { req, res } = createMockReqRes({}, undefined, null);
      await createEvent(req, res);
      assert.equal(res.statusCode, 401);
    });

    test("duplicate guard: prevents same user from creating identical title, date, startTime", async () => {
      const origFindOne = Event.findOne;
      (Event as any).findOne = () => Promise.resolve({ _id: new mongoose.Types.ObjectId() });

      try {
        const fakeFile: any = {
          mimetype: "image/png",
          size: 1024,
          buffer: Buffer.from("test"),
          originalname: "poster.png",
        };

        const { req, res } = createMockReqRes(
          {
            title: "Future Tech Fest",
            description: "A comprehensive tech conference with sessions and workshops.",
            eventDate: "2027-05-15",
            startTime: "10:00",
            endTime: "14:00",
            technicalEvents: JSON.stringify([{ name: "Coding", limit: 20 }]),
            paid: false,
          },
          fakeFile,
          mockUser
        );

        await createEvent(req, res);
        assert.equal(res.statusCode, 400);
        assert.match(res.jsonData.error, /duplicate event/i);
      } finally {
        (Event as any).findOne = origFindOne;
      }
    });

    test("updateEvent returns 403 when user is neither creator nor admin", async () => {
      const otherUser = { _id: new mongoose.Types.ObjectId(), role: "user" };
      const origFindById = Event.findById;
      (Event as any).findById = () =>
        Promise.resolve({
          _id: new mongoose.Types.ObjectId(),
          userId: mockUserId, // owned by mockUser, not otherUser
        });

      try {
        const { req, res } = createMockReqRes({}, undefined, otherUser, { id: "some-id" });
        await updateEvent(req, res);
        assert.equal(res.statusCode, 403);
      } finally {
        (Event as any).findById = origFindById;
      }
    });

    test("deleteEvent returns 401 when user is not authenticated", async () => {
      const { req, res } = createMockReqRes({}, undefined, null, { id: "some-id" });
      await deleteEvent(req, res);
      assert.equal(res.statusCode, 401);
    });

    test("deleteEvent returns 404 when event is not found", async () => {
      const origFindById = Event.findById;
      (Event as any).findById = () => Promise.resolve(null);

      try {
        const { req, res } = createMockReqRes({}, undefined, mockUser, { id: "missing-id" });
        await deleteEvent(req, res);
        assert.equal(res.statusCode, 404);
      } finally {
        (Event as any).findById = origFindById;
      }
    });

    test("deleteEvent returns 403 when caller is neither creator nor admin", async () => {
      const otherUser = { _id: new mongoose.Types.ObjectId(), role: "user" };
      const origFindById = Event.findById;
      (Event as any).findById = () =>
        Promise.resolve({
          _id: new mongoose.Types.ObjectId(),
          userId: mockUserId,
        });

      try {
        const { req, res } = createMockReqRes({}, undefined, otherUser, { id: "some-id" });
        await deleteEvent(req, res);
        assert.equal(res.statusCode, 403);
      } finally {
        (Event as any).findById = origFindById;
      }
    });

    test("deleteEvent succeeds and deletes event and all associated data for creator", async () => {
      const testEventId = new mongoose.Types.ObjectId();
      let eventDeleted = false;
      let groupsDeleted = false;
      let applicationsDeleted = false;
      let notificationsDeleted = false;

      const origFindById = Event.findById;
      const origGroupFind = Group.find;
      const origGroupDeleteMany = Group.deleteMany;
      const origAppDeleteMany = Application.deleteMany;
      const origCommentDeleteMany = Comment.deleteMany;
      const origLikeDeleteMany = Like.deleteMany;
      const origNotifDeleteMany = Notification.deleteMany;
      const origPaymentDeleteMany = Payment.deleteMany;
      const origMsgDeleteMany = Message.deleteMany;
      const origReqDeleteMany = JoinRequest.deleteMany;

      (Event as any).findById = () =>
        Promise.resolve({
          _id: testEventId,
          userId: mockUserId,
          deleteOne: async () => {
            eventDeleted = true;
          },
        });

      (Group as any).find = () => Promise.resolve([{ _id: new mongoose.Types.ObjectId() }]);
      (Group as any).deleteMany = async () => {
        groupsDeleted = true;
      };
      (Application as any).deleteMany = async () => {
        applicationsDeleted = true;
      };
      (Comment as any).deleteMany = async () => {};
      (Like as any).deleteMany = async () => {};
      (Notification as any).deleteMany = async () => {
        notificationsDeleted = true;
      };
      (Payment as any).deleteMany = async () => {};
      (Message as any).deleteMany = async () => {};
      (JoinRequest as any).deleteMany = async () => {};

      try {
        const { req, res } = createMockReqRes({}, undefined, mockUser, { id: testEventId.toString() });
        await deleteEvent(req, res);
        assert.equal(res.statusCode, 200);
        assert.equal(eventDeleted, true);
        assert.equal(groupsDeleted, true);
        assert.equal(applicationsDeleted, true);
        assert.equal(notificationsDeleted, true);
        assert.match(res.jsonData.message, /deleted successfully/i);
      } finally {
        (Event as any).findById = origFindById;
        (Group as any).find = origGroupFind;
        (Group as any).deleteMany = origGroupDeleteMany;
        (Application as any).deleteMany = origAppDeleteMany;
        (Comment as any).deleteMany = origCommentDeleteMany;
        (Like as any).deleteMany = origLikeDeleteMany;
        (Notification as any).deleteMany = origNotifDeleteMany;
        (Payment as any).deleteMany = origPaymentDeleteMany;
        (Message as any).deleteMany = origMsgDeleteMany;
        (JoinRequest as any).deleteMany = origReqDeleteMany;
      }
    });
  });

  describe("8. Venue & Location (Google Maps) Validation", () => {
    test("isGoogleMapsUrl correctly identifies valid and invalid Google Maps URLs", () => {
      assert.equal(isGoogleMapsUrl("https://maps.google.com/?q=MIT"), true);
      assert.equal(isGoogleMapsUrl("https://www.google.com/maps/search/?api=1&query=Stanford"), true);
      assert.equal(isGoogleMapsUrl("https://maps.app.goo.gl/wS78ABC123"), true);
      assert.equal(isGoogleMapsUrl("https://goo.gl/maps/XYZ987"), true);
      assert.equal(isGoogleMapsUrl("https://google.com/maps/place/Harvard"), true);
      assert.equal(isGoogleMapsUrl("https://www.google.co.in/maps/place/IIT"), true);

      // Invalid URLs
      assert.equal(isGoogleMapsUrl(""), false);
      assert.equal(isGoogleMapsUrl("https://facebook.com"), false);
      assert.equal(isGoogleMapsUrl("https://example.com/maps"), false);
      assert.equal(isGoogleMapsUrl("javascript:alert(1)"), false);
      assert.equal(isGoogleMapsUrl("not-a-url"), false);
    });

    test("accepts valid venue and valid Google Maps location link", () => {
      const result = createEventSchema.safeParse({
        title: "Campus Tech Fest 2027",
        description: "A grand inter-college tech symposium with workshops and hackathons.",
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "13:00",
        venue: "MIT Stata Center, Cambridge, MA",
        location: "https://www.google.com/maps/search/?api=1&query=MIT+Stata+Center",
        technical: [{ name: "Hackathon", limit: 20 }],
        paid: false,
      });
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.venue, "MIT Stata Center, Cambridge, MA");
        assert.equal(result.data.location, "https://www.google.com/maps/search/?api=1&query=MIT+Stata+Center");
      }
    });

    test("rejects venue or location containing HTML tags (XSS guard)", () => {
      const resVenueXss = createEventSchema.safeParse({
        title: "Campus Tech Fest 2027",
        description: "A grand inter-college tech symposium with workshops and hackathons.",
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "13:00",
        venue: "MIT Auditorium <script>alert('hack')</script>",
        location: "https://maps.google.com/?q=MIT",
        technical: [{ name: "Hackathon", limit: 20 }],
        paid: false,
      });
      assert.equal(resVenueXss.success, false);

      const resLocXss = createEventSchema.safeParse({
        title: "Campus Tech Fest 2027",
        description: "A grand inter-college tech symposium with workshops and hackathons.",
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "13:00",
        venue: "MIT Auditorium",
        location: "https://maps.google.com/?q=<script>alert(1)</script>",
        technical: [{ name: "Hackathon", limit: 20 }],
        paid: false,
      });
      assert.equal(resLocXss.success, false);
    });

    test("rejects invalid non-Google-Maps URL in location", () => {
      const result = createEventSchema.safeParse({
        title: "Campus Tech Fest 2027",
        description: "A grand inter-college tech symposium with workshops and hackathons.",
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "13:00",
        venue: "Stanford Campus",
        location: "https://some-random-domain.com/campus",
        technical: [{ name: "Hackathon", limit: 20 }],
        paid: false,
      });
      assert.equal(result.success, false);
      if (!result.success) {
        const locErr = result.error.issues.find((i) => i.path.includes("location"));
        assert.ok(locErr);
        assert.match(locErr.message, /valid Google Maps link/i);
      }
    });

    test("rejects venue exceeding 200 characters and location exceeding 1000 characters", () => {
      const resLongVenue = createEventSchema.safeParse({
        title: "Campus Tech Fest 2027",
        description: "A grand inter-college tech symposium with workshops and hackathons.",
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "13:00",
        venue: "V".repeat(201),
        location: "https://maps.google.com/?q=MIT",
        technical: [{ name: "Hackathon", limit: 20 }],
        paid: false,
      });
      assert.equal(resLongVenue.success, false);

      const resLongLoc = createEventSchema.safeParse({
        title: "Campus Tech Fest 2027",
        description: "A grand inter-college tech symposium with workshops and hackathons.",
        eventDate: "2027-05-15",
        startTime: "10:00",
        endTime: "13:00",
        venue: "MIT Auditorium",
        location: "https://maps.google.com/?" + "q=".repeat(500),
        technical: [{ name: "Hackathon", limit: 20 }],
        paid: false,
      });
      assert.equal(resLongLoc.success, false);
    });
  });
});
