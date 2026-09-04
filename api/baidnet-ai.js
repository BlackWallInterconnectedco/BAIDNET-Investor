import OpenAI from "openai";
import { KNOWLEDGE } from "./baidnet-knowledge.js";

const SECTIONS = KNOWLEDGE.split(/\n(?=##\s+\d+\))/g).map(s => s.trim()).filter(Boolean);

function tokenize(text = "") {
  return [...new Set(text.toLowerCase().replace(/[^a-z0-9_\-\/ ]+/g, " ").split(/\s+/).filter(w => w.length > 2))];
}

function retrieve(question, maxSections = 6) {
  const q = tokenize(question);
  const lowerQ = question.toLowerCase();
  const boosts = [
    [/risk|mitigat|fraud|reconcil|dispute|idempot|fail.?closed|timeout/, /risk|fraud|reconcil|dispute|idempot|fail.?closed|timeout/],
    [/sponsor|bank|parity|ach|debit|fbo|external|dependency|settlement/, /sponsor|bank|parity|ach|debit|fbo|external|dependency|settlement/],
    [/security|csrf|hmac|rate|lockout|auth|webhook/, /security|csrf|hmac|rate|lockout|auth|webhook/],
    [/api|endpoint|financial|fiat|payment|route/, /api|endpoint|financial|fiat|payment|route/],
    [/mobile|web|ui|ux|frontend|toggle|wallet/, /mobile|web|ui|ux|frontend|toggle|wallet/],
    [/complete|ready|status|launch|built|remaining|closeout/, /complete|ready|status|launch|built|remaining|closeout/],
    [/audit|evidence|integrity|hash|bundle|trace|event/, /audit|evidence|integrity|hash|bundle|trace|event/],
    [/compliance|governance|classification|counsel|contract/, /compliance|governance|classification|counsel|contract/],
    [/architecture|authority|boundary|ledger|ownership/, /architecture|authority|boundary|ledger|ownership/]
  ];
  return SECTIONS.map((section, index) => {
    const lower = section.toLowerCase();
    let score = 0;
    for (const term of q) if (lower.includes(term)) score += term.length >= 8 ? 4 : 1;
    for (const [qp, sp] of boosts) if (qp.test(lowerQ) && sp.test(lower)) score += 10;
    return { section, index, score };
  }).sort((a, b) => b.score - a.score).filter(x => x.score > 0).slice(0, maxSections);
}

function sourceNames(selected) {
  return selected.map(h => {
    const m = h.section.match(/^##\s+([^\n]+)/);
    return m ? m[1].trim() : `Knowledge section ${h.index + 1}`;
  });
}

function intentOf(question = "") {
  const q = question.toLowerCase();
  if (/what risks?|risk(s)? (has|have)|mitigat|reduce(d)? risk|risk controls?/.test(q)) return "risk";
  if (/security|csrf|hmac|rate limit|lockout|authentication|webhook/.test(q)) return "security";
  if (/ready|readiness|status|complete|remaining|launch|built|closeout/.test(q)) return "readiness";
  if (/sponsor|bank|ach|debit|fbo|external|dependency|production parity/.test(q)) return "sponsor";
  if (/api|endpoint|route|financial primitives|fiat lifecycle/.test(q)) return "api";
  if (/audit|evidence|integrity|hash|bundle|trace|reconstruct/.test(q)) return "evidence";
  if (/compliance|governance|regulat|counsel|contract|classification/.test(q)) return "compliance";
  if (/architecture|authority|boundary|ledger|who controls|ownership/.test(q)) return "architecture";
  if (/mobile|web|ui|ux|frontend|toggle|wallet|fintech experience/.test(q)) return "ui";
  if (/what is baidnet|platform|overview|describe baidnet/.test(q)) return "overview";
  return "general";
}

function groundedFallback(question, selected) {
  const intent = intentOf(question);

  if (intent === "risk") {
    return `BAIDNET has mitigated several specific operational and transaction risks in its internal engineering baseline:\n\n1. Wrong-rail settlement risk — canonical currency routing and fail-closed controls prevent USD from being settled on blockchain rails and prevent blockchain assets from being settled through the fiat path.\n2. Duplicate transaction risk — idempotency controls prevent the same lifecycle action from being processed more than once.\n3. Reconciliation risk — deterministic reconciliation compares internal transaction state against authoritative external settlement records and routes mismatches into an exception workflow.\n4. Dispute and refund risk — dispute creation, review, refund handling, and lifecycle evidence are explicitly modeled rather than handled as informal operational steps.\n5. Integration and transport risk — the system uses explicit failure modes for callbacks, transport errors, and timeouts instead of silently assuming success.\n6. Risk-classification inconsistency — normalized risk classification gives the platform a consistent internal way to evaluate and record transaction risk.\n7. Evidence and audit risk — lifecycle events, financial API events, audit/outbox records, agency-ledger evidence, and hashed export receipts support reconstruction of what happened.\n\nThese are internal engineering controls. They do not replace sponsor-bank compliance decisions, regulated bank execution controls, or external production validation.`;
  }

  if (intent === "readiness") {
    return `BAIDNET's internal FinTech engineering is COMPLETE / PASS across the A-G program. That includes the fiat transaction lifecycle, versioned financial primitives, risk controls, reconciliation, disputes, sponsor-bank integration-boundary engineering, runtime evidence, and consolidated closeout.\n\nWhat remains open is external: live sponsor-bank settlement verification, callback parity, reconciliation parity, partner-specific ACH/debit/FBO onboarding, and completed sponsor-bank attestations or sign-off.\n\nSo the correct readiness statement is: internal engineering complete; external sponsor-bank production dependency remains open.`;
  }

  if (intent === "sponsor") {
    return `BAIDNET has already engineered the sponsor-bank integration boundary, but it does not claim authority over regulated bank execution. BAIDNET controls its internal transaction representation, lifecycle controls, reconciliation logic, evidence, APIs, and integration boundary. The sponsor bank remains authoritative for regulated execution records and settlement references.\n\nThe open external items are live settlement verification, callback parity, reconciliation parity, partner-specific ACH/debit/FBO onboarding, and sponsor-bank attestations or sign-off.`;
  }

  if (intent === "security") {
    return `BAIDNET's documented security baseline includes security headers, rate limiting, failed-auth tracking with temporary lockout, CSRF protections, protected routes, and sponsor-bank webhook protections using keys, timestamps, optional HMAC verification, and timing-safe comparison.\n\nThose controls reduce common web, authentication, replay, and callback-integrity risks. They are part of the internal engineering baseline and remain separate from any security controls imposed by a future sponsor bank.`;
  }

  if (intent === "api") {
    return `BAIDNET's documented API structure is organized around three primary surfaces: /api/fiat, /api/v1/financial, and /api/payments. Together they cover fiat lifecycle actions, financial primitives, idempotent lifecycle operations, callback ingress, reconciliation, disputes, context and event evidence, audit/correlation records, exports, and runtime integration-boundary evidence.\n\nThe design keeps BAIDNET's internal API authority separate from the sponsor bank's regulated execution authority.`;
  }

  if (intent === "evidence") {
    return `BAIDNET's evidence model is designed so a transaction can be reconstructed rather than merely viewed as a final balance change. The documented evidence set includes FiatTransaction records, TransactionLifecycleEvent records, FinancialApiEvent records, idempotency records, audit/outbox evidence, agency-ledger evidence, and export receipts protected with a SHA-256 bundle hash.\n\nThat matters because it gives technical reviewers and auditors a traceable chain from request, through lifecycle state changes, to reconciliation and export evidence.`;
  }

  if (intent === "compliance") {
    return `BAIDNET's compliance approach is based on an explicit responsibility boundary rather than claiming that every regulated decision belongs to the platform. Requirements are classified as INHERITED, EXTEND, INTEGRATE, BUILD, VERIFY, BANK DECISION, or COUNSEL/CONTRACT.\n\nBAIDNET can engineer and verify the controls it owns. Sponsor-bank decisions, contractual terms, and legal classifications remain external where they require bank authority or counsel. That is why internal engineering completion is not described as regulatory approval or bank approval.`;
  }

  if (intent === "architecture") {
    return `BAIDNET is structured as one platform with two distinct settlement contexts. The blockchain path handles digital-asset settlement; the fiat path is designed for bank-rail settlement behind a sponsor-bank boundary.\n\nBAIDNET owns the internal transaction representation, lifecycle controls, APIs, reconciliation logic, and evidence. A sponsor bank remains authoritative for regulated bank execution records and settlement references. The architecture intentionally avoids creating a duplicate FinTech core.`;
  }

  if (intent === "ui") {
    return `BAIDNET's UI rules are designed to prevent the interface from implying a transaction that the backend did not authorize. The Wallet-to-FinTech toggle changes context only; it does not perform an implicit transfer or conversion. Fiat and blockchain balances remain separated, the selected currency remains stable, USD is prevented from settling on blockchain rails, blockchain assets are prevented from settling on fiat rails, and the frontend consumes backend-authoritative financial state.`;
  }

  if (intent === "overview") {
    return `BAIDNET is a hybrid financial infrastructure platform that combines an existing blockchain settlement path with a separately governed fiat transaction path designed for sponsor-bank integration. The two contexts share disciplined transaction, API, evidence, and user-experience patterns while remaining separate at the settlement layer. Internal FinTech engineering is complete / pass; live sponsor-bank production parity remains an external dependency.`;
  }

  const first = selected[0]?.section?.replace(/^##[^\n]*\n?/, "").trim();
  if (first) return `Here is the most directly relevant information in the BAIDNET knowledge base:\n\n${first}`;
  return "The current BAIDNET knowledge base does not establish that information.";
}

const SYSTEM = `You are BAIDNET Intelligence, the official investor and institutional knowledge assistant for the BAIDNET commercialization portal.
Answer the exact question first. Do not lead with generic platform summaries unless the user asked for an overview.
Use concrete BAIDNET controls, components, responsibilities, or evidence whenever the source supports them.
Be calm, polished, credible, conversational, and precise. Use plain English first and technical depth only when useful.
Answer only from supplied BAIDNET knowledge excerpts. Never invent customers, partnerships, sponsor-bank relationships, licenses, regulatory approvals, revenue, transaction volume, valuation, market share, launch dates, or financial projections.
If the evidence does not establish something, say: "The current BAIDNET knowledge base does not establish that information."
Always preserve the distinction between INTERNAL ENGINEERING COMPLETE / PASS and EXTERNAL sponsor-bank, contractual, or production dependencies. Engineering completion does not mean bank approval, regulatory approval, commercial launch, or production banking live.
For questions asking what BAIDNET has mitigated, built, secured, verified, or controlled, enumerate the specific controls and explain what risk or problem each one addresses.
For comparison or diligence questions, separate: what BAIDNET controls; what the sponsor bank controls; what remains open.
Keep most responses concise enough for speech, but do not sacrifice specificity.`;

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
  const intent = intentOf(question);

  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json({
      answer: groundedFallback(question, selected),
      sources,
      sourceLabel: "Grounded in BAIDNET Platform Knowledge Base",
      intent,
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
      input: `Audience: ${audience}\nIntent: ${intent}\n\nQuestion: ${question}\n\nBAIDNET knowledge excerpts:\n${context}`,
      max_output_tokens: 850
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

    return res.status(200).json({ answer, sources, sourceLabel: "Grounded in BAIDNET Platform Knowledge Base", intent, audioBase64, audioMime: "audio/mpeg", mode: "ai" });
  } catch (error) {
    console.error("BAIDNET OpenAI fallback:", error?.message || error);
    return res.status(200).json({
      answer: groundedFallback(question, selected),
      sources,
      sourceLabel: "Grounded in BAIDNET Platform Knowledge Base",
      intent,
      audioBase64: null,
      audioMime: "audio/mpeg",
      mode: "knowledge-fallback"
    });
  }
}
