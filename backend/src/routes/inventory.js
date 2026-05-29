import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth, requireRole, requireWritable } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { sendEmail } from "../services/emailService.js";

const router = Router();
router.use(requireAuth);

const itemSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().min(2),
    category: z.string().min(1),
    totalQuantity: z.coerce.number().int().positive(),
    availableQuantity: z.coerce.number().int().nonnegative(),
    imageUrl: z.string().url().optional().or(z.literal(""))
  })
});

const borrowSchema = z.object({
  body: z.object({
    itemId: z.string(),
    quantity: z.coerce.number().int().positive(),
    days: z.coerce.number().int().positive(),
    purpose: z.string().min(3),
    notes: z.string().optional()
  })
});

router.get("/", asyncHandler(async (req, res) => {
  const items = await prisma.inventoryItem.findMany({
    where: {
      OR: req.query.q ? [
        { name: { contains: String(req.query.q), mode: "insensitive" } },
        { category: { contains: String(req.query.q), mode: "insensitive" } }
      ] : undefined
    },
    include: { addedBy: { include: { user: true } }, borrowRequests: true },
    orderBy: { createdAt: "desc" }
  });
  res.json(items);
}));

router.post("/", requireWritable, validate(itemSchema), asyncHandler(async (req, res) => {
  const item = await prisma.inventoryItem.create({
    data: { ...req.validated.body, imageUrl: req.validated.body.imageUrl || null, addedById: req.user.member.id }
  });
  res.status(201).json(item);
}));

router.put("/:id", requireWritable, validate(itemSchema), asyncHandler(async (req, res) => {
  const item = await prisma.inventoryItem.update({
    where: { id: req.params.id },
    data: { ...req.validated.body, imageUrl: req.validated.body.imageUrl || null }
  });
  res.json(item);
}));

router.delete("/:id", requireRole("ADMIN"), asyncHandler(async (req, res) => {
  await prisma.inventoryItem.delete({ where: { id: req.params.id } });
  res.status(204).end();
}));

router.get("/borrow-requests", asyncHandler(async (_req, res) => {
  const requests = await prisma.borrowRequest.findMany({
    include: { item: true, borrower: { include: { user: true } }, approvedBy: { include: { user: true } } },
    orderBy: { borrowedAt: "desc" }
  });
  res.json(requests);
}));

router.post("/borrow", requireWritable, validate(borrowSchema), asyncHandler(async (req, res) => {
  const { itemId, quantity, days, purpose, notes } = req.validated.body;
  const request = await prisma.borrowRequest.create({
    data: {
      itemId,
      quantity,
      purpose,
      notes,
      borrowerId: req.user.member.id,
      dueDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    },
    include: { item: true }
  });
  res.status(201).json(request);
}));

router.put("/borrow/:id/approve", requireRole("ADMIN"), asyncHandler(async (req, res) => {
  const { approved = true, notes } = req.body;
  const existing = await prisma.borrowRequest.findUnique({ where: { id: req.params.id }, include: { item: true, borrower: { include: { user: true } } } });
  if (!existing) return res.status(404).json({ message: "Borrow request not found" });
  if (approved && existing.item.availableQuantity < existing.quantity) {
    return res.status(400).json({ message: "Not enough inventory available" });
  }

  const request = await prisma.$transaction(async (tx) => {
    if (approved) {
      await tx.inventoryItem.update({
        where: { id: existing.itemId },
        data: { availableQuantity: { decrement: existing.quantity } }
      });
    }
    return tx.borrowRequest.update({
      where: { id: existing.id },
      data: {
        status: approved ? "APPROVED" : "REJECTED",
        approvedById: req.user.member.id,
        notes: notes || existing.notes
      }
    });
  });

  await sendEmail({
    to: existing.borrower.user.email,
    subject: `Borrow request ${approved ? "approved" : "rejected"}: ${existing.item.name}`,
    text: `Your request for ${existing.quantity} ${existing.item.name} has been ${approved ? "approved" : "rejected"}.`,
    html: `<p>Your request for <strong>${existing.quantity} ${existing.item.name}</strong> has been ${approved ? "approved" : "rejected"}.</p>`
  });
  res.json(request);
}));

router.put("/borrow/:id/return", requireWritable, asyncHandler(async (req, res) => {
  const existing = await prisma.borrowRequest.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: "Borrow request not found" });
  const request = await prisma.$transaction(async (tx) => {
    await tx.inventoryItem.update({ where: { id: existing.itemId }, data: { availableQuantity: { increment: existing.quantity } } });
    return tx.borrowRequest.update({ where: { id: existing.id }, data: { status: "RETURNED", returnedAt: new Date() } });
  });
  res.json(request);
}));

export default router;
