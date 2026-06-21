import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { SettingsRepository } from "@/repositories/SettingsRepository";
import { AuditService } from "@/services/AuditService";
import { EmailService } from "@/services/EmailService";

const settingsRepo = new SettingsRepository();

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await settingsRepo.getSettings();
    // Mask SMTP password
    const safeSettings = settings.toObject();
    if (safeSettings.smtpPass) safeSettings.smtpPass = "••••••••";
    return NextResponse.json({ data: safeSettings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updated = await settingsRepo.updateSettings(body);

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    await Promise.all([
      AuditService.log({
        userId: (session.user as any).id,
        action: "UPDATE_SETTINGS",
        module: "SETTINGS",
        newData: { section: body.section || "general" },
        ipAddress: ip,
      }),
      EmailService.sendSecurityAlert("Settings Updated", ip, session.user.name || "Admin"),
    ]);

    return NextResponse.json({ data: updated, message: "Settings updated successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
