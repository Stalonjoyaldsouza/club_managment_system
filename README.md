# ClubNexus - Club Management System

ClubNexus is a full-stack club management web app built with React, Vite, Tailwind CSS, Node.js, Express, PostgreSQL, Prisma, JWT auth, Nodemailer, and AI-powered email generation.

## Features

- JWT login/register with `ADMIN`, `MEMBER`, and `VIEWER` roles
- Dashboard stats and recent activity
- Member management with search, profiles data, attendance rate, deactivate flow
- Attendance marking, member history stats, and CSV export
- Inventory items, borrow requests, approvals, rejection, returns, and borrower email notifications
- Project tracking with tags, team roles, GitHub links, and progress
- Event list/calendar, registration, attendance, and hackathon fields
- Email Studio with Gemini or Claude-powered body generation, editable message body, Gmail SMTP sending, and email logs

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

### Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL database, either local PostgreSQL or Supabase
- Optional: Gmail account with an App Password for sending email
- Optional: Gemini or Anthropic API key for AI email generation

### 1. Clone And Install

```bash
git clone <your-repository-url>
cd club_managment
npm install
```

This project uses npm workspaces for `backend` and `frontend`, so one `npm install` from the root installs all dependencies.

### 2. Configure Environment Variables

Create the backend environment file:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://user:password@host:5432/database"
JWT_SECRET="replace-with-a-long-random-secret"
GEMINI_API_KEY="your_gemini_api_key"
GEMINI_MODEL="gemini-1.5-flash"
ANTHROPIC_API_KEY=""
GMAIL_USER="yourclub@gmail.com"
GMAIL_APP_PASSWORD="your_gmail_app_password"
CLUB_NAME="ClubNexus"
COLLEGE_NAME="Your College Name"
HOD_EMAIL="hod@college.edu"
FRONTEND_URL="http://localhost:5173"
PORT=4000
```

Create the frontend environment file if you need to override the API URL:

```bash
cp frontend/.env.example frontend/.env
```

Default frontend setting:

```env
VITE_API_URL=http://localhost:4000/api
```

### 3. Supabase Database Setup

1. Create a project in Supabase.
2. Go to the project database connection settings.
3. Copy the PostgreSQL connection string.
4. Put it in `backend/.env` as `DATABASE_URL`.

For local development, the Supabase **Session pooler** connection string is recommended, especially if your network does not support IPv6.

Example shape:

```env
DATABASE_URL="postgresql://postgres.projectref:password@aws-region.pooler.supabase.com:5432/postgres"
```

If your database password contains special characters such as `@`, `#`, `/`, `:`, `?`, or `&`, URL-encode them before putting the password in the connection string.

### 4. Run Prisma Migration

Generate tables in the database:

```bash
npm run db:migrate --workspace backend
```

When Prisma asks for a migration name, use:

```txt
init
```

Generate Prisma Client:

```bash
npm run db:generate --workspace backend
```

### 5. Seed Sample Data

```bash
npm run seed --workspace backend
```

Seeded accounts:

```txt
Admin:
email: admin@clubnexus.test
password: clubnexus123

Member:
email: diya@clubnexus.test
password: clubnexus123

Viewer:
email: kabir@clubnexus.test
password: clubnexus123
```

### 6. Run The App

Start backend and frontend together:

```bash
npm run dev
```

Default URLs:

```txt
Frontend: http://localhost:5173
Backend:  http://localhost:4000/api
Health:   http://localhost:4000/api/health
```

If Vite says port `5173` is already in use, it may start on another port such as `5174`. Open the URL Vite prints in the terminal.

### 7. Gmail Email Setup

For Email Studio sending, Gmail requires an App Password.

1. Open your Google Account security settings.
2. Enable 2-Step Verification.
3. Create an App Password for Mail.
4. Add it to `backend/.env`.

```env
GMAIL_USER="yourgmail@gmail.com"
GMAIL_APP_PASSWORD="your_google_app_password"
```

Do not use your normal Gmail password. App passwords can be pasted with spaces; the backend removes spaces before sending through SMTP.

### 8. AI Email Generation

Email Studio uses Gemini first if `GEMINI_API_KEY` is set:

```env
GEMINI_API_KEY="your_gemini_api_key"
GEMINI_MODEL="gemini-1.5-flash"
```

If Gemini is not configured, the backend can use Anthropic:

```env
ANTHROPIC_API_KEY="your_anthropic_api_key"
```

If no AI key is configured, the backend still returns a basic fallback email draft so the app remains usable.

### Useful Commands

```bash
npm run dev
npm run build --workspace frontend
npm run db:migrate --workspace backend
npm run db:generate --workspace backend
npm run seed --workspace backend
```

### Troubleshooting

If backend port `4000` is already in use:

```bash
lsof -nP -iTCP:4000 -sTCP:LISTEN
```

Stop the old process or change `PORT` in `backend/.env`.

If Supabase cannot connect through `db.<project>.supabase.co`, use the Supabase Session pooler URL instead.

If Gmail returns `535-5.7.8 Username and Password not accepted`, create a new Gmail App Password and make sure `GMAIL_USER` is the same account that generated it.
