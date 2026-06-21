"use server";

import { auth } from "@/lib/auth/auth";
import { ProductRepository } from "@/repositories/ProductRepository";
import { InventoryRepository } from "@/repositories/InventoryRepository";
import { AuditService } from "@/services/AuditService";
import { NotificationService } from "@/services/NotificationService";
import { EmailService } from "@/services/EmailService";
import { transactionSchema, adjustmentSchema } from "@/validations/inventory";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db/mongodb";

const productRepo = new ProductRepository();
const inventoryRepo = new InventoryRepository();

export async function stockIn(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if ((session.user as any).role === "STAFF") return { error: "Unauthorized. Staff members cannot perform this action." };

  const data = Object.fromEntries(formData.entries());
  const validation = transactionSchema.safeParse({ ...data, type: "IN" });
  if (!validation.success) return { error: validation.error.issues[0].message };

  try {
    await dbConnect();
    const product = await productRepo.findById(validation.data.productId);
    if (!product) return { error: "Product not found." };

    const previousStock = product.quantity;
    const newStock = previousStock + validation.data.quantity;

    await productRepo.update(product._id.toString(), { quantity: newStock });
    await inventoryRepo.createTransaction({
      productId: product._id as any,
      type: "IN",
      quantity: validation.data.quantity,
      previousStock,
      newStock,
      notes: validation.data.notes,
      userId: (session.user as any).id as any,
      createdAt: new Date(),
    });

    await AuditService.log({
      userId: (session.user as any).id,
      action: "STOCK_IN",
      module: "INVENTORY",
      entityId: product._id.toString(),
      newData: { qty: validation.data.quantity, newStock },
    });

    revalidatePath("/inventory");
    return { success: `Stock in of ${validation.data.quantity} units recorded successfully.` };
  } catch (error: any) {
    return { error: error.message || "Failed to record stock in." };
  }
}

export async function stockOut(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if ((session.user as any).role === "STAFF") return { error: "Unauthorized. Staff members cannot perform this action." };

  const data = Object.fromEntries(formData.entries());
  const validation = transactionSchema.safeParse({ ...data, type: "OUT" });
  if (!validation.success) return { error: validation.error.issues[0].message };

  try {
    await dbConnect();
    const product = await productRepo.findById(validation.data.productId);
    if (!product) return { error: "Product not found." };

    if (product.quantity < validation.data.quantity) {
      return { error: `Insufficient stock. Available: ${product.quantity} units.` };
    }

    const previousStock = product.quantity;
    const newStock = previousStock - validation.data.quantity;

    await productRepo.update(product._id.toString(), { quantity: newStock });
    await inventoryRepo.createTransaction({
      productId: product._id as any,
      type: "OUT",
      quantity: validation.data.quantity,
      previousStock,
      newStock,
      notes: validation.data.notes,
      userId: (session.user as any).id as any,
      createdAt: new Date(),
    });

    // Check for low stock or out of stock thresholds
    const alertPromises = [];
    if (newStock === 0) {
      alertPromises.push(
        NotificationService.notifyAdmins({
          title: "Out of Stock Alert",
          message: `${product.name} (${product.sku}) is now out of stock.`,
          type: "ERROR",
        }),
        EmailService.sendOutOfStock(product.name, product.sku)
      );
    } else if (newStock <= product.minimumStock) {
      alertPromises.push(
        NotificationService.notifyAdmins({
          title: "Low Stock Alert",
          message: `${product.name} (${product.sku}) has fallen below minimum stock (${newStock} remaining).`,
          type: "WARNING",
        }),
        EmailService.sendLowStock(product.name, product.sku, newStock, product.minimumStock)
      );
    }
    if (alertPromises.length) await Promise.all(alertPromises);

    await AuditService.log({
      userId: (session.user as any).id,
      action: "STOCK_OUT",
      module: "INVENTORY",
      entityId: product._id.toString(),
      newData: { qty: validation.data.quantity, newStock },
    });

    revalidatePath("/inventory");
    return { success: `Stock out of ${validation.data.quantity} units recorded successfully.` };
  } catch (error: any) {
    return { error: error.message || "Failed to record stock out." };
  }
}

export async function adjustStock(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if ((session.user as any).role === "STAFF") return { error: "Unauthorized. Staff members cannot perform this action." };

  const data = Object.fromEntries(formData.entries());
  const validation = adjustmentSchema.safeParse(data);
  if (!validation.success) return { error: validation.error.issues[0].message };

  try {
    await dbConnect();
    const product = await productRepo.findById(validation.data.productId);
    if (!product) return { error: "Product not found." };

    const previousStock = product.quantity;
    const newStock = validation.data.newQuantity;

    await productRepo.update(product._id.toString(), { quantity: newStock });
    await inventoryRepo.createTransaction({
      productId: product._id as any,
      type: "ADJUSTMENT",
      quantity: Math.abs(newStock - previousStock),
      previousStock,
      newStock,
      notes: validation.data.reason,
      userId: (session.user as any).id as any,
      createdAt: new Date(),
    });

    await Promise.all([
      AuditService.log({
        userId: (session.user as any).id,
        action: "STOCK_ADJUSTMENT",
        module: "INVENTORY",
        entityId: product._id.toString(),
        oldData: { quantity: previousStock },
        newData: { quantity: newStock, reason: validation.data.reason },
      }),
      EmailService.sendInventoryAdjustment({
        productName: product.name,
        sku: product.sku,
        prevStock: previousStock,
        newStock,
        user: session.user.name || "Unknown",
        reason: validation.data.reason,
      }),
    ]);

    revalidatePath("/inventory");
    return { success: "Stock adjustment recorded successfully." };
  } catch (error: any) {
    return { error: error.message || "Failed to adjust stock." };
  }
}
