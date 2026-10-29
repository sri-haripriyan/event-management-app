import { test, describe } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import JoinRequest from "../models/requestModel.js";
import Group from "../models/groupModel.js";
import {
  joinRequest,
  approveRequest,
  getGroupByEventId,
  getUserEventRequestStatus,
} from "../controllers/groupController.js";

const createMockReqRes = (body: any = {}, params: any = {}, user: any = null, cookies: any = {}) => {
  const req: any = {
    body,
    params,
    user,
    cookies,
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

describe("JoinRequest Duplicate Prevention & Status Display Unit Tests", () => {
  const mockUserId = new mongoose.Types.ObjectId();
  const mockAdminId = new mongoose.Types.ObjectId();
  const mockGroupId1 = new mongoose.Types.ObjectId();
  const mockGroupId2 = new mongoose.Types.ObjectId();
  const mockEventId = new mongoose.Types.ObjectId();

  test("1. Returns 400 if groupId is missing in joinRequest", async () => {
    const { req, res } = createMockReqRes({}, {}, { _id: mockUserId });
    await joinRequest(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.jsonData.message, /Group ID is required/i);
  });

  test("2. Returns 404 if group is not found", async () => {
    const originalFindById = Group.findById;
    (Group as any).findById = () => ({
      select: () => Promise.resolve(null),
    });

    try {
      const { req, res } = createMockReqRes({ groupId: mockGroupId1 }, {}, { _id: mockUserId });
      await joinRequest(req, res);
      assert.equal(res.statusCode, 404);
      assert.match(res.jsonData.message, /Group not found/i);
    } finally {
      Group.findById = originalFindById;
    }
  });

  test("3. Returns 409 Conflict if user is already an approved member", async () => {
    const originalFindById = Group.findById;
    (Group as any).findById = () => ({
      select: () =>
        Promise.resolve({
          _id: mockGroupId1,
          members: [mockUserId],
          requests: [],
          admin: mockAdminId,
        }),
    });

    try {
      const { req, res } = createMockReqRes({ groupId: mockGroupId1 }, {}, { _id: mockUserId });
      await joinRequest(req, res);
      assert.equal(res.statusCode, 409);
      assert.match(res.jsonData.message, /already an approved member/i);
    } finally {
      Group.findById = originalFindById;
    }
  });

  test("4. Returns 409 Conflict if join request is already pending in JoinRequest collection", async () => {
    const originalFindById = Group.findById;
    const originalFindOne = JoinRequest.findOne;

    (Group as any).findById = () => ({
      select: () =>
        Promise.resolve({
          _id: mockGroupId1,
          members: [],
          requests: [],
          admin: mockAdminId,
        }),
    });

    (JoinRequest as any).findOne = () =>
      Promise.resolve({
        user: mockUserId,
        group: mockGroupId1,
        status: "pending",
      });

    try {
      const { req, res } = createMockReqRes({ groupId: mockGroupId1 }, {}, { _id: mockUserId });
      await joinRequest(req, res);
      assert.equal(res.statusCode, 409);
      assert.match(res.jsonData.message, /already pending/i);
    } finally {
      Group.findById = originalFindById;
      JoinRequest.findOne = originalFindOne;
    }
  });

  test("5. Returns 409 Conflict if join request was previously rejected", async () => {
    const originalFindById = Group.findById;
    const originalFindOne = JoinRequest.findOne;

    (Group as any).findById = () => ({
      select: () =>
        Promise.resolve({
          _id: mockGroupId1,
          members: [],
          requests: [],
          admin: mockAdminId,
        }),
    });

    (JoinRequest as any).findOne = () =>
      Promise.resolve({
        user: mockUserId,
        group: mockGroupId1,
        status: "rejected",
      });

    try {
      const { req, res } = createMockReqRes({ groupId: mockGroupId1 }, {}, { _id: mockUserId });
      await joinRequest(req, res);
      assert.equal(res.statusCode, 409);
      assert.match(res.jsonData.message, /rejected/i);
    } finally {
      Group.findById = originalFindById;
      JoinRequest.findOne = originalFindOne;
    }
  });

  test("6. Returns 409 Conflict if concurrent request triggers MongoDB duplicate key error (code 11000)", async () => {
    const originalFindById = Group.findById;
    const originalFindOne = JoinRequest.findOne;
    const originalCreate = JoinRequest.create;
    const originalFindByIdAndUpdate = Group.findByIdAndUpdate;

    (Group as any).findById = () => ({
      select: () =>
        Promise.resolve({
          _id: mockGroupId1,
          members: [],
          requests: [],
          admin: mockAdminId,
        }),
    });

    (JoinRequest as any).findOne = () => Promise.resolve(null);
    (Group as any).findByIdAndUpdate = () => Promise.resolve({});
    (JoinRequest as any).create = () => {
      const mongoError: any = new Error("E11000 duplicate key error");
      mongoError.code = 11000;
      return Promise.reject(mongoError);
    };

    try {
      const { req, res } = createMockReqRes({ groupId: mockGroupId1 }, {}, { _id: mockUserId });
      await joinRequest(req, res);
      assert.equal(res.statusCode, 409);
      assert.match(res.jsonData.message, /already exists/i);
    } finally {
      Group.findById = originalFindById;
      JoinRequest.findOne = originalFindOne;
      JoinRequest.create = originalCreate;
      Group.findByIdAndUpdate = originalFindByIdAndUpdate;
    }
  });

  test("7. Seat capacity enforcement: approveRequest blocks approval when limit is reached", async () => {
    const originalFindById = JoinRequest.findById;

    (JoinRequest as any).findById = () => ({
      populate: () =>
        Promise.resolve({
          _id: new mongoose.Types.ObjectId(),
          user: mockUserId,
          status: "pending",
          group: {
            _id: mockGroupId1,
            members: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
            moderators: [],
            limit: 2, // Full capacity!
          },
        }),
    });

    try {
      const { req, res } = createMockReqRes({ requestId: "some-id", action: "approve" });
      await approveRequest(req, res);
      assert.equal(res.statusCode, 400);
      assert.match(res.jsonData.message, /limit reached/i);
    } finally {
      JoinRequest.findById = originalFindById;
    }
  });

  test("8. getGroupByEventId properly annotates requestStatus and keeps sub-events independent", async () => {
    const originalGroupFind = Group.find;
    const originalJoinRequestFind = JoinRequest.find;

    (Group as any).find = () =>
      Promise.resolve([
        {
          _id: mockGroupId1,
          name: "Coding Contest",
          isHead: false,
          members: [],
          limit: 20,
        },
        {
          _id: mockGroupId2,
          name: "Web Dev",
          isHead: false,
          members: [],
          limit: 25,
        },
      ]);

    // User only requested mockGroupId1 as pending; mockGroupId2 has no request
    (JoinRequest as any).find = () => ({
      lean: () =>
        Promise.resolve([
          {
            user: mockUserId,
            group: mockGroupId1,
            status: "pending",
          },
        ]),
    });

    try {
      const { req, res } = createMockReqRes({}, { eventId: mockEventId }, { _id: mockUserId });
      await getGroupByEventId(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.length, 2);

      const subEvent1 = res.jsonData.find((g: any) => g._id === mockGroupId1);
      const subEvent2 = res.jsonData.find((g: any) => g._id === mockGroupId2);

      // Sub-event 1 has already requested status
      assert.equal(subEvent1.requestStatus, "already requested");
      assert.equal(subEvent1.isMember, false);

      // Sub-event 2 has no request (independent)
      assert.equal(subEvent2.requestStatus, null);
      assert.equal(subEvent2.isMember, false);
    } finally {
      Group.find = originalGroupFind;
      JoinRequest.find = originalJoinRequestFind;
    }
  });

  test("9. getUserEventRequestStatus returns status 'already requested' and statusLabel 'Already Requested' for pending join requests", async () => {
    const originalGroupFind = Group.find;
    const originalJoinRequestFind = JoinRequest.find;

    (Group as any).find = () => ({
      select: () =>
        Promise.resolve([
          {
            _id: mockGroupId1,
            name: "Coding Contest",
            isHead: false,
            members: [],
            requests: [mockUserId],
            limit: 20,
          },
          {
            _id: mockGroupId2,
            name: "Web Dev",
            isHead: false,
            members: [],
            requests: [],
            limit: 25,
          },
        ]),
    });

    (JoinRequest as any).find = () => ({
      lean: () =>
        Promise.resolve([
          {
            user: mockUserId,
            group: mockGroupId1,
            status: "pending",
          },
        ]),
    });

    try {
      const { req, res } = createMockReqRes({}, { eventId: mockEventId }, { _id: mockUserId });
      await getUserEventRequestStatus(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.eventId, mockEventId);
      assert.equal(res.jsonData.subEvents.length, 2);

      const subEvent1 = res.jsonData.subEvents.find((s: any) => s.groupId === mockGroupId1);
      const subEvent2 = res.jsonData.subEvents.find((s: any) => s.groupId === mockGroupId2);

      // Sub-event 1 status details
      assert.equal(subEvent1.status, "already requested");
      assert.equal(subEvent1.statusLabel, "Already Requested");
      assert.equal(subEvent1.isRequested, true);
      assert.equal(subEvent1.isMember, false);

      // Sub-event 2 status details
      assert.equal(subEvent2.status, "none");
      assert.equal(subEvent2.statusLabel, "Join");
      assert.equal(subEvent2.isRequested, false);

      // Status map check
      assert.equal(res.jsonData.statusMap[mockGroupId1.toString()], "already requested");
      assert.equal(res.jsonData.statusMap[mockGroupId2.toString()], "none");
    } finally {
      Group.find = originalGroupFind;
      JoinRequest.find = originalJoinRequestFind;
    }
  });

  test("10. Batch joinRequest supports multiple groupIds at once and skips already requested", async () => {
    const originalGroupFind = Group.find;
    const originalJoinRequestFind = JoinRequest.find;
    const originalJoinRequestCreate = JoinRequest.create;
    const originalGroupFindByIdAndUpdate = Group.findByIdAndUpdate;

    (Group as any).find = () =>
      Promise.resolve([
        {
          _id: mockGroupId1,
          name: "SubEvent 1",
          members: [],
          requests: [],
          admin: mockAdminId,
          limit: 20,
        },
        {
          _id: mockGroupId2,
          name: "SubEvent 2",
          members: [],
          requests: [],
          admin: mockAdminId,
          limit: 25,
        },
      ]);

    // mockGroupId1 is already pending, mockGroupId2 has no prior request
    (JoinRequest as any).find = () => ({
      lean: () =>
        Promise.resolve([
          {
            user: mockUserId,
            group: mockGroupId1,
            status: "pending",
          },
        ]),
    });

    (Group as any).findByIdAndUpdate = () => Promise.resolve({});
    (JoinRequest as any).create = () => Promise.resolve({});

    try {
      const { req, res } = createMockReqRes(
        { groupIds: [mockGroupId1, mockGroupId2] },
        {},
        { _id: mockUserId }
      );
      await joinRequest(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.successfulCount, 1);
      assert.equal(res.jsonData.skippedCount, 1);
      assert.equal(res.jsonData.successfulGroupIds[0], mockGroupId2.toString());
      assert.equal(res.jsonData.skipped[0].groupId, mockGroupId1.toString());
    } finally {
      Group.find = originalGroupFind;
      JoinRequest.find = originalJoinRequestFind;
      JoinRequest.create = originalJoinRequestCreate;
      Group.findByIdAndUpdate = originalGroupFindByIdAndUpdate;
    }
  });
});
