import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettings extends Document {
  key: string; // 'global' to maintain singleton
  companyName: string;
  logo?: string;
  address?: string;
  gstNumber?: string;
  contactPhone?: string;
  contactEmail?: string;
  
  // SMTP Configuration
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  smtpFromEmail?: string;
  smtpFromName?: string;

  // Security Configuration
  passwordMinLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;

  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    key: { type: String, default: "global", unique: true, required: true },
    companyName: { type: String, default: "Enterprise Inventory" },
    logo: { type: String },
    address: { type: String },
    gstNumber: { type: String },
    contactPhone: { type: String },
    contactEmail: { type: String },

    smtpHost: { type: String },
    smtpPort: { type: Number },
    smtpSecure: { type: Boolean },
    smtpUser: { type: String },
    smtpPass: { type: String },
    smtpFromEmail: { type: String },
    smtpFromName: { type: String },

    passwordMinLength: { type: Number, default: 8 },
    requireUppercase: { type: Boolean, default: false },
    requireNumbers: { type: Boolean, default: false },
    requireSpecialChars: { type: Boolean, default: false },
    sessionTimeoutMinutes: { type: Number, default: 30 },
    maxLoginAttempts: { type: Number, default: 5 },
    lockoutDurationMinutes: { type: Number, default: 15 },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);
