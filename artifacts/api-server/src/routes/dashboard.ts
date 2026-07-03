import { Router } from "express";
import { eq, count, sum, sql } from "drizzle-orm";
import { db, campaignsTable, contactsTable } from "@workspace/db";

const router = Router();

// GET /dashboard/stats
router.get("/dashboard/stats", async (req, res) => {
  const campaigns = await db.select().from(campaignsTable);
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const completedCampaigns = campaigns.filter((c) => c.status === "completed").length;
  const draftCampaigns = campaigns.filter((c) => c.status === "draft").length;
  const downloadedVcfs = campaigns.filter((c) => c.vcfDownloaded).length;

  const [contactsRow] = await db.select({ total: count() }).from(contactsTable);
  const totalContactsCollected = Number(contactsRow?.total ?? 0);

  res.json({
    totalCampaigns,
    activeCampaigns,
    completedCampaigns,
    draftCampaigns,
    totalContactsCollected,
    downloadedVcfs,
  });
});

// GET /analytics/campaigns
router.get("/analytics/campaigns", async (req, res) => {
  const campaigns = await db.select().from(campaignsTable).orderBy(campaignsTable.createdAt);
  const results = await Promise.all(
    campaigns.map(async (c) => {
      const [row] = await db.select({ count: count() }).from(contactsTable).where(eq(contactsTable.campaignId, c.id));
      const contactsCollected = Number(row?.count ?? 0);
      const progressPercent = c.targetContacts > 0
        ? Math.min(100, Math.round((contactsCollected / c.targetContacts) * 100))
        : 0;
      return {
        id: c.id,
        title: c.title,
        status: c.status,
        targetContacts: c.targetContacts,
        contactsCollected,
        progressPercent,
        createdAt: c.createdAt,
      };
    })
  );
  res.json(results);
});

export default router;
