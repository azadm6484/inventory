import mongoose, { Schema, Model } from "mongoose";

export interface IInventoryTransaction {
  productId: mongoose.Types.ObjectId;
  type: "IN" | "OUT" | "ADJUSTMENT" | "RETURN";
  quantity: number;
  previousStock: number;
  newStock: number;
  notes?: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const InventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["IN", "OUT", "ADJUSTMENT", "RETURN"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    previousStock: {
      type: Number,
      required: true,
      min: 0,
    },
    newStock: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Validation Middleware
InventoryTransactionSchema.pre("save", function (next: any) {
  if (this.quantity <= 0) {
    return next(new Error("Quantity must be greater than zero"));
  }

  if (this.newStock < 0) {
    return next(new Error("Resulting stock cannot be negative"));
  }

  switch (this.type) {
    case "IN":
      if (this.newStock !== this.previousStock + this.quantity) {
        return next(
          new Error(
            "IN transaction: newStock must equal previousStock + quantity"
          )
        );
      }
      break;

    case "OUT":
      if (this.newStock !== this.previousStock - this.quantity) {
        return next(
          new Error(
            "OUT transaction: newStock must equal previousStock - quantity"
          )
        );
      }
      break;

    case "ADJUSTMENT":
    case "RETURN":
      break;
  }

  next();
});

export const InventoryTransaction: Model<IInventoryTransaction> =
  mongoose.models.InventoryTransaction ||
  mongoose.model<IInventoryTransaction>(
    "InventoryTransaction",
    InventoryTransactionSchema
  );