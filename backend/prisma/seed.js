import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  await prisma.emailLog.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.eventParticipant.deleteMany();
  await prisma.event.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.borrowRequest.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.clubMember.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("clubnexus123", 10);
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Aarav Mehta",
        email: "admin@clubnexus.test",
        passwordHash,
        role: "ADMIN",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
        member: { create: { position: "President", department: "Core" } }
      },
      include: { member: true }
    }),
    prisma.user.create({
      data: {
        name: "Diya Sharma",
        email: "diya@clubnexus.test",
        passwordHash,
        role: "MEMBER",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
        member: { create: { position: "Design Lead", department: "Creative" } }
      },
      include: { member: true }
    }),
    prisma.user.create({
      data: {
        name: "Kabir Rao",
        email: "kabir@clubnexus.test",
        passwordHash,
        role: "VIEWER",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
        member: { create: { position: "Faculty Viewer", department: "Advisory" } }
      },
      include: { member: true }
    })
  ]);

  const [admin, diya, kabir] = users.map((u) => u.member);

  await Promise.all([
    prisma.inventoryItem.create({ data: { name: "Arduino Starter Kit", description: "Sensors, boards, jumpers, and cables.", category: "Electronics", totalQuantity: 8, availableQuantity: 6, addedById: admin.id, imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80" } }),
    prisma.inventoryItem.create({ data: { name: "DSLR Camera", description: "Club media camera with 18-55mm lens.", category: "Media", totalQuantity: 2, availableQuantity: 1, addedById: diya.id, imageUrl: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=80" } }),
    prisma.inventoryItem.create({ data: { name: "Projector", description: "Portable HD projector for workshops.", category: "AV", totalQuantity: 3, availableQuantity: 3, addedById: admin.id, imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80" } }),
    prisma.inventoryItem.create({ data: { name: "Extension Board", description: "Heavy duty 6-socket extension board.", category: "Utilities", totalQuantity: 10, availableQuantity: 8, addedById: admin.id } }),
    prisma.inventoryItem.create({ data: { name: "VR Headset", description: "Standalone headset for demos.", category: "Hardware", totalQuantity: 1, availableQuantity: 1, addedById: diya.id, imageUrl: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&w=600&q=80" } })
  ]);

  const projectOne = await prisma.project.create({
    data: {
      name: "Campus Companion App",
      description: "A mobile-friendly guide for events, rooms, and student resources.",
      status: "ACTIVE",
      startDate: new Date("2026-02-01"),
      createdById: admin.id,
      githubUrl: "https://github.com/example/campus-companion",
      tags: ["react", "maps", "student-life"],
      members: { create: [{ memberId: admin.id, role: "LEAD" }, { memberId: diya.id, role: "CONTRIBUTOR" }] }
    }
  });
  await prisma.project.create({
    data: {
      name: "AI Notice Summarizer",
      description: "Summarizes long college notices into actionable bullet points.",
      status: "PLANNING",
      startDate: new Date("2026-05-01"),
      createdById: diya.id,
      tags: ["ai", "automation"],
      members: { create: [{ memberId: diya.id, role: "LEAD" }, { memberId: kabir.id, role: "REVIEWER" }] }
    }
  });

  const events = await Promise.all([
    prisma.event.create({ data: { name: "Build Night", description: "Weekly maker session and project check-in.", type: "MEETING", venue: "Lab 204", startDate: new Date("2026-06-05T17:00:00+05:30"), endDate: new Date("2026-06-05T19:00:00+05:30"), status: "UPCOMING", createdById: admin.id, maxParticipants: 50 } }),
    prisma.event.create({ data: { name: "React Workshop", description: "Hands-on introduction to React and Vite.", type: "WORKSHOP", venue: "Seminar Hall", startDate: new Date("2026-06-12T10:00:00+05:30"), endDate: new Date("2026-06-12T15:00:00+05:30"), status: "UPCOMING", createdById: diya.id, registrationLink: "https://example.com/register", maxParticipants: 80 } }),
    prisma.event.create({ data: { name: "Nexus Hack", description: "24-hour hackathon focused on campus problems.", type: "HACKATHON", venue: "Innovation Center", startDate: new Date("2026-07-01T09:00:00+05:30"), endDate: new Date("2026-07-02T09:00:00+05:30"), status: "UPCOMING", createdById: admin.id, maxParticipants: 120, teamFormation: "Teams of 2-4", projectSubmission: "https://example.com/submit", prizeDetails: "Cash prizes and incubation mentorship" } })
  ]);

  await prisma.eventParticipant.createMany({
    data: [
      { eventId: events[0].id, memberId: admin.id, attended: true },
      { eventId: events[0].id, memberId: diya.id, attended: true },
      { eventId: events[1].id, memberId: diya.id, attended: false }
    ]
  });

  await prisma.attendanceRecord.createMany({
    data: [
      { memberId: admin.id, eventId: events[0].id, date: new Date("2026-05-20"), status: "PRESENT", markedById: admin.id },
      { memberId: diya.id, eventId: events[0].id, date: new Date("2026-05-20"), status: "LATE", markedById: admin.id },
      { memberId: kabir.id, eventId: events[0].id, date: new Date("2026-05-20"), status: "ABSENT", markedById: admin.id }
    ]
  });

  await prisma.emailLog.create({
    data: {
      subject: "Welcome to ClubNexus",
      body: "Welcome to the new club management system.",
      recipients: ["team@clubnexus.test"],
      sentById: admin.id,
      status: "DRAFT",
      category: "ANNOUNCEMENT",
      aiGenerated: false
    }
  });

  console.log({ users: users.length, projectOne: projectOne.name, events: events.length });
}

main().finally(async () => prisma.$disconnect());
