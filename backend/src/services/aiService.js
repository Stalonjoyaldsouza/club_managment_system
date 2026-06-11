import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a professional email writer for a college club.
Write a polished, well-structured email based on the user's notes.
Use the specified tone. Include a proper greeting, clear body paragraphs, and a closing.
Do not copy the user's notes verbatim. Convert details into natural sentences.
Do not repeat the same event details more than once.
Return ONLY the email body text, no subject line.`;

export async function generateEmailBody({ category, subject, notes, tone, eventDetails }) {
  try {
    if (process.env.GEMINI_API_KEY) {
      return await generateWithGemini({ category, subject, notes, tone, eventDetails });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      return await generateWithAnthropic({ category, subject, notes, tone, eventDetails });
    }
  } catch (error) {
    console.warn(`AI email generation failed: ${error.message}`);
  }

  return fallbackEmail({ category, subject, notes, tone, eventDetails });
}

async function generateWithAnthropic({ category, subject, notes, tone, eventDetails }) {
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
      content: buildEmailPrompt({ category, subject, notes, tone, permissionContext })
    }]
  });

  return response.content.map((part) => part.text || "").join("\n").trim();
}

async function generateWithGemini({ category, subject, notes, tone, eventDetails }) {
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const permissionContext = category === "PERMISSION"
    ? `\nPermission request details:\nClub: ${process.env.CLUB_NAME || "ClubNexus"}\nCollege: ${process.env.COLLEGE_NAME || "College"}\n${eventDetails || ""}`
    : "";

  // AI service call: uses Gemini REST directly so no extra SDK dependency is required.
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: [{
          role: "user",
          parts: [{
            text: buildEmailPrompt({ category, subject, notes, tone, permissionContext })
          }]
        }]
      })
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini email generation failed");
  }

  return data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n").trim()
    || fallbackEmail({ category, subject, notes, tone, eventDetails });
}

function fallbackEmail({ category, subject, notes, tone, eventDetails }) {
  const detailParagraph = notesToParagraph(notes, eventDetails);
  if (category === "PERMISSION") {
    return `Respected Sir/Madam,

I am writing on behalf of ${process.env.CLUB_NAME || "ClubNexus"} to request permission regarding ${subject || "the proposed club activity"}.

${detailParagraph}

We assure you that the activity will be conducted responsibly, with proper coordination and discipline. We kindly request your approval and support for the same.

Thank you for your time and consideration.

Sincerely,
${process.env.CLUB_NAME || "ClubNexus"}`;
  }

  const greeting = category === "PERMISSION" ? "Respected Sir/Madam," : "Hello,";
  const closing = tone === "Friendly" ? "Warmly," : "Sincerely,";
  return `${greeting}

I hope you are doing well. I am writing regarding ${subject || "an important club update"}.

${detailParagraph}

Thank you for your time and consideration.

${closing}
${process.env.CLUB_NAME || "ClubNexus"}`;
}

function buildEmailPrompt({ category, subject, notes, tone, permissionContext }) {
  const permissionInstruction = category === "PERMISSION"
    ? "Write it like a formal permission letter. Include a clear request for approval, a concise event/activity description, and an assurance of responsible conduct."
    : "Write it as a clear club email.";

  return `Category: ${category}
Tone: ${tone}
Subject idea: ${subject}
Instructions: ${permissionInstruction}
Use the notes below as facts only. Do not paste labels or bullet points directly. Do not duplicate details.
Notes:
${notes}${permissionContext}`;
}

function notesToParagraph(notes, eventDetails) {
  const source = [notes, eventDetails].filter(Boolean).join("\n");
  if (!source.trim()) return "Please find the relevant details attached to this message.";

  const lines = source
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);

  const seen = new Set();
  const cleaned = lines.filter((line) => {
    const key = line.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return cleaned
    .map((line) => {
      const [label, ...rest] = line.split(":");
      const value = rest.join(":").trim();
      if (!value) return line;
      return `${label.trim()} is ${value}.`;
    })
    .join(" ");
}
