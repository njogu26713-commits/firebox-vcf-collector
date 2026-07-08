import { mongoose } from "./mongodb";

const { Schema, model, models } = mongoose;

const contactSchema = new Schema(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const campaignSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    status: { type: String, enum: ["draft", "active", "completed"], default: "draft" },
    targetContacts: { type: Number, required: true },
    shareToken: { type: String, required: true, unique: true },
    vcfDownloaded: { type: Boolean, default: false },
    allowedCountryCode: { type: String, default: null },
  },
  { timestamps: true }
);

export const Campaign = models.Campaign || model("Campaign", campaignSchema);
export const Contact = models.Contact || model("Contact", contactSchema);
