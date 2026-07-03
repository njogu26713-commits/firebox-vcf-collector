import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const campaignStatusEnum = pgEnum("campaign_status", ["draft", "active", "completed"]);

export const campaignsTable = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: campaignStatusEnum("status").notNull().default("draft"),
  targetContacts: integer("target_contacts").notNull(),
  shareToken: text("share_token").notNull().unique(),
  vcfDownloaded: boolean("vcf_downloaded").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCampaignSchema = createInsertSchema(campaignsTable).omit({ id: true, shareToken: true, vcfDownloaded: true, createdAt: true, updatedAt: true });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaignsTable.$inferSelect;
