import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();
const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).optional(),
    department: z.string().optional(),
    position: z.string().optional()
  })
});
const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6)
  })
});

function sign(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured in backend/.env");
  }
  return jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

router.post("/register", validate(registerSchema), asyncHandler(async (req, res) => {
  const { name, email, password, role = "MEMBER", department = "General", position = "Member" } = req.validated.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name: name || email.split("@")[0],
      email,
      passwordHash,
      role,
      member: { create: { department, position } }
    },
    include: { member: true }
  });
  res.status(201).json({ token: sign(user), user });
}));

router.post("/login", validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const user = await prisma.user.findUnique({ where: { email }, include: { member: true } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  res.json({ token: sign(user), user });
}));

router.get("/me", requireAuth, (req, res) => res.json(req.user));

export default router;
