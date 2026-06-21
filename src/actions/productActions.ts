"use server";

import { auth } from "@/lib/auth/auth";
import { ProductRepository } from "@/repositories/ProductRepository";
import { AuditService } from "@/services/AuditService";
import { NotificationService } from "@/services/NotificationService";
import { EmailService } from "@/services/EmailService";
import { productSchema } from "@/validations/product";
import { Product } from "@/models/Product";
import { dbConnect } from "@/lib/db/mongodb";
import { revalidatePath } from "next/cache";

const productRepo = new ProductRepository();

export async function createProduct(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if ((session.user as any).role === "STAFF") return { error: "Unauthorized. Staff members cannot perform this action." };

  const data = Object.fromEntries(formData.entries());
  const validation = productSchema.safeParse(data);
  if (!validation.success) return { error: validation.error.issues[0].message };

  try {
    await dbConnect();
    const sku = await productRepo.generateNextSku();
    const product = await productRepo.create({ ...validation.data, sku } as any);

    await Promise.all([
      AuditService.log({
        userId: (session.user as any).id,
        action: "CREATE_PRODUCT",
        module: "PRODUCTS",
        entityId: product._id.toString(),
        newData: validation.data,
      }),
      NotificationService.notifyAdmins({
        title: "New Product Created",
        message: `Product "${product.name}" (${sku}) has been added to the catalog.`,
        type: "SUCCESS",
      }),
      EmailService.sendProductCreated({
        name: product.name,
        sku,
        qty: product.quantity,
        user: session.user.name || "Unknown",
      }),
    ]);

    revalidatePath("/products");
    return { success: "Product created successfully.", product };
  } catch (error: any) {
    return { error: error.message || "Failed to create product." };
  }
}

export async function updateProduct(id: string, prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if ((session.user as any).role === "STAFF") return { error: "Unauthorized. Staff members cannot perform this action." };

  const data = Object.fromEntries(formData.entries());
  const validation = productSchema.safeParse(data);
  if (!validation.success) return { error: validation.error.issues[0].message };

  try {
    const oldProduct = await productRepo.findById(id);
    if (!oldProduct) return { error: "Product not found." };

    const updated = await productRepo.update(id, validation.data as any);

    await Promise.all([
      AuditService.log({
        userId: (session.user as any).id,
        action: "UPDATE_PRODUCT",
        module: "PRODUCTS",
        entityId: id,
        oldData: oldProduct.toObject(),
        newData: validation.data,
      }),
      EmailService.sendProductUpdated({
        name: updated!.name,
        sku: updated!.sku,
        user: session.user.name || "Unknown",
      }),
    ]);

    revalidatePath("/products");
    return { success: "Product updated successfully.", product: updated };
  } catch (error: any) {
    return { error: error.message || "Failed to update product." };
  }
}

export async function deleteProduct(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if ((session.user as any).role === "STAFF") return { error: "Unauthorized. Staff members cannot perform this action." };

  try {
    const product = await productRepo.findById(id);
    if (!product) return { error: "Product not found." };

    await productRepo.delete(id);

    await Promise.all([
      AuditService.log({
        userId: (session.user as any).id,
        action: "DELETE_PRODUCT",
        module: "PRODUCTS",
        entityId: id,
        oldData: product.toObject(),
      }),
      EmailService.sendProductDeleted(product.name, product.sku, session.user.name || "Unknown"),
    ]);

    revalidatePath("/products");
    return { success: "Product deleted successfully." };
  } catch (error: any) {
    return { error: error.message || "Failed to delete product." };
  }
}
