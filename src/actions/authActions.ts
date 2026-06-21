"use server";

import { registerSchema, forgotPasswordSchema, resetPasswordSchema } from "@/validations/auth";
import { User } from "@/models/User";
import { EmailVerificationToken } from "@/models/EmailVerificationToken";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { dbConnect } from "@/lib/db/mongodb";
import { EmailService } from "@/services/EmailService";
import { AuditService } from "@/services/AuditService";
import { NotificationService } from "@/services/NotificationService";
import { signIn, signOut } from "@/lib/auth/auth";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { env } from "@/config/env";

export async function registerUser(prevState: any, formData: FormData) {
  await dbConnect();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const validation = registerSchema.safeParse({ name, email, password, confirmPassword });

  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() }).exec();
    if (existingUser) {
      return { error: "An account with this email already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "STAFF",
      status: "PENDING", // Initial status pending email verification or admin approval
    });

    await user.save();

    // Generate Verification Token
    const tokenStr = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const verificationToken = new EmailVerificationToken({
      email: user.email,
      token: tokenStr,
      expires,
    });
    await verificationToken.save();

    // Trigger Notification & Email
    const verifyUrl = `${env.APP_URL}/verify-email?token=${tokenStr}`;

    // Log Audit
    await AuditService.log({
      action: "REGISTER",
      module: "AUTH",
      entityId: user._id.toString(),
      newData: { name: user.name, email: user.email },
    });

    // Send Verification Email
    await EmailService.sendVerification(user.email, user.name, verifyUrl);

    // Notify Admins
    await NotificationService.notifyAdmins({
      title: "New User Registration",
      message: `${user.name} has registered and is pending activation.`,
      type: "INFO",
    });

    return { success: "Registration successful! Please check your email to verify your account." };
  } catch (error: any) {
    console.error("Registration Error:", error);
    return { error: "An unexpected error occurred during registration." };
  }
}

export async function verifyEmailToken(token: string) {
  await dbConnect();

  try {
    const verificationRecord = await EmailVerificationToken.findOne({ token }).exec();
    if (!verificationRecord) {
      return { error: "Invalid or expired verification token." };
    }

    if (verificationRecord.expires < new Date()) {
      await EmailVerificationToken.deleteOne({ _id: verificationRecord._id }).exec();
      return { error: "Verification token has expired." };
    }

    const user = await User.findOne({ email: verificationRecord.email }).exec();
    if (!user) {
      return { error: "User associated with this token not found." };
    }

    user.status = "ACTIVE"; // Mark account active upon email verification
    await user.save();

    await EmailVerificationToken.deleteOne({ _id: verificationRecord._id }).exec();

    // Log Audit & Notify
    await AuditService.log({
      userId: user._id as any,
      action: "VERIFY_EMAIL",
      module: "AUTH",
      entityId: user._id.toString(),
    });

    await NotificationService.notifyUser({
      userId: user._id.toString(),
      title: "Email Verified",
      message: "Your email has been verified successfully. Your account is now active.",
      type: "SUCCESS",
    });

    // Send Welcome Email
    const loginUrl = `${env.APP_URL}/login`;
    await EmailService.sendWelcome(user.email, user.name, loginUrl);

    return { success: "Email verified successfully! You can now log in." };
  } catch (error) {
    console.error("Email Verification Error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function requestPasswordReset(prevState: any, formData: FormData) {
  await dbConnect();

  const email = formData.get("email") as string;
  const validation = forgotPasswordSchema.safeParse({ email });

  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() }).exec();
    if (!user) {
      // Return success representation to prevent email enumeration attacks
      return { success: "If an account with that email exists, we have sent a password reset link." };
    }

    // Clean up existing tokens
    await PasswordResetToken.deleteMany({ email: user.email }).exec();

    const tokenStr = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const resetToken = new PasswordResetToken({
      email: user.email,
      token: tokenStr,
      expires,
    });
    await resetToken.save();

    const resetUrl = `${env.APP_URL}/reset-password?token=${tokenStr}`;

    // Send email
    await EmailService.sendForgotPassword(user.email, user.name, resetUrl);

    // Audit log
    await AuditService.log({
      userId: user._id as any,
      action: "PASSWORD_RESET_REQUESTED",
      module: "AUTH",
      entityId: user._id.toString(),
    });

    return { success: "We have sent a password reset link to your email." };
  } catch (error) {
    console.error("Password reset request error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function resetPasswordWithToken(token: string, formData: FormData) {
  await dbConnect();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const validation = resetPasswordSchema.safeParse({ password, confirmPassword });

  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  try {
    const resetRecord = await PasswordResetToken.findOne({ token }).exec();
    if (!resetRecord) {
      return { error: "Invalid or expired reset token." };
    }

    if (resetRecord.expires < new Date()) {
      await PasswordResetToken.deleteOne({ _id: resetRecord._id }).exec();
      return { error: "Reset token has expired." };
    }

    const user = await User.findOne({ email: resetRecord.email }).exec();
    if (!user) {
      return { error: "User associated with this token not found." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    await PasswordResetToken.deleteOne({ _id: resetRecord._id }).exec();

    // Audit & Email alerts
    await AuditService.log({
      userId: user._id as any,
      action: "PASSWORD_RESET_COMPLETED",
      module: "AUTH",
      entityId: user._id.toString(),
    });

    const loginUrl = `${env.APP_URL}/login`;
    await EmailService.sendPasswordChanged(user.email, user.name, loginUrl);

    await NotificationService.notifyUser({
      userId: user._id.toString(),
      title: "Password Changed",
      message: "Your account password was reset successfully.",
      type: "SUCCESS",
    });

    return { success: "Password reset successful! You can now log in." };
  } catch (error) {
    console.error("Password reset execution error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function logoutUser() {
  await signOut({ redirectTo: "/login" });
}

export async function loginUser(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const callbackUrl = (formData.get("callbackUrl") as string) || "/dashboard";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
    return { success: "Logged in successfully." };
  } catch (error: any) {
    // Check if it is a Next.js redirect error (this is standard NextAuth redirection behavior)
    if (
      error.message === "NEXT_REDIRECT" ||
      error.name === "RedirectError" ||
      error.digest?.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("Login Server Action Error:", error);
    // Parse NextAuth error details if available
    const errorMessage = error.cause?.err?.message || "Invalid email or password.";
    return { error: errorMessage };
  }
}

