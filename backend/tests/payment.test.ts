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
});

