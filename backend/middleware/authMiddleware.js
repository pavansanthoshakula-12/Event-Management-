import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

// protect: the request must carry a valid "Authorization: Bearer <token>" header.
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    throw new AppError("Not authenticated. Please log in.", 401);
  }

  const token = header.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET); // throws if invalid/expired

  const user = await User.findById(decoded.id);
  if (!user) throw new AppError("The account for this token no longer exists.", 401);

  req.user = user;
  next();
});

// authorize("admin") / authorize("student"): restrict a route to certain roles.
export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action.", 403));
    }
    next();
  };
