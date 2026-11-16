import { Router } from "express";
import { Campaign, Contact } from "../lib/models";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// GET /dashboard/stats
router.get("/dashboard/stats", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const campaigns = await Campaign.find({ userId });
  const campaignIds = campaigns.map((campaign) => campaign._id);
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c: any) => c.status === "active").length;
  const completedCampaigns = campaigns.filter((c: any) => c.status === "completed").length;
  const draftCampaigns = campaigns.filter((c: any) => c.status === "draft").length;
  const downloadedVcfs = campaigns.filter((c: any) => c.vcfDownloaded).length;
  const totalContactsCollected = await Contact.countDocuments({ campaignId: { $in: campaignIds } });

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
router.get("/analytics/campaigns", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const campaigns = await Campaign.find({ userId }).sort({ createdAt: 1 });
  const results = await Promise.all(
    campaigns.map(async (c: any) => {
      const contactsCollected = await Contact.countDocuments({ campaignId: c._id });
      const progressPercent = c.targetContacts > 0
        ? Math.min(100, Math.round((contactsCollected / c.targetContacts) * 100))
        : 0;
      return {
        id: c._id,
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
