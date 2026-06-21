import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
  name: string;
  sku: string; // PRD-XXXXX
  barcode?: string;
  categoryId: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  description?: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  minimumStock: number;
  image?: string;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    sku: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    barcode: { type: String, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    description: { type: String },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    minimumStock: { type: Number, required: true, default: 10, min: 0 },
    image: { type: String },
    status: {
      type: String,
      enum: ["ACTIVE", "DRAFT", "ARCHIVED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

// Model methods for stock operations with validation
ProductSchema.methods.stockIn = async function (qty: number) {
  if (qty <= 0) throw new Error("Stock in quantity must be positive");
  this.quantity += qty;
  return this.save();
};

ProductSchema.methods.stockOut = async function (qty: number) {
  if (qty <= 0) throw new Error("Stock out quantity must be positive");
  if (this.quantity < qty) throw new Error(`Insufficient stock. Available: ${this.quantity} units.`);
  this.quantity -= qty;
  return this.save();
};

// Compound index for search performance
ProductSchema.index({ name: "text", sku: "text", barcode: "text" });

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
