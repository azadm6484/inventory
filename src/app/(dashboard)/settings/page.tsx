import React from "react";
import { SettingsRepository } from "@/repositories/SettingsRepository";
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  Clock,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { SubmitButton } from "@/components/SubmitButton";

export const revalidate = 0;

async function handleUpdateSettings(formData: FormData) {
  "use server";
  const { SettingsRepository } = await import(
    "@/repositories/SettingsRepository"
  );
  const { redirect } = await import("next/navigation");
  const { headers } = await import("next/headers");
  const { AuditService } = await import("@/services/AuditService");
  const { auth } = await import("@/lib/auth/auth");

  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/settings?error=" + encodeURIComponent("Unauthorized"));
  }

  const tab = (formData.get("tab") as string) || "general";
  const data: Record<string, any> = {};

  if (tab === "general") {
    data.companyName = formData.get("companyName") as string;
    data.address = formData.get("address") as string;
    data.gstNumber = formData.get("gstNumber") as string;
    data.contactPhone = formData.get("contactPhone") as string;
    data.contactEmail = formData.get("contactEmail") as string;
  } else if (tab === "security") {
    const passwordMinLength = Number(formData.get("passwordMinLength"));
    const sessionTimeoutMinutes = Number(
      formData.get("sessionTimeoutMinutes")
    );
    const maxLoginAttempts = Number(formData.get("maxLoginAttempts"));
    const lockoutDurationMinutes = Number(
      formData.get("lockoutDurationMinutes")
    );

    // Validation
    if (passwordMinLength < 6 || passwordMinLength > 64) {
      redirect(
        `/settings?tab=security&error=${encodeURIComponent(
          "Password minimum length must be between 6 and 64."
        )}`
      );
    }
    if (sessionTimeoutMinutes < 5 || sessionTimeoutMinutes > 1440) {
      redirect(
        `/settings?tab=security&error=${encodeURIComponent(
          "Session timeout must be between 5 and 1440 minutes."
        )}`
      );
    }
    if (maxLoginAttempts < 1 || maxLoginAttempts > 20) {
      redirect(
        `/settings?tab=security&error=${encodeURIComponent(
          "Max login attempts must be between 1 and 20."
        )}`
      );
    }
    if (lockoutDurationMinutes < 1 || lockoutDurationMinutes > 1440) {
      redirect(
        `/settings?tab=security&error=${encodeURIComponent(
          "Lockout duration must be between 1 and 1440 minutes."
        )}`
      );
    }

    data.passwordMinLength = passwordMinLength;
    data.requireUppercase = formData.get("requireUppercase") === "true";
    data.requireNumbers = formData.get("requireNumbers") === "true";
    data.requireSpecialChars = formData.get("requireSpecialChars") === "true";
    data.sessionTimeoutMinutes = sessionTimeoutMinutes;
    data.maxLoginAttempts = maxLoginAttempts;
    data.lockoutDurationMinutes = lockoutDurationMinutes;
  }

  try {
    const settingsRepo = new SettingsRepository();
    await settingsRepo.updateSettings(data);

    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for") || "unknown";
    await AuditService.log({
      userId: (session!.user as any).id,
      action: "UPDATE_SETTINGS",
      module: "SETTINGS",
      newData: { section: tab },
      ipAddress: ip,
    });

    redirect(
      `/settings?tab=${tab}&success=${encodeURIComponent(
        "Settings updated successfully."
      )}`
    );
  } catch (error: any) {
    redirect(
      `/settings?tab=${tab}&error=${encodeURIComponent(
        error.message || "Failed to update settings."
      )}`
    );
  }
}

