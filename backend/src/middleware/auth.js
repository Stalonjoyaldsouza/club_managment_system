import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "Missing auth token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { member: true }
    });
    if (!user) return res.status(401).json({ message: "Invalid auth token" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid auth token" });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  next();
};

export const requireWritable = (req, res, next) => {
  if (req.user.role === "VIEWER") {
    return res.status(403).json({ message: "Viewer accounts are read-only" });
  }
  next();
};
