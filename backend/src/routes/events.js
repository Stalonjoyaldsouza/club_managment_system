import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth, requireRole, requireWritable } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();
router.use(requireAuth);

const eventSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().min(5),
    type: z.enum(["HACKATHON", "WORKSHOP", "MEETING", "COMPETITION", "SOCIAL", "OTHER"]),
    venue: z.string().min(2),
    startDate: z.string(),
    endDate: z.string(),
    status: z.enum(["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"]),
    registrationLink: z.string().url().optional().or(z.literal("")),
    bannerUrl: z.string().url().optional().or(z.literal("")),
    maxParticipants: z.coerce.number().int().positive().optional().nullable(),
    teamFormation: z.string().optional(),
    projectSubmission: z.string().optional(),
    prizeDetails: z.string().optional()
  })
});

router.get("/", asyncHandler(async (_req, res) => {
  const events = await prisma.event.findMany({
    include: { createdBy: { include: { user: true } }, participants: { include: { member: { include: { user: true } } } } },
    orderBy: { startDate: "asc" }
  });
  res.json(events);
}));

router.post("/", requireRole("ADMIN"), validate(eventSchema), asyncHandler(async (req, res) => {
  const event = await prisma.event.create({ data: normalizeEvent(req.validated.body, req.user.member.id) });
  res.status(201).json(event);
}));

router.put("/:id", requireRole("ADMIN"), validate(eventSchema), asyncHandler(async (req, res) => {
  const event = await prisma.event.update({
    where: { id: req.params.id },
    data: normalizeEvent(req.validated.body)
  });
  res.json(event);
}));

router.delete("/:id", requireRole("ADMIN"), asyncHandler(async (req, res) => {
  await prisma.event.delete({ where: { id: req.params.id } });
  res.status(204).end();
}));

router.post("/:id/register", requireWritable, asyncHandler(async (req, res) => {
  const memberId = req.body.memberId || req.user.member.id;
  const participant = await prisma.eventParticipant.upsert({
    where: { eventId_memberId: { eventId: req.params.id, memberId } },
    update: {},
    create: { eventId: req.params.id, memberId }
  });
  res.status(201).json(participant);
}));

router.post("/:id/attendance", requireWritable, validate(z.object({
  body: z.object({ memberId: z.string(), attended: z.boolean() })
})), asyncHandler(async (req, res) => {
  const participant = await prisma.eventParticipant.update({
    where: { eventId_memberId: { eventId: req.params.id, memberId: req.validated.body.memberId } },
    data: { attended: req.validated.body.attended }
  });
  await prisma.attendanceRecord.create({
    data: {
      eventId: req.params.id,
      memberId: req.validated.body.memberId,
      markedById: req.user.member.id,
      date: new Date(),
      status: req.validated.body.attended ? "PRESENT" : "ABSENT"
    }
  });
  res.json(participant);
}));

function normalizeEvent(body, createdById) {
  return {
    ...body,
    startDate: new Date(body.startDate),
    endDate: new Date(body.endDate),
    registrationLink: body.registrationLink || null,
    bannerUrl: body.bannerUrl || null,
    ...(createdById ? { createdById } : {})
  };
}

export default router;
