import { EmailLog } from "@/models/EmailLog";
import { getTransporter } from "./transporter";
import { SettingsRepository } from "@/repositories/SettingsRepository";
import { env } from "@/config/env";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  template: string;
  attachments?: any[];
  cc?: string | string[];
  bcc?: string | string[];
}

export async function sendEmail(options: SendEmailOptions) {
  const recipient = Array.isArray(options.to) ? options.to.join(", ") : options.to;

  // 1. Create Email Log in DB
  const emailLog = new EmailLog({
    recipient,
    subject: options.subject,
    template: options.template,
    status: "PENDING",
  });

  try {
    await emailLog.save();
  } catch (err) {
    console.error("Failed to write initial EmailLog:", err);
  }

  try {
    const transporter = await getTransporter();

    // Get sender settings
    const settingsRepo = new SettingsRepository();
    let settings;
    try {
      settings = await settingsRepo.getSettings();
    } catch (e) {
      console.error("Failed to load settings in sendEmail, using defaults:", e);
    }
    const fromEmail = settings?.smtpFromEmail || env.SMTP_FROM_EMAIL;
    const fromName = settings?.smtpFromName || env.SMTP_FROM_NAME;

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
      cc: options.cc,
      bcc: options.bcc,
    };

    const info = await transporter.sendMail(mailOptions);

    // If mock json transport is active
    if ((transporter as any).options.jsonTransport) {
      console.log("📨 [MOCK EMAIL SENT]:", JSON.stringify(info.message, null, 2));
    }

    // 2. Update status to SENT
    emailLog.status = "SENT";
    emailLog.sentAt = new Date();
    await emailLog.save();

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("❌ Failed to send email:", error);

    // 3. Update status to FAILED
    emailLog.status = "FAILED";
    emailLog.errorMessage = error?.message || String(error);
    try {
      await emailLog.save();
    } catch (dbErr) {
      console.error("Failed to save failed EmailLog state:", dbErr);
    }

    return { success: false, error: error?.message || String(error) };
  }
}
