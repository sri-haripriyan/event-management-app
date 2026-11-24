import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { formatUptimeDuration, getHealthStatus } from "../controllers/healthController.js";

const createMockReqRes = () => {
  const req: any = {};
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

describe("Health Check & Uptime Duration Unit Tests", () => {
  test("1. formatUptimeDuration formats 0 seconds correctly", () => {
    const res = formatUptimeDuration(0);
    assert.equal(res.formatted, "0 seconds");
    assert.equal(res.short, "0s");
    assert.deepEqual(res.details, { days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  test("2. formatUptimeDuration formats seconds under a minute", () => {
    const res = formatUptimeDuration(45);
    assert.equal(res.formatted, "45 seconds");
    assert.equal(res.short, "45s");
    assert.deepEqual(res.details, { days: 0, hours: 0, minutes: 0, seconds: 45 });
  });

  test("3. formatUptimeDuration formats minutes and seconds with singular units", () => {
    const res = formatUptimeDuration(61);
    assert.equal(res.formatted, "1 minute, 1 second");
    assert.equal(res.short, "1m 1s");
    assert.deepEqual(res.details, { days: 0, hours: 0, minutes: 1, seconds: 1 });
  });

  test("4. formatUptimeDuration formats hours, minutes, and seconds", () => {
    // 2 hours (7200) + 15 minutes (900) + 30 seconds = 8130 seconds
    const res = formatUptimeDuration(8130);
    assert.equal(res.formatted, "2 hours, 15 minutes, 30 seconds");
    assert.equal(res.short, "2h 15m 30s");
    assert.deepEqual(res.details, { days: 0, hours: 2, minutes: 15, seconds: 30 });
  });

  test("5. formatUptimeDuration formats days, hours, minutes, and seconds", () => {
    // 1 day (86400) + 3 hours (10800) + 5 minutes (300) + 12 seconds = 97512 seconds
    const res = formatUptimeDuration(97512);
    assert.equal(res.formatted, "1 day, 3 hours, 5 minutes, 12 seconds");
    assert.equal(res.short, "1d 3h 5m 12s");
    assert.deepEqual(res.details, { days: 1, hours: 3, minutes: 5, seconds: 12 });
  });

  test("6. formatUptimeDuration handles negative numbers gracefully", () => {
    const res = formatUptimeDuration(-100);
    assert.equal(res.formatted, "0 seconds");
    assert.equal(res.short, "0s");
    assert.deepEqual(res.details, { days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  test("7. getHealthStatus returns 200 with complete uptime duration payload", () => {
    const { req, res } = createMockReqRes();
    getHealthStatus(req, res);

    assert.equal(res.statusCode, 200);
    assert.ok(res.jsonData, "Response body should not be null");
    assert.equal(res.jsonData.status, "healthy");

    // Uptime checks
    assert.ok(typeof res.jsonData.uptime === "string");
    assert.ok(typeof res.jsonData.uptimeShort === "string");
    assert.ok(typeof res.jsonData.uptimeSeconds === "number");
    assert.ok(res.jsonData.uptimeSeconds >= 0);

    // Uptime duration breakdown object
    assert.ok(res.jsonData.uptimeDuration);
    assert.ok(typeof res.jsonData.uptimeDuration.days === "number");
    assert.ok(typeof res.jsonData.uptimeDuration.hours === "number");
    assert.ok(typeof res.jsonData.uptimeDuration.minutes === "number");
    assert.ok(typeof res.jsonData.uptimeDuration.seconds === "number");

    // Timestamps
    assert.ok(res.jsonData.timestamp);
    assert.ok(!isNaN(new Date(res.jsonData.timestamp).getTime()));
    assert.ok(res.jsonData.startedAt);
    assert.ok(!isNaN(new Date(res.jsonData.startedAt).getTime()));

    // Database & System checks
    assert.ok(res.jsonData.database);
    assert.ok(typeof res.jsonData.database.status === "string");
    assert.ok(typeof res.jsonData.database.readyState === "number");
    assert.ok(res.jsonData.system);
    assert.ok(res.jsonData.system.memoryUsage);
    assert.ok(res.jsonData.system.nodeVersion);
  });
});
