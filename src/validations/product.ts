import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  supplierId: z.string().min(1, "Supplier is required"),
  description: z.string().optional(),
  purchasePrice: z.coerce.number().min(0, "Purchase price must be greater than or equal to 0"),
  sellingPrice: z.coerce.number().min(0, "Selling price must be greater than or equal to 0"),
  quantity: z.coerce.number().int().min(0, "Quantity must be at least 0"),
  minimumStock: z.coerce.number().int().min(0, "Minimum stock must be at least 0"),
  image: z.string().optional(),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).default("ACTIVE"),
});

export type ProductInput = z.infer<typeof productSchema>;
