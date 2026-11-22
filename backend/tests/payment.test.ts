import { test, describe } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Event from "../models/eventModel.js";
import Group from "../models/groupModel.js";
import Payment from "../models/paymentModel.js";
import Application from "../models/applicationModel.js";
import {
  getPaymentSummary,
  createOrder,
  verifyPayment,
  getEventPaymentHistory,
} from "../controllers/paymentControllers.js";

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

describe("Payment Controller & Summary Unit Tests", () => {
  const mockUserId = new mongoose.Types.ObjectId();
  const mockEventId = new mongoose.Types.ObjectId();
  const mockGroupId1 = new mongoose.Types.ObjectId();
  const mockGroupId2 = new mongoose.Types.ObjectId();

  test("1. getPaymentSummary returns 400 if eventId is missing", async () => {
    const { req, res } = createMockReqRes({}, {}, {}, { _id: mockUserId });
    await getPaymentSummary(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.jsonData.message, /eventId is required/i);
  });

  test("2. getPaymentSummary returns 404 if event does not exist", async () => {
    const origFindById = Event.findById;
    (Event as any).findById = () => Promise.resolve(null);

    try {
      const { req, res } = createMockReqRes({}, { eventId: mockEventId.toString() }, {}, { _id: mockUserId });
      await getPaymentSummary(req, res);
      assert.equal(res.statusCode, 404);
      assert.match(res.jsonData.message, /Event not found/i);
    } finally {
      (Event as any).findById = origFindById;
    }
  });

  test("3. getPaymentSummary correctly calculates totalAmount from server event.amount and subevents", async () => {
    const origEventFindById = Event.findById;
    const origGroupFind = Group.find;
    const origPaymentFind = Payment.find;

    (Event as any).findById = () =>
      Promise.resolve({
        _id: mockEventId,
        title: "Tech Summit 2026",
        paid: true,
        amount: 250,
        imageUrl: "https://example.com/image.png",
      });

    (Group as any).find = () =>
      Promise.resolve([
        {
          _id: mockGroupId1,
          name: "Hackathon Track",
          limit: 50,
          members: [],
          moderators: [],
        },
        {
          _id: mockGroupId2,
          name: "Coding Contest",
          limit: 40,
          members: [],
          moderators: [],
        },
      ]);

    (Payment as any).find = () => ({
      select: () => ({
        lean: () => Promise.resolve([]),
      }),
    });

    try {
      const { req, res } = createMockReqRes(
        {},
        { eventId: mockEventId.toString() },
        { groupIds: `${mockGroupId1},${mockGroupId2}` },
        { _id: mockUserId }
      );

      await getPaymentSummary(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.success, true);
      assert.equal(res.jsonData.unitPrice, 250);
      assert.equal(res.jsonData.totalSelected, 2);
      assert.equal(res.jsonData.totalAmount, 500); // 2 * 250 = 500
      assert.equal(res.jsonData.totalAmountInPaise, 50000);
      assert.equal(res.jsonData.items.length, 2);
      assert.equal(res.jsonData.items[0].isAlreadyPaid, false);
    } finally {
      (Event as any).findById = origEventFindById;
      (Group as any).find = origGroupFind;
      (Payment as any).find = origPaymentFind;
    }
  });

  test("4. getPaymentSummary marks already paid subevents and adjusts chargeable count", async () => {
    const origEventFindById = Event.findById;
    const origGroupFind = Group.find;
    const origPaymentFind = Payment.find;

    (Event as any).findById = () =>
      Promise.resolve({
        _id: mockEventId,
        title: "Tech Summit 2026",
        paid: true,
        amount: 300,
      });

    (Group as any).find = () =>
      Promise.resolve([
        {
          _id: mockGroupId1,
          name: "Hackathon Track",
          limit: 50,
          members: [],
          moderators: [],
        },
        {
          _id: mockGroupId2,
          name: "Coding Contest",
          limit: 40,
          members: [],
          moderators: [],
        },
      ]);

    // mockGroupId1 is already paid
    (Payment as any).find = () => ({
      select: () => ({
        lean: () => Promise.resolve([{ groupId: mockGroupId1 }]),
      }),
    });

    try {
      const { req, res } = createMockReqRes(
        {},
        { eventId: mockEventId.toString() },
        { groupIds: `${mockGroupId1},${mockGroupId2}` },
        { _id: mockUserId }
      );

      await getPaymentSummary(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.totalSelected, 2);
      assert.equal(res.jsonData.chargeableCount, 1);
      assert.equal(res.jsonData.totalAmount, 300); // Only 1 chargeable item = 300
      assert.equal(res.jsonData.items.find((i: any) => i._id.toString() === mockGroupId1.toString()).isAlreadyPaid, true);
    } finally {
      (Event as any).findById = origEventFindById;
      (Group as any).find = origGroupFind;
      (Payment as any).find = origPaymentFind;
    }
  });

  test("5. createOrder returns 400 if groupIds are missing", async () => {
    const { req, res } = createMockReqRes({}, {}, {}, { _id: mockUserId });
    await createOrder(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.jsonData.message, /No sub-events selected/i);
  });

  test("6. createOrder returns 400 if participant limit is reached", async () => {
    const origGroupFind = Group.find;
    (Group as any).find = () =>
      Promise.resolve([
        {
          _id: mockGroupId1,
          name: "Full Workshop",
          limit: 10,
          members: Array(10).fill(new mongoose.Types.ObjectId()),
          moderators: [],
        },
      ]);

    try {
      const { req, res } = createMockReqRes(
        { groupIds: [mockGroupId1.toString()] },
        {},
        {},
        { _id: mockUserId }
      );
      await createOrder(req, res);
      assert.equal(res.statusCode, 400);
      assert.match(res.jsonData.message, /Participant limit reached/i);
    } finally {
      (Group as any).find = origGroupFind;
    }
  });

  test("7. verifyPayment fails with 400 when HMAC signature does not match", async () => {
    const { req, res } = createMockReqRes(
      {
        razorpay_order_id: "order_123",
        razorpay_payment_id: "pay_123",
        razorpay_signature: "invalid_sig",
        groupIds: [mockGroupId1.toString()],
        eventId: mockEventId.toString(),
      },
      {},
      {},
      { _id: mockUserId }
    );
    await verifyPayment(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.jsonData.message, /Payment signature verification failed/i);
  });

  test("8. verifyPayment succeeds with valid HMAC-SHA256 signature and is idempotent", async () => {
    const crypto = await import("crypto");
    const secret = process.env.RAZORPAY_KEY_SECRET || "rzp_placeholder_secret";
    const orderId = "order_test_999";
    const paymentId = "pay_test_888";
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(orderId + "|" + paymentId);
    const validSig = hmac.digest("hex");

    const origPaymentFindOne = Payment.findOne;
    const origGroupFindById = Group.findById;
    const origAppFindOne = Application.findOne;
    const origAppCreate = Application.create;

    let paymentCreatedCount = 0;
    (Payment as any).prototype.save = async function () {
      if (!this._hasBeenCounted) {
        this._hasBeenCounted = true;
        paymentCreatedCount++;
      }
      return this;
    };

    (Group as any).findById = () =>
      Promise.resolve({
        _id: mockGroupId1,
        name: "Test Group",
        members: [],
        save: () => Promise.resolve(),
      });

    (Application as any).findOne = () => Promise.resolve(null);
    (Application as any).create = () => Promise.resolve({ _id: new mongoose.Types.ObjectId() });

    try {
      // 1. First execution: no existing payment
      (Payment as any).findOne = () => Promise.resolve(null);
      const { req: req1, res: res1 } = createMockReqRes(
        {
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: validSig,
          groupIds: [mockGroupId1.toString()],
          eventId: mockEventId.toString(),
        },
        {},
        {},
        { _id: mockUserId }
      );
      await verifyPayment(req1, res1);
      assert.equal(res1.statusCode, 200);
      assert.equal(res1.jsonData.message, "Payment verified successfully");
      assert.equal(res1.jsonData.count, 1);
      assert.equal(paymentCreatedCount, 1);

      // 2. Second execution (retry/duplicate): Payment already exists -> Idempotent
      (Payment as any).findOne = () =>
        Promise.resolve({
          _id: new mongoose.Types.ObjectId(),
          razorpayPaymentId: paymentId,
          razorpayOrderId: orderId,
          status: "paid",
        });

      const { req: req2, res: res2 } = createMockReqRes(
        {
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: validSig,
          groupIds: [mockGroupId1.toString()],
          eventId: mockEventId.toString(),
        },
        {},
        {},
        { _id: mockUserId }
      );
      await verifyPayment(req2, res2);
      assert.equal(res2.statusCode, 200);
      assert.equal(res2.jsonData.message, "Payment verified successfully");
      assert.equal(res2.jsonData.count, 1);
      // Ensure no new Payment was created on duplicate call
      assert.equal(paymentCreatedCount, 1);
    } finally {
      (Payment as any).findOne = origPaymentFindOne;
      (Group as any).findById = origGroupFindById;
      (Application as any).findOne = origAppFindOne;
      (Application as any).create = origAppCreate;
    }
  });

  test("9. Payment model supports status enum, amount, currency, applicationId, and defaults", () => {
    const payment = new Payment({
      userId: mockUserId,
      groupId: mockGroupId1,
      eventId: mockEventId,
      razorpayOrderId: "order_111",
      razorpayPaymentId: "pay_111",
      razorpaySignature: "sig_111",
    });

    assert.equal(payment.status, "paid");
    assert.equal(payment.currency, "INR");
    assert.equal(payment.amount, undefined);
    assert.equal(payment.applicationId, undefined);

    const fullPayment = new Payment({
      userId: mockUserId,
      groupId: mockGroupId1,
      eventId: mockEventId,
      razorpayOrderId: "order_222",
      razorpayPaymentId: "pay_222",
      razorpaySignature: "sig_222",
      status: "refunded",
      amount: 500,
      currency: "INR",
      applicationId: new mongoose.Types.ObjectId(),
    });

    assert.equal(fullPayment.status, "refunded");
    assert.equal(fullPayment.amount, 500);
    assert.equal(fullPayment.currency, "INR");
    assert.ok(fullPayment.applicationId);
  });

  test("10. getEventPaymentHistory returns 400 if eventId is missing", async () => {
    const { req, res } = createMockReqRes({}, {}, {}, { _id: mockUserId });
    await getEventPaymentHistory(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.jsonData.message, /eventId is required/i);
  });

  test("11. getEventPaymentHistory returns 404 if event is not found", async () => {
    const origFindById = Event.findById;
    (Event as any).findById = () => Promise.resolve(null);

    try {
      const { req, res } = createMockReqRes({}, { eventId: mockEventId.toString() }, {}, { _id: mockUserId });
      await getEventPaymentHistory(req, res);
      assert.equal(res.statusCode, 404);
      assert.match(res.jsonData.message, /Event not found/i);
    } finally {
      (Event as any).findById = origFindById;
    }
  });

  test("12. getEventPaymentHistory returns 403 if unauthorized user requests", async () => {
    const origEventFindById = Event.findById;
    const origGroupFind = Group.find;

    const creatorId = new mongoose.Types.ObjectId();
    const otherUserId = new mongoose.Types.ObjectId();

    (Event as any).findById = () =>
      Promise.resolve({
        _id: mockEventId,
        title: "Conference 2026",
        userId: creatorId,
      });

    (Group as any).find = () =>
      Promise.resolve([
        {
          _id: mockGroupId1,
          admin: creatorId,
          moderators: [],
        },
      ]);

    try {
      const { req, res } = createMockReqRes(
        {},
        { eventId: mockEventId.toString() },
        {},
        { _id: otherUserId, role: "user" }
      );
      await getEventPaymentHistory(req, res);
      assert.equal(res.statusCode, 403);
      assert.match(res.jsonData.message, /Access denied/i);
    } finally {
      (Event as any).findById = origEventFindById;
      (Group as any).find = origGroupFind;
    }
  });

  test("13. getEventPaymentHistory returns 200 with formatted payments list when authorized", async () => {
    const origEventFindById = Event.findById;
    const origPaymentFind = Payment.find;

    (Event as any).findById = () =>
      Promise.resolve({
        _id: mockEventId,
        title: "Developer Summit",
        userId: mockUserId,
        amount: 300,
      });

    const mockAttendee1 = {
      _id: new mongoose.Types.ObjectId(),
      userName: "john_doe",
      email: "john@example.com",
      phone: "+91 9876543210",
      profile_image_url: "https://example.com/avatar.jpg",
    };

    const mockPayments = [
      {
        _id: new mongoose.Types.ObjectId(),
        userId: mockAttendee1,
        groupId: { _id: mockGroupId1, name: "AI Track" },
        groupIds: [{ _id: mockGroupId1, name: "AI Track" }],
        amount: 300,
        currency: "INR",
        razorpayPaymentId: "pay_xyz123456",
        razorpayOrderId: "order_xyz123456",
        status: "paid",
        createdAt: new Date("2026-11-21T10:00:00Z"),
      },
    ];

    (Payment as any).find = () => ({
      populate: () => ({
        populate: () => ({
          populate: () => ({
            sort: () => ({
              lean: () => Promise.resolve(mockPayments),
            }),
          }),
        }),
      }),
    });

    try {
      const { req, res } = createMockReqRes(
        {},
        { eventId: mockEventId.toString() },
        {},
        { _id: mockUserId, role: "user" }
      );
      await getEventPaymentHistory(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.success, true);
      assert.equal(res.jsonData.count, 1);
      assert.equal(res.jsonData.totalRevenue, 300);

      const p = res.jsonData.payments[0];
      assert.equal(p.username, "john_doe");
      assert.equal(p.email, "john@example.com");
      assert.equal(p.phone, "+91 9876543210");
      assert.equal(p.subevent, "AI Track");
      assert.equal(p.amount, 300);
      assert.equal(p.transactionId, "pay_xyz123456");
      assert.equal(p.status, "paid");
    } finally {
      (Event as any).findById = origEventFindById;
      (Payment as any).find = origPaymentFind;
    }
  });
});

