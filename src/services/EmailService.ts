import { sendEmail } from "@/lib/email/sendEmail";
import { emailTemplates } from "@/lib/email/templates";
import { User } from "@/models/User";
import { dbConnect } from "@/lib/db/mongodb";

export class EmailService {
  private static async getAdminEmails(): Promise<string[]> {
    try {
      await dbConnect();
      const admins = await User.find({ role: "ADMIN", status: "ACTIVE" }).select("email").exec();
      return admins.map((admin) => admin.email);
    } catch (e) {
      console.error("Failed to query admin emails for alert forwarding:", e);
      return [];
    }
  }

  static async sendWelcome(to: string, name: string, loginUrl: string) {
    const { html, text, subject } = emailTemplates.welcome(name, loginUrl);
    return sendEmail({ to, subject, html, text, template: "welcome" });
  }

  static async sendVerification(to: string, name: string, verifyUrl: string) {
    const { html, text, subject } = emailTemplates.verifyEmail(name, verifyUrl);
    return sendEmail({ to, subject, html, text, template: "verify-email" });
  }

  static async sendForgotPassword(to: string, name: string, resetUrl: string) {
    const { html, text, subject } = emailTemplates.forgotPassword(name, resetUrl);
    return sendEmail({ to, subject, html, text, template: "forgot-password" });
  }

  static async sendPasswordChanged(to: string, name: string, loginUrl: string) {
    const { html, text, subject } = emailTemplates.passwordChanged(name, loginUrl);
    return sendEmail({ to, subject, html, text, template: "password-changed" });
  }

  static async sendLoginAlert(to: string, name: string, details: { ip: string; device: string; time: string }) {
    const { html, text, subject } = emailTemplates.loginAlert(name, details);
    return sendEmail({ to, subject, html, text, template: "login-alert" });
  }

  static async sendAccountActivated(to: string, name: string, loginUrl: string) {
    const { html, text, subject } = emailTemplates.accountActivated(name, loginUrl);
    return sendEmail({ to, subject, html, text, template: "account-activated" });
  }

  static async sendAccountDeactivated(to: string, name: string) {
    const { html, text, subject } = emailTemplates.accountDeactivated(name);
    return sendEmail({ to, subject, html, text, template: "account-deactivated" });
  }

  static async sendLowStock(productName: string, sku: string, currentQty: number, minStock: number) {
    const admins = await this.getAdminEmails();
    if (admins.length === 0) return;
    const { html, text, subject } = emailTemplates.lowStock(productName, sku, currentQty, minStock);
    return sendEmail({ to: admins, subject, html, text, template: "low-stock" });
  }

  static async sendOutOfStock(productName: string, sku: string) {
    const admins = await this.getAdminEmails();
    if (admins.length === 0) return;
    const { html, text, subject } = emailTemplates.outOfStock(productName, sku);
    return sendEmail({ to: admins, subject, html, text, template: "out-of-stock" });
  }

  static async sendInventoryAdjustment(details: {
    productName: string;
    sku: string;
    prevStock: number;
    newStock: number;
    user: string;
    reason: string;
  }) {
    const admins = await this.getAdminEmails();
    if (admins.length === 0) return;
    const { html, text, subject } = emailTemplates.inventoryAdjustment(details);
    return sendEmail({ to: admins, subject, html, text, template: "inventory-adjustment" });
  }

  static async sendInventoryImport(details: { fileName: string; totalImported: number; user: string }) {
    const admins = await this.getAdminEmails();
    if (admins.length === 0) return;
    const { html, text, subject } = emailTemplates.inventoryImport(details);
    return sendEmail({ to: admins, subject, html, text, template: "inventory-import" });
  }

  static async sendProductCreated(prod: { name: string; sku: string; qty: number; user: string }) {
    const admins = await this.getAdminEmails();
    if (admins.length === 0) return;
    const { html, text, subject } = emailTemplates.productCreated(prod);
    return sendEmail({ to: admins, subject, html, text, template: "product-created" });
  }

  static async sendProductUpdated(prod: { name: string; sku: string; user: string }) {
    const admins = await this.getAdminEmails();
    if (admins.length === 0) return;
    const { html, text, subject } = emailTemplates.productUpdated(prod);
    return sendEmail({ to: admins, subject, html, text, template: "product-updated" });
  }

  static async sendProductDeleted(name: string, sku: string, user: string) {
    const admins = await this.getAdminEmails();
    if (admins.length === 0) return;
    const { html, text, subject } = emailTemplates.productDeleted(name, sku, user);
    return sendEmail({ to: admins, subject, html, text, template: "product-deleted" });
  }

  static async sendSupplierCreated(companyName: string, contact: string, user: string) {
    const admins = await this.getAdminEmails();
    if (admins.length === 0) return;
    const { html, text, subject } = emailTemplates.supplierCreated(companyName, contact, user);
    return sendEmail({ to: admins, subject, html, text, template: "supplier-created" });
  }

  static async sendSupplierUpdated(companyName: string, user: string) {
    const admins = await this.getAdminEmails();
    if (admins.length === 0) return;
    const { html, text, subject } = emailTemplates.supplierUpdated(companyName, user);
    return sendEmail({ to: admins, subject, html, text, template: "supplier-updated" });
  }

  static async sendSupplierDeleted(companyName: string, user: string) {
    const admins = await this.getAdminEmails();
    if (admins.length === 0) return;
    const { html, text, subject } = emailTemplates.supplierDeleted(companyName, user);
    return sendEmail({ to: admins, subject, html, text, template: "supplier-deleted" });
  }

  static async sendRoleChanged(to: string, name: string, oldRole: string, newRole: string, adminUser: string) {
    const { html, text, subject } = emailTemplates.roleChanged(name, oldRole, newRole, adminUser);
    return sendEmail({ to, subject, html, text, template: "role-changed" });
  }

  static async sendSecurityAlert(action: string, ip: string, user: string) {
    const admins = await this.getAdminEmails();
    if (admins.length === 0) return;
    const { html, text, subject } = emailTemplates.securityAlert(action, ip, user);
    return sendEmail({ to: admins, subject, html, text, template: "security-alert" });
  }

  static async sendScheduledReport(
    type: "Daily" | "Weekly" | "Monthly",
    metrics: { totalProducts: number; valuation: number; lowStockCount: number }
  ) {
    const admins = await this.getAdminEmails();
    if (admins.length === 0) return;
    const { html, text, subject } = emailTemplates.scheduledReport(type, metrics);
    return sendEmail({ to: admins, subject, html, text, template: "scheduled-report" });
  }
}
