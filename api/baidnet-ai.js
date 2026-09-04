import OpenAI from "openai";
import { KNOWLEDGE } from "./baidnet-knowledge.js";

const SECTIONS = KNOWLEDGE.split(/\n(?=##\s+\d+\))/g).map(s => s.trim()).filter(Boolean);

function tokenize(text = "") {
  return [...new Set(text.toLowerCase().replace(/[^a-z0-9_\-\/ ]+/g, " ").split(/\s+/).filter(w => w.length > 2))];
}

function retrieve(question, maxSections = 5) {
  const q = tokenize(question);
  const lowerQ = question.toLowerCase();
  const boosts = [
    [/sponsor|bank|parity|ach|fbo|external|dependency/, /sponsor|bank|parity|ach|fbo|external|dependency/],
    [/security|csrf|hmac|rate|lockout|auth/, /security|csrf|hmac|rate|lockout|auth/],
    [/api|endpoint|financial|fiat|payment/, /api|endpoint|financial|fiat|payment/],
    [/risk|fraud|reconciliation|dispute|idempot/, /risk|fraud|reconciliation|dispute|idempot/],
    [/mobile|web|ui|ux|frontend|toggle/, /mobile|web|ui|ux|frontend|toggle/],
    [/complete|ready|status|launch|built|remaining/, /complete|ready|status|launch|built|remaining/]
  ];
  return SECTIONS.map((section, index) => {
    const lower = section.toLowerCase();
    let score = 0;
    for (const term of q) if (lower.includes(term)) score += term.length >= 8 ? 3 : 1;
    for (const [qp, sp] of boosts) if (qp.test(lowerQ) && sp.test(lower)) score += 8;
    return { section, index, score };
  }).sort((a, b) => b.score - a.score).filter(x => x.score > 0).slice(0, maxSections);
}

function sourceNames(selected) {
  return selected.map(h => {
    const m = h.section.match(/^##\s+([^\n]+)/);
    return m ? m[1].trim() : `Knowledge section ${h.index + 1}`;
  });
}

function groundedFallback(question, selected) {
  const q = question.toLowerCase();
  if (/ready|readiness|status|complete|remaining|launch|built/.test(q)) {
    return "BAIDNET's internal FinTech engineering is complete / pass across the A-G program, including the fiat lifecycle, financial primitives API, risk controls, reconciliation, dispute operations, runtime evidence, and consolidated closeout. The remaining gates are external: live sponsor-bank settlement verification, callback and reconciliation parity, partner-specific ACH/debit/FBO onboarding, and completed sponsor-bank attestations or sign-off. That distinction matters because engineering completion does not by itself mean bank approval, regulatory approval, commercial launch, or production banking live.";
  }
  if (/sponsor|bank|ach|fbo|external|dependency/.test(q)) {
    return "BAIDNET has engineered the sponsor-bank integration boundary internally, while regulated bank execution and settlement references remain authoritative to the sponsor bank. Open external dependencies include live settlement verification, callback parity, reconciliation parity, partner-specific ACH/debit/FBO onboarding, and completed sponsor-bank attestations or sign-off.";
  }
  if (/security|csrf|hmac|rate|lockout|auth/.test(q)) {
    return "BAIDNET's documented security baseline includes security headers, rate limiting, failed-auth tracking and temporary lockout, CSRF controls, protected routes, and sponsor-bank callback protections using webhook keys, timestamp checks, optional HMAC verification, and timing-safe comparison.";
  }
  if (/api|endpoint|financial|fiat|payment/.test(q)) {
    return "BAIDNET's documented API structure includes /api/fiat, /api/v1/financial, and /api/payments. The contract layers cover fiat lifecycle actions, callback ingress, reconciliation, financial primitives, idempotent lifecycle actions, disputes, audit and correlation evidence, exports, and runtime integration-boundary evidence.";
  }
  if (/risk|fraud|reconciliation|dispute|idempot/.test(q)) {
    return "BAIDNET's documented control model includes canonical currency routing, fail-closed prevention of USD settlement on blockchain rails, idempotency enforcement, normalized risk classification, deterministic reconciliation, exception workflows, dispute handling, and explicit transport and timeout failure modes.";
  }
  if (/mobile|web|ui|ux|frontend|toggle/.test(q)) {
    return "BAIDNET's UI rules keep fiat and blockchain contexts explicitly separated. The Wallet-to-FinTech toggle changes context only and performs no implicit transfer or conversion. USD does not settle through blockchain, blockchain assets do not settle through fiat, and the frontend consumes backend-authoritative financial state.";
  }
  const first = selected[0]?.section?.replace(/^##[^\n]*\n?/, "").trim();
  return first || "The current BAIDNET knowledge base does not establish that information.";
}

const SYSTEM = `You are BAIDNET Intelligence, the official investor and institutional knowledge assistant for the BAIDNET commercialization portal.
Be calm, polished, credible, conversational, and precise. Use plain English first and technical depth only when useful.
Answer only from supplied BAIDNET knowledge excerpts. Never invent customers, partnerships, sponsor-bank relationships, licenses, regulatory approvals, revenue, transaction volume, valuation, market share, launch dates, or financial projections.
If the evidence does not establish something, say: "The current BAIDNET knowledge base does not establish that information."
Always preserve the distinction between INTERNAL ENGINEERING COMPLETE / PASS and EXTERNAL sponsor-bank, contractual, or production dependencies. Engineering completion does not mean bank approval, regulatory approval, commercial launch, or production banking live.
Use this structure when useful: direct answer; why it matters; remaining dependency or limitation; evidence note. Keep most responses concise and natural for speech.`;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { question, audience = "investor" } = req.body || {};
  if (!question || typeof question !== "string") return res.status(400).json({ error: "A question is required." });
  if (question.length > 3000) return res.status(400).json({ error: "Question is too long." });

  const hits = retrieve(question);
  const selected = hits.length ? hits : SECTIONS.slice(0, 5).map((section, index) => ({ section, index }));
  const sources = sourceNames(selected);
  const context = selected.map((h, i) => `SOURCE ${i + 1}\n${h.section}`).join("\n\n---\n\n");

  // Always keep the investor assistant useful. If OpenAI is not configured or
  // temporarily rejects a request, return a deterministic answer from the
  // approved BAIDNET knowledge base instead of a broken-service message.
  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json({
      answer: groundedFallback(question, selected),
      sources,
      sourceLabel: "Grounded in BAIDNET Platform Knowledge Base",
      audioBase64: null,
      audioMime: "audio/mpeg",
      mode: "knowledge-fallback"
    });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: process.env.OPENAI_TEXT_MODEL || "gpt-5.6-luna",
      instructions: SYSTEM,
      input: `Audience: ${audience}\n\nQuestion: ${question}\n\nBAIDNET knowledge excerpts:\n${context}`,
      max_output_tokens: 700
    });

    const answer = response.output_text?.trim() || groundedFallback(question, selected);
    let audioBase64 = null;
    if (process.env.BAIDNET_VOICE !== "off") {
      try {
        const speech = await openai.audio.speech.create({
          model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
          voice: process.env.OPENAI_TTS_VOICE || "cedar",
          input: answer,
          instructions: "Speak as a polished institutional fintech briefing assistant. Calm, measured, warm, articulate, and conversational. Pronounce BAIDNET as 'Baid-net' and BAIDPAY as 'Baid-pay'."
        });
        audioBase64 = Buffer.from(await speech.arrayBuffer()).toString("base64");
      } catch (error) {
        console.error("BAIDNET voice fallback:", error?.message || error);
      }
    }

    return res.status(200).json({ answer, sources, sourceLabel: "Grounded in BAIDNET Platform Knowledge Base", audioBase64, audioMime: "audio/mpeg", mode: "ai" });
  } catch (error) {
    console.error("BAIDNET OpenAI fallback:", error?.message || error);
    return res.status(200).json({
      answer: groundedFallback(question, selected),
      sources,
      sourceLabel: "Grounded in BAIDNET Platform Knowledge Base",
      audioBase64: null,
      audioMime: "audio/mpeg",
      mode: "knowledge-fallback"
    });
  }
}
