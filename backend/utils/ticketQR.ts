import QRCode from "qrcode";
import { storage, bucketId, projectId, endpoint } from "../configs/appwrite.js";
import { InputFile } from "node-appwrite/file";
import { ID } from "node-appwrite";
import Application from "../models/applicationModel.js";
import logger from "./logger.js";

/**
 * Ensures an Application/Ticket has a persisted QR code in Appwrite Storage.
 * The same QR code image is reused across email dispatch and the MyTickets page.
 */
export async function ensureApplicationQRCode(application: any): Promise<{
  qrCodeUrl: string;
  qrFileId: string;
  qrBuffer: Buffer;
}> {
  if (!application) {
    throw new Error("Application document is required to generate ticket QR");
  }

  const appId = application._id ? application._id.toString() : String(application);
  const eventId = application.eventId?._id
    ? application.eventId._id.toString()
    : application.eventId
    ? application.eventId.toString()
    : "";

  const qrPayload = `${eventId}==${appId}`;

  // Generate PNG buffer for QR Code
  const qrBuffer = await QRCode.toBuffer(qrPayload, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 320,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  // If already persisted with a valid Appwrite file URL, return existing
  if (application.qrCodeUrl && application.qrFileId) {
    return {
      qrCodeUrl: application.qrCodeUrl,
      qrFileId: application.qrFileId,
      qrBuffer,
    };
  }

  // Upload to Appwrite Storage
  let qrCodeUrl = "";
  let qrFileId = "";

  try {
    const fileName = `ticket_qr_${appId}.png`;
    const uploadedFile = await storage.createFile(
      bucketId,
      ID.unique(),
      InputFile.fromBuffer(qrBuffer, fileName)
    );

    qrFileId = uploadedFile.$id;
    qrCodeUrl = `${endpoint}/storage/buckets/${bucketId}/files/${uploadedFile.$id}/view?project=${projectId}`;
    logger.info(`Persisted ticket QR code to Appwrite: ${qrFileId} for application ${appId}`);
  } catch (err: any) {
    logger.error("Appwrite storage upload failed for QR code: " + (err?.message || err));
    // Fallback data URI to ensure ticket viewing and email still succeed
    qrCodeUrl = `data:image/png;base64,${qrBuffer.toString("base64")}`;
  }

  // Persist Appwrite identifier and URL to Application document
  try {
    await Application.findByIdAndUpdate(
      appId,
      { qrCodeUrl, qrFileId },
      { new: true }
    );
    application.qrCodeUrl = qrCodeUrl;
    application.qrFileId = qrFileId;
  } catch (dbErr: any) {
    logger.error("Failed to update application with QR code URL: " + (dbErr?.message || dbErr));
  }

  return { qrCodeUrl, qrFileId, qrBuffer };
}
