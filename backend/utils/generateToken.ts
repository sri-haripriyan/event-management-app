import jwt from "jsonwebtoken";
import logger from "./logger.js";
import { Response } from "express";

const generateToken = (res: Response, userId: string): string | null => {
    try {
        const token = jwt.sign({ userId }, process.env.JWT_SECRET as string, {
            expiresIn: "10d",
        });

        const isProductionHttps =
            process.env.NODE_ENV === "production" &&
            Boolean(process.env.FRONTEND_URL?.startsWith("https://"));

        res.cookie("auth", token, {
            httpOnly: true,
            secure: isProductionHttps,
            sameSite: isProductionHttps ? "none" : "lax",
            path: "/",
            maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days in milliseconds
        });

        return token;
    } catch (error) {
        logger.error("error in generating token");
        res.status(500).json({ message: "Failed to generate token" });
        return null;
    }
};

export default generateToken;
