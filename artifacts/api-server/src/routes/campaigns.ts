import { Router } from "express";
import { randomBytes } from "crypto";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Campaign, Contact } from "../lib/models";

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
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
    contactsCollected,
    remainingContacts: remaining,
    progressPercent: progress,
    shareLink: `${host}/submit/${campaign.shareToken}`,
  };
}

// GET /campaigns
router.get("/campaigns", async (req, res) => {
  const campaigns = await Campaign.find().sort({ createdAt: 1 });
  const results = await Promise.all(
    campaigns.map(async (c) => {
      const count = await Contact.countDocuments({ campaignId: c._id });
      return formatCampaign(c, count);
    })
  );
  res.json(results);
});

// POST /campaigns
router.post("/campaigns", async (req, res) => {
  const { title, description, targetContacts, status, allowedCountryCode } = req.body;
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
    title: title.trim(),
    description: description ? String(description).trim() : null,
    targetContacts: target,
    status: resolvedStatus,
    shareToken: makeShareToken(),
    allowedCountryCode: resolvedCountryCode,
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

// GET /campaigns/:id
router.get("/campaigns/:id", async (req, res) => {
  const campaign = await Campaign.findById(req.params.id).catch(() => null);
  if (!campaign) { res.status(404).json({ error: "Not found" }); return; }
  const count = await Contact.countDocuments({ campaignId: campaign._id });
  res.json(formatCampaign(campaign, count));
});

// PATCH /campaigns/:id
router.patch("/campaigns/:id", async (req, res) => {
  const { title, description, targetContacts, status, allowedCountryCode } = req.body;
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
  const campaign = await Campaign.findByIdAndUpdate(req.params.id, updates, { new: true }).catch(() => null);
  if (!campaign) { res.status(404).json({ error: "Not found" }); return; }
  const count = await Contact.countDocuments({ campaignId: campaign._id });
  res.json(formatCampaign(campaign, count));
});

// DELETE /campaigns/:id
router.delete("/campaigns/:id", async (req, res) => {
  const campaign = await Campaign.findByIdAndDelete(req.params.id).catch(() => null);
  if (!campaign) { res.status(404).json({ error: "Not found" }); return; }
  await Contact.deleteMany({ campaignId: campaign._id });
  res.status(204).end();
});

// GET /campaigns/:id/vcf
router.get("/campaigns/:id/vcf", async (req, res) => {
  const campaign = await Campaign.findById(req.params.id).catch(() => null);
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

// GET /campaigns/:id/contacts
router.get("/campaigns/:id/contacts", async (req, res) => {
  const contacts = await Contact.find({ campaignId: req.params.id });
  res.json(contacts);
});

// POST /campaigns/:id/contacts (public submission)
router.post("/campaigns/:id/contacts", async (req, res) => {
  const campaign = await Campaign.findById(req.params.id).catch(() => null);
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }
  if (campaign.status !== "active") { res.status(400).json({ error: "Campaign is not accepting submissions" }); return; }

  const { name, phone, consent } = req.body;
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "name is required" }); return;
  }
  if (!phone || typeof phone !== "string" || phone.trim().length < 7) {
    res.status(400).json({ error: "valid phone is required" }); return;
  }
  if (!consent) {
    res.status(400).json({ error: "consent is required" }); return;
  }

  // Country code restriction check
  if (campaign.allowedCountryCode) {
    const parsed = parsePhoneNumberFromString(phone.trim());
    if (!parsed || !parsed.isValid() || parsed.country !== campaign.allowedCountryCode) {
      res.status(400).json({
        error: `This campaign only accepts phone numbers from ${campaign.allowedCountryCode}. Please include your country dial code (e.g. +1 for US).`,
        code: "COUNTRY_RESTRICTED",
        allowedCountryCode: campaign.allowedCountryCode,
      });
      return;
    }
  }

  const existing = await Contact.findOne({ campaignId: campaign._id }).where("phone").equals(phone.trim());
  if (existing) {
    res.status(409).json({ error: "This phone number has already been submitted" });
    return;
  }

  const contact = await Contact.create({
    campaignId: campaign._id,
    name: name.trim(),
    phone: phone.trim(),
  });

  const count = await Contact.countDocuments({ campaignId: campaign._id });
  if (count >= campaign.targetContacts) {
    await Campaign.findByIdAndUpdate(campaign._id, { status: "completed" });
  }

  res.status(201).json(contact);
});

export default router;
