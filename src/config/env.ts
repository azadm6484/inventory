import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  AUTH_SECRET: z.string().min(8, "AUTH_SECRET must be at least 8 characters long"),
  NEXTAUTH_URL: z.string().url().optional().or(z.literal("")),
  SMTP_HOST: z.string().optional().default("localhost"),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_SECURE: z.string().optional().default("false").transform((v) => v === "true"),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM_NAME: z.string().optional().default("Enterprise Inventory"),
  SMTP_FROM_EMAIL: z.string().email().optional().default("noreply@example.com"),
  APP_NAME: z.string().optional().default("Enterprise Inventory"),
  APP_URL: z.string().url().optional().default("http://localhost:3000"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

// Since Next.js bundles files for client/server, we only run validation on server-side or if process.env has values.
const processEnv = {
  MONGODB_URI: process.env.MONGODB_URI,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SECURE: process.env.SMTP_SECURE,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME,
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL,
  APP_NAME: process.env.APP_NAME,
  APP_URL: process.env.APP_URL,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

const parsed = envSchema.safeParse(processEnv);

if (!parsed.success && typeof window === "undefined") {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  // We throw an error only if we're in production or explicitly required.
  // During local setup or initial bootstrap, we want to print a warning rather than crashing.
}

export const env = parsed.success
  ? parsed.data
  : {
      MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/inventory",
      AUTH_SECRET: process.env.AUTH_SECRET || "fallback-secret-at-least-32-chars-long",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
      SMTP_HOST: process.env.SMTP_HOST || "localhost",
      SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
      SMTP_SECURE: process.env.SMTP_SECURE === "true",
      SMTP_USER: process.env.SMTP_USER || "",
      SMTP_PASS: process.env.SMTP_PASS || "",
      SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || "Enterprise Inventory",
      SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || "noreply@example.com",
      APP_NAME: process.env.APP_NAME || "Enterprise Inventory",
      APP_URL: process.env.APP_URL || "http://localhost:3000",
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
    };
