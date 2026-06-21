"use server";

import { auth } from "@/lib/auth/auth";
import { CategoryRepository } from "@/repositories/CategoryRepository";
import { AuditService } from "@/services/AuditService";
import { categorySchema } from "@/validations/category";
import { revalidatePath } from "next/cache";

const categoryRepo = new CategoryRepository();

export async function createCategory(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if ((session.user as any).role === "STAFF") return { error: "Unauthorized. Staff members cannot perform this action." };

  const data = Object.fromEntries(formData.entries());
  const validation = categorySchema.safeParse(data);
  if (!validation.success) return { error: validation.error.issues[0].message };

  try {
    const existing = await categoryRepo.findByName(validation.data.name);
    if (existing) return { error: "A category with this name already exists." };

    const category = await categoryRepo.create(validation.data);
    await AuditService.log({
      userId: (session.user as any).id,
      action: "CREATE_CATEGORY",
      module: "CATEGORIES",
      entityId: category._id.toString(),
      newData: validation.data,
    });
    revalidatePath("/categories");
    return { success: "Category created successfully.", category };
  } catch (error: any) {
    return { error: error.message || "Failed to create category." };
  }
}

export async function updateCategory(id: string, prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if ((session.user as any).role === "STAFF") return { error: "Unauthorized. Staff members cannot perform this action." };

  const data = Object.fromEntries(formData.entries());
  const validation = categorySchema.safeParse(data);
  if (!validation.success) return { error: validation.error.issues[0].message };

  try {
    const old = await categoryRepo.findById(id);
    if (!old) return { error: "Category not found." };

    const updated = await categoryRepo.update(id, validation.data);
    await AuditService.log({
      userId: (session.user as any).id,
      action: "UPDATE_CATEGORY",
      module: "CATEGORIES",
      entityId: id,
      oldData: old.toObject(),
      newData: validation.data,
    });
    revalidatePath("/categories");
    return { success: "Category updated successfully.", category: updated };
  } catch (error: any) {
    return { error: error.message || "Failed to update category." };
  }
}

export async function deleteCategory(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if ((session.user as any).role === "STAFF") return { error: "Unauthorized. Staff members cannot perform this action." };

  try {
    const cat = await categoryRepo.findById(id);
    if (!cat) return { error: "Category not found." };

    await categoryRepo.delete(id);
    await AuditService.log({
      userId: (session.user as any).id,
      action: "DELETE_CATEGORY",
      module: "CATEGORIES",
      entityId: id,
      oldData: cat.toObject(),
    });
    revalidatePath("/categories");
    return { success: "Category deleted successfully." };
  } catch (error: any) {
    return { error: error.message || "Failed to delete category." };
  }
}
