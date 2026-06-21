import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISupplier extends Document {
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    companyName: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String },
    address: { type: String },
    gstNumber: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Supplier: Model<ISupplier> =
  mongoose.models.Supplier || mongoose.model<ISupplier>("Supplier", SupplierSchema);
