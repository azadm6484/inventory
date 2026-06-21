import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEmailLog extends Document {
  recipient: string;
  subject: string;
  template: string;
  status: "PENDING" | "SENT" | "FAILED";
  errorMessage?: string;
  sentAt?: Date;
  createdAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    recipient: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    template: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED"],
      default: "PENDING",
      index: true,
    },
    errorMessage: { type: String },
    sentAt: { type: Date },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export const EmailLog: Model<IEmailLog> =
  mongoose.models.EmailLog || mongoose.model<IEmailLog>("EmailLog", EmailLogSchema);
