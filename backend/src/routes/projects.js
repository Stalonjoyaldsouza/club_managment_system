import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth, requireWritable } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();
router.use(requireAuth);

const projectSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().min(5),
    status: z.enum(["PLANNING", "ACTIVE", "COMPLETED", "ON_HOLD", "CANCELLED"]),
    startDate: z.string(),
    endDate: z.string().optional().nullable(),
    githubUrl: z.string().url().optional().or(z.literal("")),
    tags: z.array(z.string()).default([])
  })
});

router.get("/", asyncHandler(async (req, res) => {
  const { status, tag, member } = req.query;
  const projects = await prisma.project.findMany({
    where: {
      status: status ? String(status) : undefined,
      tags: tag ? { has: String(tag) } : undefined,
      members: member ? { some: { memberId: String(member) } } : undefined
    },
    include: { createdBy: { include: { user: true } }, members: { include: { member: { include: { user: true } } } } },
    orderBy: { startDate: "desc" }
  });
  res.json(projects.map((p) => ({ ...p, progress: progressFor(p.status) })));
}));

router.post("/", requireWritable, validate(projectSchema), asyncHandler(async (req, res) => {
  const project = await prisma.project.create({
    data: {
      ...req.validated.body,
      startDate: new Date(req.validated.body.startDate),
      endDate: req.validated.body.endDate ? new Date(req.validated.body.endDate) : null,
      githubUrl: req.validated.body.githubUrl || null,
      createdById: req.user.member.id
    }
  });
  res.status(201).json(project);
}));

router.put("/:id", requireWritable, validate(projectSchema), asyncHandler(async (req, res) => {
  const project = await prisma.project.update({
    where: { id: req.params.id },
    data: {
      ...req.validated.body,
      startDate: new Date(req.validated.body.startDate),
      endDate: req.validated.body.endDate ? new Date(req.validated.body.endDate) : null,
      githubUrl: req.validated.body.githubUrl || null
    }
  });
  res.json(project);
}));

router.post("/:id/members", requireWritable, validate(z.object({
  body: z.object({ memberId: z.string(), role: z.enum(["LEAD", "CONTRIBUTOR", "REVIEWER"]) })
})), asyncHandler(async (req, res) => {
  const member = await prisma.projectMember.upsert({
    where: { projectId_memberId: { projectId: req.params.id, memberId: req.validated.body.memberId } },
    update: { role: req.validated.body.role },
    create: { projectId: req.params.id, ...req.validated.body }
  });
  res.status(201).json(member);
}));

router.delete("/:id/members/:memberId", requireWritable, asyncHandler(async (req, res) => {
  await prisma.projectMember.delete({ where: { projectId_memberId: { projectId: req.params.id, memberId: req.params.memberId } } });
  res.status(204).end();
}));

function progressFor(status) {
  return { PLANNING: 20, ACTIVE: 60, COMPLETED: 100, ON_HOLD: 45, CANCELLED: 0 }[status] || 0;
}

export default router;
