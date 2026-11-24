import { Request, Response } from "express";
import mongoose from "mongoose";

/**
 * Format uptime seconds into human-readable duration strings and details
 */
export const formatUptimeDuration = (totalSeconds: number): {
  formatted: string;
  short: string;
  details: { days: number; hours: number; minutes: number; seconds: number };
} => {
  const seconds = Math.floor(Math.max(0, totalSeconds));
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days === 1 ? "" : "s"}`);
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  parts.push(`${remainingSeconds} second${remainingSeconds === 1 ? "" : "s"}`);

  const shortParts: string[] = [];
  if (days > 0) shortParts.push(`${days}d`);
  if (hours > 0 || days > 0) shortParts.push(`${hours}h`);
  if (minutes > 0 || hours > 0 || days > 0) shortParts.push(`${minutes}m`);
  shortParts.push(`${remainingSeconds}s`);

  return {
    formatted: parts.join(", "),
    short: shortParts.join(" "),
    details: {
      days,
      hours,
      minutes,
      seconds: remainingSeconds,
    },
  };
};

/**
 * Health check controller returning uptime duration, system stats, and DB status
 */
export const getHealthStatus = (req: Request, res: Response) => {
  const uptimeSeconds = process.uptime();
  const uptimeInfo = formatUptimeDuration(uptimeSeconds);
  const startTime = new Date(Date.now() - uptimeSeconds * 1000).toISOString();

  const dbStateMap: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const dbReadyState = mongoose.connection.readyState;
  const dbStatus = dbStateMap[dbReadyState] || "unknown";

  const memory = process.memoryUsage();
  const formatMB = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  return res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: uptimeInfo.formatted,
    uptimeShort: uptimeInfo.short,
    uptimeSeconds: Math.floor(uptimeSeconds),
    uptimeDuration: uptimeInfo.details,
    startedAt: startTime,
    environment: process.env.NODE_ENV || "development",
    database: {
      status: dbStatus,
      readyState: dbReadyState,
    },
    system: {
      memoryUsage: {
        heapUsed: formatMB(memory.heapUsed),
        heapTotal: formatMB(memory.heapTotal),
        rss: formatMB(memory.rss),
      },
      nodeVersion: process.version,
      platform: process.platform,
    },
  });
};
