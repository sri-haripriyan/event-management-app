import QRCode from "qrcode";
export const generateQRCode = async (data) => {
	try {
		const qrCodeBase64 = await QRCode.toDataURL(data); // Generates a base64-encoded image
		return qrCodeBase64;
	} catch (error) {
		console.error("Error generating QR Code:", error);
		throw new Error("Failed to generate QR Code");
	}
};
