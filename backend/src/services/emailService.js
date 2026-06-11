import nodemailer from "nodemailer";

function createTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
  const appPassword = process.env.GMAIL_APP_PASSWORD.replace(/\s/g, "");

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: appPassword
    }
  });
}

export async function sendEmail({ to, subject, html, text }) {
  const transporter = createTransporter();
  if (!transporter) {
    return { skipped: true, messageId: "smtp-not-configured", accepted: to, rejected: [] };
  }

  return transporter.sendMail({
    from: `"${process.env.CLUB_NAME || "ClubNexus"}" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
    text
  });
}
