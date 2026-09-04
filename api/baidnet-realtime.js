import { KNOWLEDGE } from "./baidnet-knowledge.js";

const VOICE_INSTRUCTIONS = `You are BAIDNET Intelligence, the official live voice assistant for the BAIDNET commercialization portal.

VOICE DEMEANOR
- Sound calm, warm, confident, natural, and highly conversational.
- Speak like a knowledgeable institutional briefing partner, not an announcer.
- Use natural rhythm, brief pauses, and concise sentences.
- You may use subtle emphasis and warmth, but never hype.
- Let the user interrupt you. If interrupted, stop and listen.
- Pronounce BAIDNET as "Baid-net" and BAIDPAY as "Baid-pay".

EVIDENCE RULES
- Answer only from the BAIDNET knowledge base included below.
- Never invent customers, partnerships, sponsor-bank relationships, contracts, licenses, regulatory approvals, revenue, transaction volume, valuation, market share, launch dates, or financial projections.
- If the knowledge base does not establish something, say: "The current BAIDNET knowledge base does not establish that information."
- Always preserve the distinction between INTERNAL ENGINEERING COMPLETE / PASS and EXTERNAL sponsor-bank, contractual, legal, or production dependencies.
- Engineering completion does not mean bank approval, regulatory approval, commercial launch, or production banking live.
- For investor questions, answer directly, explain why it matters, state any material remaining dependency, and identify the supporting BAIDNET knowledge section naturally when useful.
- Keep ordinary voice answers concise enough for natural conversation. Expand when the user asks for detail.

APPROVED BAIDNET KNOWLEDGE BASE
${KNOWLEDGE}`;

async function readSdp(req) {
  if (typeof req.body === "string") return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  if (req.body && typeof req.body.sdp === "string") return req.body.sdp;
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

function getApiKey() {
  return process.env.Openai_api_key || process.env.OPENAI_API_KEY || "";
}

function sanitizeOpenAIError(body, status) {
  try {
    const parsed = JSON.parse(body);
    const err = parsed?.error || {};
    return {
      status,
      type: err.type || null,
      code: err.code || null,
      message: err.message || "OpenAI request failed"
    };
  } catch {
    return { status, type: null, code: null, message: String(body || "OpenAI request failed").slice(0, 500) };
  }
}

export default async function handler(req, res) {
  const apiKey = getApiKey();

  if (req.method === "GET") {
    if (!apiKey) {
      return res.status(200).json({
        ok: false,
        keyConfigured: false,
        modelAccessible: false,
        realtimeModel: "gpt-realtime-2.1",
        reason: "Openai_api_key is not configured for this deployment."
      });
    }

    try {
      const modelResponse = await fetch("https://api.openai.com/v1/models/gpt-realtime-2.1", {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const body = await modelResponse.text();
      if (!modelResponse.ok) {
        const error = sanitizeOpenAIError(body, modelResponse.status);
        return res.status(200).json({
          ok: false,
          keyConfigured: true,
          modelAccessible: false,
          realtimeModel: "gpt-realtime-2.1",
          openai: error
        });
      }
      return res.status(200).json({
        ok: true,
        keyConfigured: true,
        modelAccessible: true,
        realtimeModel: "gpt-realtime-2.1"
      });
    } catch (error) {
      return res.status(200).json({
        ok: false,
        keyConfigured: true,
        modelAccessible: false,
        realtimeModel: "gpt-realtime-2.1",
        reason: error?.message || "Diagnostic request failed"
      });
    }
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!apiKey) {
    return res.status(500).json({ error: "Openai_api_key is not configured for this deployment." });
  }

  try {
    const sdp = await readSdp(req);
    if (!sdp || !sdp.includes("v=0")) {
      console.error("BAIDNET Realtime: SDP missing or already consumed by request parser.");
      return res.status(400).json({ error: "A valid WebRTC SDP offer is required." });
    }

    const session = {
      type: "realtime",
      model: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2.1",
      output_modalities: ["audio"],
      instructions: VOICE_INSTRUCTIONS,
      max_output_tokens: 900,
      audio: { output: { voice: process.env.OPENAI_REALTIME_VOICE || "marin" } }
    };

    const form = new FormData();
    form.set("sdp", sdp);
    form.set("session", JSON.stringify(session));

    const openaiResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/sdp" },
      body: form
    });

    const body = await openaiResponse.text();
    if (!openaiResponse.ok) {
      const error = sanitizeOpenAIError(body, openaiResponse.status);
      console.error("BAIDNET Realtime session error:", error);
      res.setHeader("Content-Type", "application/json");
      return res.status(openaiResponse.status).json({ error: "OpenAI Realtime session failed", openai: error });
    }
    if (!body.includes("v=0")) {
      console.error("BAIDNET Realtime: OpenAI returned a non-SDP success response.");
      return res.status(502).json({ error: "Realtime provider did not return a valid SDP answer." });
    }

    res.setHeader("Content-Type", "application/sdp");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(body);
  } catch (error) {
    console.error("BAIDNET Realtime connection error:", error?.stack || error);
    return res.status(500).json({ error: "Unable to create BAIDNET live voice session." });
  }
}
