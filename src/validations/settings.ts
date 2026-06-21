import { z } from "zod";

export const companySettingsSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  logo: z.string().optional(),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Please enter a valid contact email").optional().or(z.literal("")),
});

export const smtpSettingsSchema = z.object({
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: z.coerce.number().int().min(1, "Port must be positive"),
  smtpSecure: z.coerce.boolean(),
  smtpUser: z.string().min(1, "SMTP username is required"),
  smtpPass: z.string().optional(),
  smtpFromEmail: z.string().email("Please enter a valid sender email"),
  smtpFromName: z.string().min(1, "SMTP sender name is required"),
});

export const securitySettingsSchema = z.object({
  passwordMinLength: z.coerce.number().int().min(6, "Password must be at least 6 characters"),
  requireUppercase: z.coerce.boolean(),
  requireNumbers: z.coerce.boolean(),
  requireSpecialChars: z.coerce.boolean(),
  sessionTimeoutMinutes: z.coerce.number().int().min(5, "Session timeout must be at least 5 minutes"),
  maxLoginAttempts: z.coerce.number().int().min(3, "Max login attempts must be at least 3"),
  lockoutDurationMinutes: z.coerce.number().int().min(1, "Lockout duration must be at least 1 minute"),
});

export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
export type SmtpSettingsInput = z.infer<typeof smtpSettingsSchema>;
export type SecuritySettingsInput = z.infer<typeof securitySettingsSchema>;
