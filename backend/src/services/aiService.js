import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a professional email writer for a college club.
Write a polished, well-structured email based on the user's notes.
Use the specified tone. Include a proper greeting, clear body paragraphs, and a closing.
Return ONLY the email body text, no subject line.`;

export async function generateEmailBody({ category, subject, notes, tone, eventDetails }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return fallbackEmail({ category, subject, notes, tone, eventDetails });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const permissionContext = category === "PERMISSION"
    ? `\nPermission request details:\nClub: ${process.env.CLUB_NAME || "ClubNexus"}\nCollege: ${process.env.COLLEGE_NAME || "College"}\n${eventDetails || ""}`
    : "";

  // AI service call: sends only the email-writing brief and never persists API keys or secrets.
  const response = await anthropic.messages.create({
    model: "claude-3-5-haiku-latest",
    max_tokens: 900,
    system: SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: `Category: ${category}\nTone: ${tone}\nSubject idea: ${subject}\nNotes:\n${notes}${permissionContext}`
    }]
  });

  return response.content.map((part) => part.text || "").join("\n").trim();
}

function fallbackEmail({ category, subject, notes, tone, eventDetails }) {
  const greeting = category === "PERMISSION" ? "Respected Sir/Madam," : "Hello,";
  const closing = tone === "Friendly" ? "Warmly," : "Sincerely,";
  return `${greeting}

I hope you are doing well. I am writing regarding ${subject || "an important club update"}.

${notes || "Please find the relevant details attached to this message."}
${eventDetails ? `\n${eventDetails}` : ""}

Thank you for your time and consideration.

${closing}
${process.env.CLUB_NAME || "ClubNexus"}`;
}
