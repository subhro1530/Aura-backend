const fetch = (...args) =>
  import("node-fetch").then(({ default: f }) => f(...args));
const logger = require("../config/logger");

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MOOD_LABELS = [
  "happy",
  "sad",
  "calm",
  "motivated",
  "anxious",
  "angry",
  "tired",
  "excited",
  "neutral",
];

/**
 * Try primary (generateContent) endpoint
 */
async function callGenerateContent(prompt) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const body = { contents: [{ parts: [{ text: prompt }] }] };
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    const err = new Error(`generateContent failed: ${resp.status} ${txt}`);
    err._primary = true;
    throw err;
  }
  const data = await resp.json();
  const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return { raw: data, answer };
}

/**
 * Fallback: OpenAI-compatible endpoint (needs Authorization header)
 */
async function callOpenAICompat(prompt) {
  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  const body = {
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
    max_tokens: 16,
  };
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    const err = new Error(`openai-compat failed: ${resp.status} ${txt}`);
    err._fallback = true;
    throw err;
  }
  const data = await resp.json();
  const answer = data?.choices?.[0]?.message?.content || "";
  return { raw: data, answer };
}

function extractLabel(answer) {
  if (!answer) return "neutral";
  const cleaned = answer
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .trim();
  // Direct match
  if (MOOD_LABELS.includes(cleaned)) return cleaned;
  // Search tokens
  const tokens = cleaned.split(/\s+/);
  for (const t of tokens) {
    if (MOOD_LABELS.includes(t)) return t;
  }
  // Fallback: find first label substring
  for (const label of MOOD_LABELS) {
    if (cleaned.includes(label)) return label;
  }
  return "neutral";
}

async function analyzeTextMood(text) {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
  const prompt = `Classify the dominant mood of the following user text into exactly ONE of: ${MOOD_LABELS.join(
    ", "
  )}.
Return ONLY the lowercase label (no punctuation, no explanation).
Text: """${text}"""`;

  let raw, answer;
  try {
    ({ raw, answer } = await callGenerateContent(prompt));
  } catch (primaryErr) {
    logger.warn(primaryErr.message);
    try {
      ({ raw, answer } = await callOpenAICompat(prompt));
    } catch (fallbackErr) {
      logger.error("Both Gemini requests failed", {
        primary: primaryErr.message,
        fallback: fallbackErr.message,
      });
      throw new Error(
        "Mood classification temporarily unavailable. Try again later."
      );
    }
  }

  const mood = extractLabel(answer);
  if (process.env.LOG_LEVEL === "debug") {
    logger.debug("Mood classification", {
      input: text,
      extracted: mood,
      rawSnippet: String(answer).slice(0, 60),
    });
  }
  return { mood, raw };
}

async function analyzeImageMood(_imageBuffer) {
  return {
    mood: "neutral",
    confidence: 0.3,
    note: "Vision analysis not implemented",
  };
}

module.exports = { analyzeTextMood, analyzeImageMood, MOOD_LABELS };
