import { Document } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user?: any;
      file?: any;
      files?: any;
    }
  }
}
