import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
const protect = async (req, res, next) => {
  const token = req.cookies.auth;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
        next();
      } else {
        return res
          .status(401)
          .json({ error: "Token mismatch, please login again" });
      }
    } catch (error) {
      return res.status(401).json({ error: "Unauthorized, please login" });
    }
  } else {
    return res.status(401).json({ error: "Unauthorized, please login" });
  }
};

export default protect;
