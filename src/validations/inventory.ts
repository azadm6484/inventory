import { z } from "zod";

export const transactionSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  type: z.enum(["IN", "OUT", "RETURN"]),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  notes: z.string().optional(),
});

export const adjustmentSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  newQuantity: z.coerce.number().int().min(0, "New quantity must be at least 0"),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type AdjustmentInput = z.infer<typeof adjustmentSchema>;
