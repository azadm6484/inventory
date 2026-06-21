import nodemailer from "nodemailer";
import { SettingsRepository } from "@/repositories/SettingsRepository";
import { env } from "@/config/env";

export async function getTransporter() {
  const settingsRepo = new SettingsRepository();
  let settings;
  try {
    settings = await settingsRepo.getSettings();
  } catch (error) {
    console.error("Failed to load settings from DB for SMTP configuration, using env:", error);
  }

  const host = settings?.smtpHost || env.SMTP_HOST;
  const port = settings?.smtpPort || env.SMTP_PORT;
  const secure = settings?.smtpSecure !== undefined ? settings.smtpSecure : env.SMTP_SECURE;
  const user = settings?.smtpUser || env.SMTP_USER;
  const pass = settings?.smtpPass || env.SMTP_PASS;

  // Fallback to jsonTransport (mock) if credentials are not configured
  if (!host || host === "localhost" || !user || !pass) {
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}
