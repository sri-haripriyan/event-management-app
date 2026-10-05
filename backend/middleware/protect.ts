import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import logger from "../utils/logger.js";

const protect = async (req: any, res: any, next: any) => {
  const token = req.cookies?.auth;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      const user = await User.findById(decoded.userId).select("-password");
      if (user) {
        req.user = user;
        return next();
      } else {
        logger.warn(`[Protect] User not found in DB for ID: ${decoded.userId}`);
        return res
          .status(401)
          .json({ error: "Token mismatch, please login again" });
      }
    } catch (error: any) {
      logger.warn(`[Protect] JWT verification failed: ${error.message}`);
      return res.status(401).json({ error: "Unauthorized, please login" });
    }
  } else {
    logger.warn("[Protect] No auth cookie found in request");
    return res.status(401).json({ error: "Unauthorized, please login" });
  }
};

export default protect;
