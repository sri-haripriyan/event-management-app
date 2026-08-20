import jwt from "jsonwebtoken";
import logger from "./logger.js";
import { Response } from "express";

const generateToken = (res: Response, userId: string) => {
    try {
        const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
            expiresIn: "10d",
        });

        res.cookie("auth", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days in milliseconds
        });

    } catch (error) {
        logger.error("error in generating token");
        res.status(500).json({ message: "Failed to generate token" });
    }
};

export default generateToken;
