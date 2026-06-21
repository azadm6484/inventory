"use server";

import { auth } from "@/lib/auth/auth";
import { SupplierRepository } from "@/repositories/SupplierRepository";
import { AuditService } from "@/services/AuditService";
import { EmailService } from "@/services/EmailService";
import { supplierSchema } from "@/validations/supplier";
import { revalidatePath } from "next/cache";

const supplierRepo = new SupplierRepository();

export async function createSupplier(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if ((session.user as any).role === "STAFF") return { error: "Unauthorized. Staff members cannot perform this action." };

  const data = Object.fromEntries(formData.entries());
  const validation = supplierSchema.safeParse(data);
  if (!validation.success) return { error: validation.error.issues[0].message };

  try {
    const supplier = await supplierRepo.create(validation.data);
    await Promise.all([
      AuditService.log({
        userId: (session.user as any).id,
        action: "CREATE_SUPPLIER",
        module: "SUPPLIERS",
        entityId: supplier._id.toString(),
        newData: validation.data,
      }),
      EmailService.sendSupplierCreated(
        supplier.companyName,
        supplier.contactPerson,
        session.user.name || "Unknown"
      ),
    ]);
    revalidatePath("/suppliers");
    return { success: "Supplier created successfully.", supplier };
  } catch (error: any) {
    return { error: error.message || "Failed to create supplier." };
  }
}

export async function updateSupplier(id: string, prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if ((session.user as any).role === "STAFF") return { error: "Unauthorized. Staff members cannot perform this action." };

  const data = Object.fromEntries(formData.entries());
  const validation = supplierSchema.safeParse(data);
  if (!validation.success) return { error: validation.error.issues[0].message };

  try {
    const old = await supplierRepo.findById(id);
    if (!old) return { error: "Supplier not found." };

    const updated = await supplierRepo.update(id, validation.data);
    await Promise.all([
      AuditService.log({
        userId: (session.user as any).id,
        action: "UPDATE_SUPPLIER",
        module: "SUPPLIERS",
        entityId: id,
        oldData: old.toObject(),
        newData: validation.data,
      }),
      EmailService.sendSupplierUpdated(updated!.companyName, session.user.name || "Unknown"),
    ]);
    revalidatePath("/suppliers");
    return { success: "Supplier updated successfully.", supplier: updated };
  } catch (error: any) {
    return { error: error.message || "Failed to update supplier." };
  }
}

export async function deleteSupplier(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if ((session.user as any).role === "STAFF") return { error: "Unauthorized. Staff members cannot perform this action." };

  try {
    const supplier = await supplierRepo.findById(id);
    if (!supplier) return { error: "Supplier not found." };

    await supplierRepo.delete(id);
    await Promise.all([
      AuditService.log({
        userId: (session.user as any).id,
        action: "DELETE_SUPPLIER",
        module: "SUPPLIERS",
        entityId: id,
        oldData: supplier.toObject(),
      }),
      EmailService.sendSupplierDeleted(supplier.companyName, session.user.name || "Unknown"),
    ]);
    revalidatePath("/suppliers");
    return { success: "Supplier deleted successfully." };
  } catch (error: any) {
    return { error: error.message || "Failed to delete supplier." };
  }
}
