import { Router } from "express";
import { eq, count, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db, campaignsTable, contactsTable } from "@workspace/db";

const router = Router();

function makeShareToken() {
  return randomBytes(8).toString("hex");
}

function formatCampaign(campaign: typeof campaignsTable.$inferSelect, contactsCollected: number) {
  const remaining = Math.max(0, campaign.targetContacts - contactsCollected);
  const progress = campaign.targetContacts > 0
    ? Math.min(100, Math.round((contactsCollected / campaign.targetContacts) * 100))
    : 0;
  const host = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : "http://localhost:80";
  return {
    ...campaign,
    contactsCollected,
    remainingContacts: remaining,
    progressPercent: progress,
    shareLink: `${host}/submit/${campaign.shareToken}`,
  };
}

// GET /campaigns
router.get("/campaigns", async (req, res) => {
  const campaigns = await db.select().from(campaignsTable).orderBy(campaignsTable.createdAt);
  const results = await Promise.all(
    campaigns.map(async (c) => {
      const [row] = await db
        .select({ count: count() })
        .from(contactsTable)
        .where(eq(contactsTable.campaignId, c.id));
      return formatCampaign(c, Number(row?.count ?? 0));
    })
  );
  res.json(results);
});

// POST /campaigns
router.post("/campaigns", async (req, res) => {
  const { title, description, targetContacts, status } = req.body;
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const target = Number(targetContacts);
  if (!Number.isInteger(target) || target < 1) {
    res.status(400).json({ error: "targetContacts must be a positive integer" });
    return;
  }
  const validStatuses = ["draft", "active", "completed"] as const;
  const resolvedStatus = status && validStatuses.includes(status) ? status : "draft";
  const [campaign] = await db
    .insert(campaignsTable)
    .values({
      title: title.trim(),
      description: description ? String(description).trim() : null,
      targetContacts: target,
      status: resolvedStatus,
      shareToken: makeShareToken(),
    })
    .returning();
  res.status(201).json(formatCampaign(campaign, 0));
});

// GET /campaigns/:id
router.get("/campaigns/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) { res.status(400).json({ error: "Invalid id" }); return; }
  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, id));
  if (!campaign) { res.status(404).json({ error: "Not found" }); return; }
  const [row] = await db.select({ count: count() }).from(contactsTable).where(eq(contactsTable.campaignId, id));
  res.json(formatCampaign(campaign, Number(row?.count ?? 0)));
});

// PATCH /campaigns/:id
router.patch("/campaigns/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) { res.status(400).json({ error: "Invalid id" }); return; }
  const { title, description, targetContacts, status } = req.body;
  const updates: Partial<typeof campaignsTable.$inferInsert> = { updatedAt: new Date() };
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
  const validStatuses = ["draft", "active", "completed"] as const;
  if (status !== undefined) {
    if (!validStatuses.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }
    updates.status = status;
  }
  const [campaign] = await db.update(campaignsTable).set(updates).where(eq(campaignsTable.id, id)).returning();
  if (!campaign) { res.status(404).json({ error: "Not found" }); return; }
  const [row] = await db.select({ count: count() }).from(contactsTable).where(eq(contactsTable.campaignId, id));
  res.json(formatCampaign(campaign, Number(row?.count ?? 0)));
});

// DELETE /campaigns/:id
router.delete("/campaigns/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(campaignsTable).where(eq(campaignsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.status(204).end();
});

// GET /campaigns/:id/vcf
router.get("/campaigns/:id/vcf", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) { res.status(400).json({ error: "Invalid id" }); return; }
  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, id));
  if (!campaign) { res.status(404).json({ error: "Not found" }); return; }
  const [row] = await db.select({ count: count() }).from(contactsTable).where(eq(contactsTable.campaignId, id));
  const collected = Number(row?.count ?? 0);
  if (collected < campaign.targetContacts) {
    res.status(403).json({ error: "Target not yet reached" });
    return;
  }
  const contacts = await db.select().from(contactsTable).where(eq(contactsTable.campaignId, id));
  const vcfLines = contacts.map((c) => [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${c.name}`,
    `TEL:${c.phone}`,
    "END:VCARD",
  ].join("\r\n")).join("\r\n");
  await db.update(campaignsTable).set({ vcfDownloaded: true }).where(eq(campaignsTable.id, id));
  res.setHeader("Content-Type", "text/vcard");
  res.setHeader("Content-Disposition", `attachment; filename="${campaign.title}.vcf"`);
  res.send(vcfLines);
});

// GET /campaigns/:id/contacts
router.get("/campaigns/:id/contacts", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) { res.status(400).json({ error: "Invalid id" }); return; }
  const contacts = await db.select().from(contactsTable).where(eq(contactsTable.campaignId, id));
  res.json(contacts);
});

// POST /campaigns/:id/contacts  (public submission endpoint)
router.post("/campaigns/:id/contacts", async (req, res) => {
  const campaignId = Number(req.params.id);
  if (!Number.isInteger(campaignId) || campaignId < 1) { res.status(400).json({ error: "Invalid campaign id" }); return; }

  // Validate campaign exists
  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, campaignId));
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

  // Duplicate phone check using normalized digits only
  const [dup] = await db
    .select({ id: contactsTable.id })
    .from(contactsTable)
    .where(
      sql`${contactsTable.campaignId} = ${campaignId}
          AND regexp_replace(${contactsTable.phone}, '[^0-9]', '', 'g')
            = regexp_replace(${phone}::text, '[^0-9]', '', 'g')`
    );
  if (dup) {
    res.status(409).json({ error: "This phone number has already been submitted" });
    return;
  }

  const [contact] = await db.insert(contactsTable).values({
    campaignId,
    name: name.trim(),
    phone: phone.trim(),
  }).returning();

  // Auto-complete campaign if target reached
  const [countRow] = await db.select({ count: count() }).from(contactsTable).where(eq(contactsTable.campaignId, campaignId));
  if (Number(countRow?.count ?? 0) >= campaign.targetContacts) {
    await db.update(campaignsTable).set({ status: "completed" }).where(eq(campaignsTable.id, campaignId));
  }

  res.status(201).json(contact);
});

export default router;
