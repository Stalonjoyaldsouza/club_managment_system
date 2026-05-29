import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth, requireWritable } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { generateEmailBody } from "../services/aiService.js";
import { sendEmail } from "../services/emailService.js";

const router = Router();
router.use(requireAuth);

const generateSchema = z.object({
  body: z.object({
    category: z.enum(["PERMISSION", "ANNOUNCEMENT", "REMINDER", "OTHER"]),
    subject: z.string().min(1),
    notes: z.string().min(1),
    tone: z.enum(["Formal", "Semi-formal", "Friendly"]),
    eventDetails: z.string().optional()
  })
});

router.post("/generate", requireWritable, validate(generateSchema), asyncHandler(async (req, res) => {
  const body = await generateEmailBody(req.validated.body);
  res.json({ body });
}));

router.post("/send", requireWritable, validate(z.object({
  body: z.object({
    subject: z.string().min(1),
    body: z.string().min(1),
    recipients: z.array(z.string().email()).min(1),
    category: z.enum(["PERMISSION", "ANNOUNCEMENT", "REMINDER", "OTHER"]),
    aiGenerated: z.boolean().default(false)
  })
})), asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  let status = "SENT";
  let providerResult;
  try {
    providerResult = await sendEmail({
      to: payload.recipients.join(","),
      subject: payload.subject,
      text: payload.body.replace(/<[^>]*>/g, ""),
      html: payload.body.replace(/\n/g, "<br>")
    });
  } catch (error) {
    status = "FAILED";
    providerResult = { error: error.message };
  }

  const log = await prisma.emailLog.create({
    data: { ...payload, sentById: req.user.member.id, status }
  });
  res.status(status === "SENT" ? 201 : 502).json({ log, providerResult });
}));

router.get("/logs", asyncHandler(async (_req, res) => {
  const logs = await prisma.emailLog.findMany({
    include: { sentBy: { include: { user: true } } },
    orderBy: { sentAt: "desc" }
  });
  res.json(logs);
}));

router.get("/settings", (_req, res) => {
  res.json({
    clubName: process.env.CLUB_NAME || "ClubNexus",
    collegeName: process.env.COLLEGE_NAME || "Your College",
    hodEmail: process.env.HOD_EMAIL || ""
  });
});

export default router;
