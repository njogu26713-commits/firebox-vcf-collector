import { Router } from "express";
import { randomBytes } from "crypto";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import bcrypt from "bcryptjs";
import { Campaign, Contact, Otp } from "../lib/models";
import { requireAuth } from "../middlewares/requireAuth";
import { sendOtpSms } from "../lib/sms";

const router = Router();

function makeShareToken() {
  return randomBytes(8).toString("hex");
}

function formatCampaign(campaign: any, contactsCollected: number) {
  const remaining = Math.max(0, campaign.targetContacts - contactsCollected);
  const progress = campaign.targetContacts > 0
    ? Math.min(100, Math.round((contactsCollected / campaign.targetContacts) * 100))
    : 0;
  const host = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : "http://localhost:80";
  return {
    id: campaign._id,
    title: campaign.title,
    description: campaign.description ?? null,
    status: campaign.status,
    targetContacts: campaign.targetContacts,
    shareToken: campaign.shareToken,
    vcfDownloaded: campaign.vcfDownloaded,
    allowedCountryCode: campaign.allowedCountryCode ?? null,
    requireWhatsapp: campaign.requireWhatsapp ?? false,
    groupLink: campaign.groupLink ?? null,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
    contactsCollected,
    remainingContacts: remaining,
    progressPercent: progress,
    shareLink: `${host}/submit/${campaign.shareToken}`,
  };
}

// GET /campaigns — only the signed-in user's campaigns
router.get("/campaigns", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const campaigns = await Campaign.find({ userId }).sort({ createdAt: 1 });
  const results = await Promise.all(
    campaigns.map(async (c) => {
      const count = await Contact.countDocuments({ campaignId: c._id });
      return formatCampaign(c, count);
    })
  );
  res.json(results);
});

// POST /campaigns — max 3 per user
router.post("/campaigns", requireAuth, async (req, res) => {
  const userId = (req as any).userId;

  const existing = await Campaign.countDocuments({ userId });
  if (existing >= 3) {
    res.status(403).json({ error: "Campaign limit reached. You can have a maximum of 3 VCF campaigns." });
    return;
  }

  const { title, description, targetContacts, status, allowedCountryCode, requireWhatsapp, groupLink } = req.body;
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const target = Number(targetContacts);
  if (!Number.isInteger(target) || target < 1) {
    res.status(400).json({ error: "targetContacts must be a positive integer" });
    return;
  }
  const validStatuses = ["draft", "active", "completed"];
  const resolvedStatus = status && validStatuses.includes(status) ? status : "draft";
  const resolvedCountryCode =
    allowedCountryCode && typeof allowedCountryCode === "string"
      ? allowedCountryCode.toUpperCase().trim()
      : null;
  const campaign = await Campaign.create({
    userId,
    title: title.trim(),
    description: description ? String(description).trim() : null,
    targetContacts: target,
    status: resolvedStatus,
    shareToken: makeShareToken(),
    allowedCountryCode: resolvedCountryCode,
    requireWhatsapp: requireWhatsapp === true,
    groupLink: typeof groupLink === "string" && groupLink.trim() ? groupLink.trim() : null,
  });
  res.status(201).json(formatCampaign(campaign, 0));
});

// GET /campaigns/by-token/:token (public — used by the submission page)
router.get("/campaigns/by-token/:token", async (req, res) => {
  let campaign;
  try {
    campaign = await Campaign.findOne({ shareToken: req.params.token });
  } catch {
    res.status(503).json({ error: "Service temporarily unavailable" });
    return;
  }
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }
  const count = await Contact.countDocuments({ campaignId: campaign._id });
  res.json(formatCampaign(campaign, count));
});

// GET /campaigns/:id — only owner can access
router.get("/campaigns/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const campaign = await Campaign.findOne({ _id: req.params.id, userId }).catch(() => null);
  if (!campaign) { res.status(404).json({ error: "Not found" }); return; }
  const count = await Contact.countDocuments({ campaignId: campaign._id });
  res.json(formatCampaign(campaign, count));
});

