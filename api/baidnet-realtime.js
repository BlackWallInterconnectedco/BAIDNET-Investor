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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not configured." });
  }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const sdp = Buffer.concat(chunks).toString("utf8");
    if (!sdp || !sdp.includes("v=0")) {
      return res.status(400).json({ error: "A valid WebRTC SDP offer is required." });
    }

    const session = {
      type: "realtime",
      model: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2.1",
      output_modalities: ["audio"],
      instructions: VOICE_INSTRUCTIONS,
      max_output_tokens: 900,
      audio: {
        output: {
          voice: process.env.OPENAI_REALTIME_VOICE || "marin"
        }
      }
    };

    const form = new FormData();
    form.set("sdp", sdp);
    form.set("session", JSON.stringify(session));

    const openaiResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: form
    });

    const body = await openaiResponse.text();
    if (!openaiResponse.ok) {
      console.error("BAIDNET Realtime session error:", openaiResponse.status, body);
      return res.status(openaiResponse.status).send(body);
    }

    res.setHeader("Content-Type", "application/sdp");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(body);
  } catch (error) {
    console.error("BAIDNET Realtime connection error:", error);
    return res.status(500).json({ error: "Unable to create BAIDNET live voice session." });
  }
}
