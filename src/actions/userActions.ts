"use server";

import { auth } from "@/lib/auth/auth";
import { UserRepository } from "@/repositories/UserRepository";
import { AuditService } from "@/services/AuditService";
import { EmailService } from "@/services/EmailService";
import { NotificationService } from "@/services/NotificationService";
import { userCreateSchema, userUpdateSchema } from "@/validations/user";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { env } from "@/config/env";

const userRepo = new UserRepository();

export async function createUser(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") return { error: "Unauthorized" };

  const data = Object.fromEntries(formData.entries());
  const validation = userCreateSchema.safeParse(data);
  if (!validation.success) return { error: validation.error.issues[0].message };

  try {
    const existing = await userRepo.findByEmail(validation.data.email);
    if (existing) return { error: "A user with this email already exists." };

    const hashedPassword = await bcrypt.hash(validation.data.password, 10);
    const user = await userRepo.create({ ...validation.data, password: hashedPassword });

    await Promise.all([
      AuditService.log({
        userId: (session.user as any).id,
        action: "CREATE_USER",
        module: "USERS",
        entityId: user._id.toString(),
        newData: { name: user.name, email: user.email, role: user.role },
      }),
      EmailService.sendWelcome(user.email, user.name, `${env.APP_URL}/login`),
    ]);

    revalidatePath("/users");
    return { success: "User created successfully." };
  } catch (error: any) {
    return { error: error.message || "Failed to create user." };
  }
}

export async function updateUser(id: string, prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") return { error: "Unauthorized" };

  const data = Object.fromEntries(formData.entries());
  const validation = userUpdateSchema.safeParse(data);
  if (!validation.success) return { error: validation.error.issues[0].message };

  try {
    const oldUser = await userRepo.findById(id);
    if (!oldUser) return { error: "User not found." };

    const updated = await userRepo.update(id, validation.data);

    const alertPromises: Promise<any>[] = [
      AuditService.log({
        userId: (session.user as any).id,
        action: "UPDATE_USER",
        module: "USERS",
        entityId: id,
        oldData: { name: oldUser.name, role: oldUser.role, status: oldUser.status },
        newData: validation.data,
      }),
    ];

    // Role change notification
    if (oldUser.role !== validation.data.role) {
      alertPromises.push(
        EmailService.sendRoleChanged(
          updated!.email,
          updated!.name,
          oldUser.role,
          validation.data.role,
          session.user.name || "Admin"
        ),
        NotificationService.notifyUser({
          userId: id,
          title: "Role Updated",
          message: `Your system role has been changed from ${oldUser.role} to ${validation.data.role}.`,
          type: "INFO",
        })
      );
    }

    // Status change notifications
    if (oldUser.status !== validation.data.status) {
      if (validation.data.status === "ACTIVE") {
        alertPromises.push(
          EmailService.sendAccountActivated(updated!.email, updated!.name, `${env.APP_URL}/login`)
        );
      } else if (validation.data.status === "INACTIVE") {
        alertPromises.push(EmailService.sendAccountDeactivated(updated!.email, updated!.name));
      }
    }

    await Promise.all(alertPromises);
    revalidatePath("/users");
    return { success: "User updated successfully." };
  } catch (error: any) {
    return { error: error.message || "Failed to update user." };
  }
}

export async function deleteUser(id: string) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") return { error: "Unauthorized" };

  // Prevent self-deletion
  if ((session.user as any).id === id) return { error: "You cannot delete your own account." };

  try {
    const user = await userRepo.findById(id);
    if (!user) return { error: "User not found." };

    await userRepo.delete(id);
    await AuditService.log({
      userId: (session.user as any).id,
      action: "DELETE_USER",
      module: "USERS",
      entityId: id,
      oldData: { name: user.name, email: user.email },
    });

    revalidatePath("/users");
    return { success: "User deleted successfully." };
  } catch (error: any) {
    return { error: error.message || "Failed to delete user." };
  }
}