// PATCH /campaigns/:id — only owner can update
router.patch("/campaigns/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { title, description, targetContacts, status, allowedCountryCode, requireWhatsapp, groupLink } = req.body;
  const updates: Record<string, any> = {};
  if (title !== undefined) {
    if (typeof title !== "string" || title.trim().length === 0) {
      res.status(400).json({ error: "title must be a non-empty string" }); return;
    }
    updates.title = title.trim();
  }
  if (description !== undefined) updates.description = description ? String(description).trim() : null;
  if (targetContacts !== undefined) {
    const t = Number(targetContacts);
    if (!Number.isInteger(t) || t < 1) { res.status(400).json({ error: "targetContacts must be a positive integer" }); return; }
    updates.targetContacts = t;
  }
  const validStatuses = ["draft", "active", "completed"];
  if (status !== undefined) {
    if (!validStatuses.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }
    updates.status = status;
  }
  if (allowedCountryCode !== undefined) {
    updates.allowedCountryCode =
      allowedCountryCode && typeof allowedCountryCode === "string"
        ? allowedCountryCode.toUpperCase().trim()
        : null;
  }
  if (requireWhatsapp !== undefined) {
    updates.requireWhatsapp = requireWhatsapp === true;
  }
  if (groupLink !== undefined) {
    updates.groupLink = typeof groupLink === "string" && groupLink.trim() ? groupLink.trim() : null;
  }
  const campaign = await Campaign.findOneAndUpdate({ _id: req.params.id, userId }, updates, { new: true }).catch(() => null);
  if (!campaign) { res.status(404).json({ error: "Not found" }); return; }
  const count = await Contact.countDocuments({ campaignId: campaign._id });
  res.json(formatCampaign(campaign, count));
});

// DELETE /campaigns/:id — only owner can delete
router.delete("/campaigns/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const campaign = await Campaign.findOneAndDelete({ _id: req.params.id, userId }).catch(() => null);
  if (!campaign) { res.status(404).json({ error: "Not found" }); return; }
  await Contact.deleteMany({ campaignId: campaign._id });
  res.status(204).end();
});

