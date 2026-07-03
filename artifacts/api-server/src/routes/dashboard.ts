import { Router } from "express";
import { Campaign, Contact } from "../lib/models";

const router = Router();

// GET /dashboard/stats
router.get("/dashboard/stats", async (req, res) => {
  const campaigns = await Campaign.find();
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c: any) => c.status === "active").length;
  const completedCampaigns = campaigns.filter((c: any) => c.status === "completed").length;
  const draftCampaigns = campaigns.filter((c: any) => c.status === "draft").length;
  const downloadedVcfs = campaigns.filter((c: any) => c.vcfDownloaded).length;
  const totalContactsCollected = await Contact.countDocuments();

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
  const campaigns = await Campaign.find().sort({ createdAt: 1 });
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
