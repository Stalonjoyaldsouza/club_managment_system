# ClubNexus - Club Management System

ClubNexus is a full-stack club management web app built with React, Vite, Tailwind CSS, Node.js, Express, PostgreSQL, Prisma, JWT auth, Nodemailer, and Anthropic Claude email generation.

## Features

- JWT login/register with `ADMIN`, `MEMBER`, and `VIEWER` roles
- Dashboard stats and recent activity
- Member management with search, profiles data, attendance rate, deactivate flow
- Attendance marking, member history stats, and CSV export
- Inventory items, borrow requests, approvals, rejection, returns, and borrower email notifications
- Project tracking with tags, team roles, GitHub links, and progress
- Event list/calendar, registration, attendance, and hackathon fields
- Email Studio with Claude-powered body generation, editable message body, Gmail SMTP sending, and email logs

## Project Structure

```txt
backend/
  prisma/schema.prisma
  prisma/seed.js
  src/routes
  src/services
  src/middleware
frontend/
  src/pages
  src/components
  src/context
```

## Setup
...