import winston from "winston";

export const logger = winston.createLogger({
	level: "info", // Set the minimum log level
	format: winston.format.json(), // Or winston.format.simple() for simpler output
	transports: [
		new winston.transports.Console(), // Log to the console (Vercel logs)
		// Add other transports for production (e.g., file, cloud logging)
	],
});