export default async function SettingsPage(props: {
  searchParams: Promise<{
    tab?: string;
    error?: string;
    success?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || "general";
  const errorMsg = searchParams.error || "";
  const successMsg = searchParams.success || "";

  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard?error=unauthorized");
  }

  const settingsRepo = new SettingsRepository();
  const settingsDoc = await settingsRepo.getSettings();
  const settings = JSON.parse(JSON.stringify(settingsDoc));

  const inputCls =
    "w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none transition";
  const labelCls = "text-xs font-bold text-slate-500 uppercase tracking-wide";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Configure company details and enforce system-wide security policies.
        </p>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2.5 text-sm">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2.5 text-sm">
          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Tabs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-2 flex flex-row md:flex-col gap-1 overflow-x-auto">
          <Link
            href="/settings?tab=general"
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === "general"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Company Details
          </Link>
          <Link
            href="/settings?tab=security"
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === "security"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Security Policies
          </Link>
        </div>

        {/* Content Pane */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:col-span-3 space-y-6">
          {/* ── GENERAL TAB ── */}
          {activeTab === "general" && (
            <form action={handleUpdateSettings} className="space-y-5">
              <input type="hidden" name="tab" value="general" />
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Company Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>Company Name *</label>
                  <input
                    type="text"
                    name="companyName"
                    defaultValue={settings.companyName}
                    required
                    className={inputCls}
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>GST Number</label>
                  <input
                    type="text"
                    name="gstNumber"
                    defaultValue={settings.gstNumber || ""}
                    placeholder="22AAAAA0000A1Z5"
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>Contact Phone</label>
                  <input
                    type="text"
                    name="contactPhone"
                    defaultValue={settings.contactPhone || ""}
                    placeholder="+91 99999 99999"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Contact Email</label>
                  <input
                    type="email"
                    name="contactEmail"
                    defaultValue={settings.contactEmail || ""}
                    placeholder="info@company.com"
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Address</label>
                <textarea
                  name="address"
                  rows={3}
                  defaultValue={settings.address || ""}
                  placeholder="Enter company headquarters address..."
                  className={inputCls}
                />
              </div>
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <SubmitButton
                  loadingText="Saving..."
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-5 py-2.5 text-xs shadow-md shadow-blue-500/10 transition"
                >
                  Save Company Details
                </SubmitButton>
              </div>
            </form>
          )}

          {/* ── SECURITY TAB ── */}
          {activeTab === "security" && (
            <form action={handleUpdateSettings} className="space-y-6">
              <input type="hidden" name="tab" value="security" />

              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Security Policies
              </h2>

              {/* Info Banner */}
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-700">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>
                  Changes to session timeout and login attempt limits take
                  effect on the next login. Password complexity rules apply when
                  users next change their password.
                </span>
              </div>

              {/* Session & Lockout */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  Session &amp; Account Lockout
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelCls}>Session Timeout (min)</label>
                    <input
                      type="number"
                      name="sessionTimeoutMinutes"
                      defaultValue={settings.sessionTimeoutMinutes ?? 30}
                      required
                      min={5}
                      max={1440}
                      className={inputCls}
                    />
                    <p className="text-xs text-slate-400">5 – 1440 min</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Max Login Attempts</label>
                    <input
                      type="number"
                      name="maxLoginAttempts"
                      defaultValue={settings.maxLoginAttempts ?? 5}
                      required
                      min={1}
                      max={20}
                      className={inputCls}
                    />
                    <p className="text-xs text-slate-400">1 – 20 attempts</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Lockout Duration (min)</label>
                    <input
                      type="number"
                      name="lockoutDurationMinutes"
                      defaultValue={settings.lockoutDurationMinutes ?? 15}
                      required
                      min={1}
                      max={1440}
                      className={inputCls}
                    />
                    <p className="text-xs text-slate-400">1 – 1440 min</p>
                  </div>
                </div>
              </div>

              {/* Password Complexity */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5" />
                  Password Complexity
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <div className="space-y-1.5">
                    <label className={labelCls}>Minimum Password Length</label>
                    <input
                      type="number"
                      name="passwordMinLength"
                      defaultValue={settings.passwordMinLength ?? 8}
                      required
                      min={6}
                      max={64}
                      className={inputCls}
                    />
                    <p className="text-xs text-slate-400">6 – 64 characters</p>
                  </div>
                  <div className="flex flex-col gap-3 pt-1">
                    <label className={labelCls + " mb-0.5"}>
                      Required Character Types
                    </label>
                    {[
                      {
                        id: "requireUppercase",
                        label: "Uppercase letters (A–Z)",
                        checked: settings.requireUppercase,
                      },
                      {
                        id: "requireNumbers",
                        label: "Numbers (0–9)",
                        checked: settings.requireNumbers,
                      },
                      {
                        id: "requireSpecialChars",
                        label: "Special characters (!@#$…)",
                        checked: settings.requireSpecialChars,
                      },
                    ].map(({ id, label, checked }) => (
                      <label
                        key={id}
                        htmlFor={id}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          id={id}
                          name={id}
                          value="true"
                          defaultChecked={checked}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-sm text-slate-700 group-hover:text-slate-900 transition">
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <SubmitButton
                  loadingText="Saving Policies..."
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-5 py-2.5 text-xs shadow-md shadow-blue-500/10 transition"
                >
                  Save Security Policies
                </SubmitButton>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
