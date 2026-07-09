import { mongoose } from "./mongodb";

const { Schema, model, models } = mongoose;

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: null, trim: true },
  },
  { timestamps: true }
);

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
    userId: { type: String, required: false, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    status: { type: String, enum: ["draft", "active", "completed"], default: "draft" },
    targetContacts: { type: Number, required: true },
    shareToken: { type: String, required: true, unique: true },
    vcfDownloaded: { type: Boolean, default: false },
    allowedCountryCode: { type: String, default: null },
    requireWhatsapp: { type: Boolean, default: false },
    groupLink: { type: String, default: null },
  },
  { timestamps: true }
);

// OTP — short-lived phone verification codes (MongoDB TTL index auto-deletes after expiry)
const otpSchema = new Schema(
  {
    phone: { type: String, required: true, trim: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    code: { type: String, required: true }, // bcrypt hash of the 6-digit code
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// TTL index — MongoDB removes the document automatically after expiresAt
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Compound index for fast phone+campaign lookups
otpSchema.index({ phone: 1, campaignId: 1 });

export const User = models.User || model("User", userSchema);
export const Campaign = models.Campaign || model("Campaign", campaignSchema);
export const Contact = models.Contact || model("Contact", contactSchema);
export const Otp = models.Otp || model("Otp", otpSchema);
