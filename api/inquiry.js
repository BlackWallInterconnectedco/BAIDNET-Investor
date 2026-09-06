import crypto from "node:crypto";

const TEAM_EMAIL = "BlackWallTeam@blackwall-interconnectedco.com";
const SITE_ORIGIN = "https://baidnet.blackwall-interconnectedco.com";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\-\.\s\d]{7,24}$/;
const ALLOWED_TYPES = new Set([
  "Investor diligence",
  "Financial institution / sponsor bank",
  "Strategic partnership",
  "Technical review",
  "Media / research",
  "Other institutional inquiry",
]);

const clean = (value, limit = 500) => String(value ?? "").trim().slice(0, limit);
const escapeHtml = (value) => clean(value, 5000).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
})[character]);

async function sendEmail({ from, to, replyTo, subject, html, idempotencyKey }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ from, to, reply_to: replyTo, subject, html }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result?.message || "Email delivery request failed.");
  return result;
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed." });
  const emailDomain = clean(process.env.RESEND_EMAIL_DOMAIN, 253);
  const from = process.env.INQUIRY_FROM_EMAIL || (emailDomain ? `BAIDNET <inquiries@${emailDomain}>` : "");
  if (!process.env.RESEND_API_KEY || !from) {
    return response.status(503).json({ error: "Inquiry email service is not configured yet." });
  }

  const body = request.body || {};
  if (clean(body.website, 100)) return response.status(200).json({ received: true });

  const inquiry = {
    name: clean(body.name, 100),
    organization: clean(body.organization, 140),
    email: clean(body.email, 254).toLowerCase(),
    phone: clean(body.phone, 24),
    type: clean(body.type, 80),
    date: clean(body.date, 20),
    time: clean(body.time, 20),
    notes: clean(body.notes, 3000),
  };

  if (!inquiry.name || !inquiry.organization || !inquiry.email || !inquiry.type || !inquiry.notes) {
    return response.status(400).json({ error: "Please complete every required field." });
  }
  if (!EMAIL_PATTERN.test(inquiry.email)) return response.status(400).json({ error: "Please enter a valid email address." });
  if (inquiry.phone && !PHONE_PATTERN.test(inquiry.phone)) return response.status(400).json({ error: "Please enter a valid phone number." });
  if (!ALLOWED_TYPES.has(inquiry.type)) return response.status(400).json({ error: "Please select a valid engagement type." });

  const reference = `BAID-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const receivedAt = new Date().toISOString();
  const safe = Object.fromEntries(Object.entries(inquiry).map(([key, value]) => [key, escapeHtml(value)]));
  const teamHtml = `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#171717">
      <h1 style="color:#8a641c">New BAIDNET institutional inquiry</h1>
      <p><strong>Reference:</strong> ${reference}</p>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px;border-bottom:1px solid #ddd"><strong>Name</strong></td><td style="padding:8px;border-bottom:1px solid #ddd">${safe.name}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd"><strong>Organization</strong></td><td style="padding:8px;border-bottom:1px solid #ddd">${safe.organization}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd"><strong>Email</strong></td><td style="padding:8px;border-bottom:1px solid #ddd">${safe.email}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd"><strong>Phone</strong></td><td style="padding:8px;border-bottom:1px solid #ddd">${safe.phone || "Not provided"}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd"><strong>Engagement</strong></td><td style="padding:8px;border-bottom:1px solid #ddd">${safe.type}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd"><strong>Preferred appointment</strong></td><td style="padding:8px;border-bottom:1px solid #ddd">${safe.date || "Not specified"} ${safe.time || ""}</td></tr>
      </table>
      <h2 style="font-size:18px">Discussion request</h2><p style="white-space:pre-wrap">${safe.notes}</p>
      <p style="color:#666;font-size:12px">Received ${receivedAt} from ${SITE_ORIGIN}</p>
    </div>`;
  const senderHtml = `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#171717">
      <h1 style="color:#8a641c">Your BAIDNET inquiry was received</h1>
      <p>Hello ${safe.name},</p>
      <p>Thank you for contacting BlackWall-Interconnected regarding <strong>${safe.type}</strong>. Your inquiry has been delivered to the BAIDNET team.</p>
      <p><strong>Reference:</strong> ${reference}</p>
      <p>${safe.phone ? `You provided <strong>${safe.phone}</strong> as an optional callback number. ` : ""}A team member will review your request and contact you to confirm any proposed appointment.</p>
      <p>Preferred appointment: <strong>${safe.date || "Not specified"}${safe.time ? ` at ${safe.time}` : ""}</strong></p>
      <p>This message confirms receipt only and does not confirm an appointment, investment, partnership, or service commitment.</p>
      <p>BlackWall-Interconnected Co<br>BAIDNET Commercialization Initiative</p>
    </div>`;

  try {
    await sendEmail({
      from,
      to: TEAM_EMAIL,
      replyTo: inquiry.email,
      subject: `${reference} | ${inquiry.type} | ${inquiry.organization}`,
      html: teamHtml,
      idempotencyKey: `${reference}-team`,
    });
    await sendEmail({
      from,
      to: inquiry.email,
      replyTo: TEAM_EMAIL,
      subject: `BAIDNET inquiry received | ${reference}`,
      html: senderHtml,
      idempotencyKey: `${reference}-sender`,
    });
    return response.status(200).json({ received: true, reference, message: "Your inquiry was received. A confirmation email has been sent." });
  } catch (error) {
    console.error("BAIDNET inquiry delivery error", error);
    return response.status(502).json({ error: "We could not confirm delivery. Please use the direct email option." });
  }
}