// GET /campaigns/:id/vcf — only owner
router.get("/campaigns/:id/vcf", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const campaign = await Campaign.findOne({ _id: req.params.id, userId }).catch(() => null);
  if (!campaign) { res.status(404).json({ error: "Not found" }); return; }
  const collected = await Contact.countDocuments({ campaignId: campaign._id });
  if (collected < campaign.targetContacts) {
    res.status(403).json({ error: "Target not yet reached" });
    return;
  }
  const contacts = await Contact.find({ campaignId: campaign._id });
  const vcfLines = contacts.map((c: any) => [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${c.name}`,
    `TEL:${c.phone}`,
    "END:VCARD",
  ].join("\r\n")).join("\r\n");
  await Campaign.findByIdAndUpdate(campaign._id, { vcfDownloaded: true });
  res.setHeader("Content-Type", "text/vcard");
  res.setHeader("Content-Disposition", `attachment; filename="${campaign.title}.vcf"`);
  res.send(vcfLines);
});

// GET /campaigns/:id/contacts — only owner
router.get("/campaigns/:id/contacts", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const campaign = await Campaign.findOne({ _id: req.params.id, userId }).catch(() => null);
  if (!campaign) { res.status(404).json({ error: "Not found" }); return; }
  const contacts = await Contact.find({ campaignId: campaign._id });
  res.json(contacts);
});

// POST /campaigns/:id/contacts/send-otp (public — step 1 of verified submission)
router.post("/campaigns/:id/contacts/send-otp", async (req, res) => {
  const campaign = await Campaign.findById(req.params.id).catch(() => null);
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }
  if (campaign.status !== "active") { res.status(400).json({ error: "Campaign is not accepting submissions" }); return; }

  const { phone } = req.body;
  if (!phone || typeof phone !== "string" || phone.trim().length < 7) {
    res.status(400).json({ error: "valid phone is required" }); return;
  }
  const normalizedPhone = phone.trim();

  // Country code restriction check
  if (campaign.allowedCountryCode) {
    const parsed = parsePhoneNumberFromString(normalizedPhone);
    if (!parsed || !parsed.isValid() || parsed.country !== campaign.allowedCountryCode) {
      res.status(400).json({
        error: `This campaign only accepts phone numbers from ${campaign.allowedCountryCode}. Please include your country dial code (e.g. +254 for Kenya).`,
        code: "COUNTRY_RESTRICTED",
        allowedCountryCode: campaign.allowedCountryCode,
      });
      return;
    }
  }

  // Block already-submitted phones early
  const alreadySubmitted = await Contact.findOne({ campaignId: campaign._id, phone: normalizedPhone });
  if (alreadySubmitted) {
    res.status(409).json({ error: "This phone number has already been submitted to this campaign" }); return;
  }

  // Delete any OTP older than 1 minute (allowing resend). If one younger exists, the unique
  // index below will reject the insert and we return 429 — this is race-safe.
  await Otp.deleteOne({
    phone: normalizedPhone,
    campaignId: campaign._id,
    createdAt: { $lt: new Date(Date.now() - 60_000) },
  });

  // Generate 6-digit code
  const code = String(Math.floor(100_000 + Math.random() * 900_000));
  const hash = await bcrypt.hash(code, 8);
  const expiresAt = new Date(Date.now() + 5 * 60_000); // 5 minutes

  try {
    await Otp.create({ phone: normalizedPhone, campaignId: campaign._id, code: hash, expiresAt });
  } catch (err: any) {
    if (err.code === 11000) {
      // Duplicate key — a fresh OTP was sent less than 1 minute ago
      res.status(429).json({ error: "A code was already sent. Please wait a moment before requesting another." }); return;
    }
    throw err;
  }

  try {
    await sendOtpSms(normalizedPhone, code);
  } catch (err: any) {
    // Remove the stored OTP so the user can retry immediately
    await Otp.deleteOne({ phone: normalizedPhone, campaignId: campaign._id });
    // Log the real AT error so it appears in Railway/server logs
    req.log.error({ err: err?.message ?? String(err), phone: normalizedPhone }, "SMS OTP send failed");
    res.status(502).json({
      error: "Failed to send SMS. Please check your phone number and try again.",
      // Include AT detail in non-production so you can debug from the browser
      ...(process.env.NODE_ENV !== "production" && { detail: err?.message }),
    }); return;
  }

  res.json({ message: "Verification code sent. It expires in 5 minutes." });
});

// POST /campaigns/:id/contacts/verify-otp (public — step 2 of verified submission)
router.post("/campaigns/:id/contacts/verify-otp", async (req, res) => {
  const campaign = await Campaign.findById(req.params.id).catch(() => null);
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }
  if (campaign.status !== "active") { res.status(400).json({ error: "Campaign is not accepting submissions" }); return; }

  const { name, phone, otp, consent } = req.body;
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "name is required" }); return;
  }
  if (!phone || typeof phone !== "string" || phone.trim().length < 7) {
    res.status(400).json({ error: "valid phone is required" }); return;
  }
  if (!otp || typeof otp !== "string" || !/^\d{6}$/.test(otp.trim())) {
    res.status(400).json({ error: "A 6-digit verification code is required" }); return;
  }
  if (!consent) {
    res.status(400).json({ error: "consent is required" }); return;
  }

  const normalizedPhone = phone.trim();

  // Atomically increment attempts — if no matching document, OTP doesn't exist / already used
  const record = await Otp.findOneAndUpdate(
    { phone: normalizedPhone, campaignId: campaign._id, expiresAt: { $gt: new Date() }, attempts: { $lt: 3 } },
    { $inc: { attempts: 1 } },
    { new: false }, // return the document BEFORE increment so we can inspect pre-increment attempts
  );

  if (!record) {
    // Could be: no OTP found, already expired, or too many attempts
    const expired = await Otp.findOne({ phone: normalizedPhone, campaignId: campaign._id, expiresAt: { $lte: new Date() } });
    if (expired) {
      await Otp.deleteOne({ _id: expired._id });
      res.status(400).json({ error: "Your verification code has expired. Please request a new one." }); return;
    }
    const maxAttempts = await Otp.findOne({ phone: normalizedPhone, campaignId: campaign._id, attempts: { $gte: 3 } });
    if (maxAttempts) {
      await Otp.deleteOne({ _id: maxAttempts._id });
      res.status(400).json({ error: "Too many incorrect attempts. Please request a new code." }); return;
    }
    res.status(400).json({ error: "No pending verification found for this number. Please request a new code." }); return;
  }

  // Check the code (bcrypt compare against the stored hash)
  const match = await bcrypt.compare(otp.trim(), record.code);
  if (!match) {
    const attemptsUsed = record.attempts + 1; // post-increment value
    const remaining = 3 - attemptsUsed;
    if (remaining <= 0) {
      await Otp.deleteOne({ _id: record._id });
      res.status(400).json({ error: "Too many incorrect attempts. Please request a new code." }); return;
    }
    res.status(400).json({
      error: `Incorrect code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
    });
    return;
  }

  // Code is correct — atomically delete (single-use guarantee)
  await Otp.findOneAndDelete({ _id: record._id });

  // Block duplicate phone (race-safe via unique index on Contact if needed)
  const existing = await Contact.findOne({ campaignId: campaign._id, phone: normalizedPhone });
  if (existing) {
    res.status(409).json({ error: "This phone number has already been submitted" }); return;
  }

  const contact = await Contact.create({
    campaignId: campaign._id,
    name: name.trim(),
    phone: normalizedPhone,
  });

  const count = await Contact.countDocuments({ campaignId: campaign._id });
  if (count >= campaign.targetContacts) {
    await Campaign.findByIdAndUpdate(campaign._id, { status: "completed" });
  }

  res.status(201).json(contact);
});

// POST /campaigns/:id/contacts — disabled; all submissions must go through OTP verification
router.post("/campaigns/:id/contacts", (_req, res) => {
  res.status(405).json({
    error: "Direct contact submission is not allowed. Please use the verified submission flow (send-otp → verify-otp).",
  });
});

export default router;
