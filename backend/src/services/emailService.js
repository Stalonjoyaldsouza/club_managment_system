import nodemailer from "nodemailer";

function createTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
}

export async function sendEmail({ to, subject, html, text }) {
  const transporter = createTransporter();
  if (!transporter) {
    return { skipped: true, messageId: "smtp-not-configured" };
  }

  return transporter.sendMail({
    from: `"${process.env.CLUB_NAME || "ClubNexus"}" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
    text
  });
}
