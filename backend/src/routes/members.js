import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth, requireRole, requireWritable } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();
router.use(requireAuth);

const memberSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6).optional(),
    role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
    position: z.string().min(1),
    department: z.string().min(1),
    isActive: z.boolean().optional(),
    avatarUrl: z.string().url().optional().or(z.literal(""))
  })
});
const memberUpdateSchema = z.object({ body: memberSchema.shape.body.partial() });

router.get("/", asyncHandler(async (req, res) => {
  const { q, role, department, active } = req.query;
  const members = await prisma.clubMember.findMany({
    where: {
      isActive: active === undefined ? undefined : active === "true",
      department: department ? String(department) : undefined,
      user: {
        role: role ? String(role) : undefined,
        OR: q ? [
          { name: { contains: String(q), mode: "insensitive" } },
          { email: { contains: String(q), mode: "insensitive" } }
        ] : undefined
      }
    },
    include: {
      user: true,
      projectMemberships: { include: { project: true } },
      borrowedRequests: { include: { item: true } },
      attendanceRecords: true
    },
    orderBy: { joinedClubAt: "desc" }
  });

  res.json(members.map((m) => ({
    ...m,
    attendanceRate: m.attendanceRecords.length
      ? Math.round((m.attendanceRecords.filter((a) => a.status === "PRESENT" || a.status === "LATE").length / m.attendanceRecords.length) * 100)
      : 0
  })));
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const member = await prisma.clubMember.findUnique({
    where: { id: req.params.id },
    include: {
      user: true,
      projectMemberships: { include: { project: true } },
      borrowedRequests: { include: { item: true } },
      attendanceRecords: { include: { event: true } }
    }
  });
  if (!member) return res.status(404).json({ message: "Member not found" });
  res.json(member);
}));

router.post("/", requireRole("ADMIN"), validate(memberSchema), asyncHandler(async (req, res) => {
  const { name, email, password = "clubnexus123", role, position, department, avatarUrl } = req.validated.body;
  const user = await prisma.user.create({
    data: {
      name,
      email,
      role,
      avatarUrl: avatarUrl || null,
      passwordHash: await bcrypt.hash(password, 10),
      member: { create: { position, department } }
    },
    include: { member: true }
  });
  res.status(201).json(user.member);
}));

router.put("/:id", requireWritable, validate(memberUpdateSchema), asyncHandler(async (req, res) => {
  const member = await prisma.clubMember.update({
    where: { id: req.params.id },
    data: {
      position: req.body.position,
      department: req.body.department,
      isActive: req.body.isActive,
      user: {
        update: {
          name: req.body.name,
          email: req.body.email,
          role: req.body.role,
          avatarUrl: req.body.avatarUrl || undefined
        }
      }
    },
    include: { user: true }
  });
  res.json(member);
}));

router.delete("/:id", requireRole("ADMIN"), asyncHandler(async (req, res) => {
  await prisma.clubMember.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.status(204).end();
}));

export default router;
