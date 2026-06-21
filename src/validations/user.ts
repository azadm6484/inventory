import { z } from "zod";

export const userUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["ADMIN", "MANAGER", "STAFF"]),
  status: z.enum(["PENDING", "ACTIVE", "INACTIVE"]),
});

export const userCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["ADMIN", "MANAGER", "STAFF"]).default("STAFF"),
  status: z.enum(["PENDING", "ACTIVE", "INACTIVE"]).default("ACTIVE"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
