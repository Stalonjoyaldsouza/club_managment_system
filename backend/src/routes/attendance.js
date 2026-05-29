import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth, requireWritable } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();
router.use(requireAuth);

const markSchema = z.object({
  body: z.object({
    memberId: z.string(),
    eventId: z.string().optional().nullable(),
    date: z.string().datetime().or(z.string().min(8)),
    status: z.enum(["PRESENT", "ABSENT", "LATE"])
  })
});

router.get("/", asyncHandler(async (_req, res) => {
  const records = await prisma.attendanceRecord.findMany({
    include: { member: { include: { user: true } }, markedBy: { include: { user: true } }, event: true },
    orderBy: { date: "desc" }
  });
  res.json(records);
}));

router.post("/mark", requireWritable, validate(markSchema), asyncHandler(async (req, res) => {
  const record = await prisma.attendanceRecord.create({
    data: {
      ...req.validated.body,
      date: new Date(req.validated.body.date),
      markedById: req.user.member.id
    }
  });
  if (record.eventId) {
    await prisma.eventParticipant.updateMany({
      where: { eventId: record.eventId, memberId: record.memberId },
      data: { attended: record.status !== "ABSENT" }
    });
  }
  res.status(201).json(record);
}));

router.get("/member/:memberId", asyncHandler(async (req, res) => {
  const records = await prisma.attendanceRecord.findMany({
    where: { memberId: req.params.memberId },
    include: { event: true },
    orderBy: { date: "desc" }
  });
  const attended = records.filter((r) => r.status !== "ABSENT").length;
  res.json({
    records,
    stats: {
      total: records.length,
      attended,
      percentage: records.length ? Math.round((attended / records.length) * 100) : 0,
      streak: computeStreak(records)
    }
  });
}));

router.get("/export.csv", asyncHandler(async (_req, res) => {
  const records = await prisma.attendanceRecord.findMany({
    include: { member: { include: { user: true } }, event: true },
    orderBy: { date: "desc" }
  });
  const header = "Member,Email,Event,Date,Status\n";
  const rows = records.map((r) => [
    r.member.user.name,
    r.member.user.email,
    r.event?.name || "General",
    r.date.toISOString(),
    r.status
  ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","));
  res.header("Content-Type", "text/csv").send(header + rows.join("\n"));
}));

function computeStreak(records) {
  let streak = 0;
  for (const record of records) {
    if (record.status === "ABSENT") break;
    streak += 1;
  }
  return streak;
}

export default router;
