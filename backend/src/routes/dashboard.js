import { Router } from "express";
import { addDays, startOfDay } from "date-fns";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(async (req, res) => {
  const today = startOfDay(new Date());
  const [members, upcomingEvents, borrowed, activeProjects, recentBorrow, recentEvents, recentEmails] = await Promise.all([
    prisma.clubMember.count({ where: { isActive: true } }),
    prisma.event.count({ where: { startDate: { gte: today }, status: "UPCOMING" } }),
    prisma.borrowRequest.count({ where: { status: "APPROVED", returnedAt: null } }),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.borrowRequest.findMany({ take: 5, orderBy: { borrowedAt: "desc" }, include: { item: true, borrower: { include: { user: true } } } }),
    prisma.event.findMany({ take: 5, where: { startDate: { gte: today } }, orderBy: { startDate: "asc" } }),
    prisma.emailLog.findMany({ take: 5, orderBy: { sentAt: "desc" }, include: { sentBy: { include: { user: true } } } })
  ]);

  res.json({
    stats: { members, upcomingEvents, borrowed, activeProjects },
    activity: [
      ...recentBorrow.map((b) => ({ id: b.id, type: "Borrow", text: `${b.borrower.user.name} requested ${b.item.name}`, at: b.borrowedAt })),
      ...recentEvents.map((e) => ({ id: e.id, type: "Event", text: `${e.name} at ${e.venue}`, at: e.startDate })),
      ...recentEmails.map((e) => ({ id: e.id, type: "Email", text: `${e.subject} sent by ${e.sentBy.user.name}`, at: e.sentAt }))
    ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8),
    nextWeek: addDays(today, 7)
  });
}));

export default router;
