import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEmailVerificationToken extends Document {
  email: string;
  token: string;
  expires: Date;
  createdAt: Date;
}

const EmailVerificationTokenSchema = new Schema<IEmailVerificationToken>(
  {
    email: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    expires: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Auto expire after the expiration date using MongoDB TTL Index
EmailVerificationTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

export const EmailVerificationToken: Model<IEmailVerificationToken> =
  mongoose.models.EmailVerificationToken ||
  mongoose.model<IEmailVerificationToken>("EmailVerificationToken", EmailVerificationTokenSchema);
