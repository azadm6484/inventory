interface TemplateResult {
  html: string;
  text: string;
  subject: string;
}

function getBaseLayout(title: string, contentHtml: string, cta?: { label: string; url: string }): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 32px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.025em;
    }
    .content {
      padding: 32px 24px;
      line-height: 1.6;
      font-size: 16px;
    }
    .cta-container {
      text-align: center;
      margin: 24px 0 8px;
    }
    .cta-button {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 15px;
      text-align: center;
      box-shadow: 0 2px 4px rgb(37 99 235 / 0.2);
    }
    .footer {
      background-color: #f1f5f9;
      padding: 20px 24px;
      text-align: center;
      font-size: 13px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      margin: 4px 0;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-warning {
      background-color: #fef3c7;
      color: #d97706;
    }
    .badge-error {
      background-color: #fee2e2;
      color: #dc2626;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    .table th {
      background-color: #f8fafc;
      border-bottom: 2px solid #e2e8f0;
      padding: 8px 12px;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
    }
    .table td {
      border-bottom: 1px solid #e2e8f0;
      padding: 8px 12px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>Enterprise Inventory</h1>
      </div>
      <div class="content">
        ${contentHtml}
        ${cta ? `<div class="cta-container"><a href="${cta.url}" class="cta-button">${cta.label}</a></div>` : ""}
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Enterprise Inventory Management. All rights reserved.</p>
        <p>If you did not expect this message, please contact system administrator.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export const emailTemplates = {
  // Auth Templates
  welcome: (name: string, loginUrl: string): TemplateResult => {
    const subject = "Welcome to Enterprise Inventory!";
    const html = getBaseLayout(
      subject,
      `<p>Hello ${name},</p>
       <p>Welcome to your Enterprise Inventory Management account. You have been successfully registered on the portal.</p>
       <p>You can access the system dashboard using the link below to get started.</p>`,
      { label: "Go to Dashboard", url: loginUrl }
    );
    const text = `Hello ${name},\n\nWelcome to your Enterprise Inventory Management account.\nLog in here: ${loginUrl}`;
    return { html, text, subject };
  },

  verifyEmail: (name: string, verifyUrl: string): TemplateResult => {
    const subject = "Verify Your Email Address";
    const html = getBaseLayout(
      subject,
      `<p>Hello ${name},</p>
       <p>Thank you for signing up. Please verify your email address to activate your account by clicking the button below.</p>
       <p>This verification link will expire in 24 hours.</p>`,
      { label: "Verify Email", url: verifyUrl }
    );
    const text = `Hello ${name},\n\nPlease verify your email by opening the link: ${verifyUrl}`;
    return { html, text, subject };
  },

  forgotPassword: (name: string, resetUrl: string): TemplateResult => {
    const subject = "Reset Your Password";
    const html = getBaseLayout(
      subject,
      `<p>Hello ${name},</p>
       <p>We received a request to reset your password. Click the button below to set a new password.</p>
       <p>This link is valid for 1 hour. If you did not request this, you can ignore this email.</p>`,
      { label: "Reset Password", url: resetUrl }
    );
    const text = `Hello ${name},\n\nReset your password here: ${resetUrl}`;
    return { html, text, subject };
  },

  passwordChanged: (name: string, loginUrl: string): TemplateResult => {
    const subject = "Your Password Has Been Updated";
    const html = getBaseLayout(
      subject,
      `<p>Hello ${name},</p>
       <p>This is confirmation that the password for your Enterprise Inventory account has been changed successfully.</p>
       <p>If you did not perform this change, please reset your password immediately or lock your account.</p>`,
      { label: "Login to Account", url: loginUrl }
    );
    const text = `Hello ${name},\n\nYour password has been changed successfully.\nLogin here: ${loginUrl}`;
    return { html, text, subject };
  },

  loginAlert: (name: string, details: { ip: string; device: string; time: string }): TemplateResult => {
    const subject = "Security Alert: New Account Login Detected";
    const html = getBaseLayout(
      subject,
      `<p>Hello ${name},</p>
       <p>We detected a login to your account from a new browser or device.</p>
       <table class="table">
         <tr><th>Device/Browser</th><td>${details.device}</td></tr>
         <tr><th>IP Address</th><td>${details.ip}</td></tr>
         <tr><th>Timestamp</th><td>${details.time}</td></tr>
       </table>
       <p>If this was you, you can safely ignore this alert. Otherwise, please change your password immediately.</p>`
    );
    const text = `Hello ${name},\n\nNew Login Detected:\nDevice: ${details.device}\nIP: ${details.ip}\nTime: ${details.time}`;
    return { html, text, subject };
  },

  accountActivated: (name: string, loginUrl: string): TemplateResult => {
    const subject = "Your Account Has Been Activated";
    const html = getBaseLayout(
      subject,
      `<p>Hello ${name},</p>
       <p>Your administrator has reviewed and approved your access request. Your account status has been updated to <strong>ACTIVE</strong>.</p>
       <p>You can now sign in to view the inventory ledger.</p>`,
      { label: "Login Now", url: loginUrl }
    );
    const text = `Hello ${name},\n\nYour account has been activated. Login here: ${loginUrl}`;
    return { html, text, subject };
  },

  accountDeactivated: (name: string): TemplateResult => {
    const subject = "Your Account Has Been Deactivated";
    const html = getBaseLayout(
      subject,
      `<p>Hello ${name},</p>
       <p>Your account status has been set to <strong>INACTIVE</strong> by an administrator. You will not be able to log into the system.</p>
       <p>If you believe this is in error, please contact your administrator.</p>`
    );
    const text = `Hello ${name},\n\nYour account has been deactivated. Please contact support.`;
    return { html, text, subject };
  },

  // Stock Alerts
  lowStock: (productName: string, sku: string, currentQty: number, minStock: number): TemplateResult => {
    const subject = `Low Stock Alert: ${productName} (${sku})`;
    const html = getBaseLayout(
      subject,
      `<p>Hello Administrator,</p>
       <p>This is an automated system notification that a product has dropped below its configured minimum stock threshold.</p>
       <table class="table">
         <tr><th>Product</th><td>${productName}</td></tr>
         <tr><th>SKU</th><td>${sku}</td></tr>
         <tr><th>Current Stock</th><td><span class="badge badge-warning">${currentQty} units</span></td></tr>
         <tr><th>Minimum Threshold</th><td>${minStock} units</td></tr>
       </table>
       <p>Please place a restock order with the corresponding supplier to prevent stockouts.</p>`
    );
    const text = `Low Stock Alert: ${productName} (${sku}) is down to ${currentQty} units (min threshold: ${minStock}).`;
    return { html, text, subject };
  },

  outOfStock: (productName: string, sku: string): TemplateResult => {
    const subject = `CRITICAL: Out of Stock Alert - ${productName} (${sku})`;
    const html = getBaseLayout(
      subject,
      `<p>Hello Administrator,</p>
       <p style="color: #dc2626; font-weight: bold;">CRITICAL ALERT: Product is fully out of stock.</p>
       <table class="table">
         <tr><th>Product</th><td>${productName}</td></tr>
         <tr><th>SKU</th><td>${sku}</td></tr>
         <tr><th>Current Stock</th><td><span class="badge badge-error">0 units</span></td></tr>
       </table>
       <p>This product is no longer available for fulfillment. Immediate reordering is highly recommended.</p>`
    );
    const text = `CRITICAL OUT OF STOCK: ${productName} (${sku}) is completely out of stock.`;
    return { html, text, subject };
  },

  inventoryAdjustment: (details: {
    productName: string;
    sku: string;
    prevStock: number;
    newStock: number;
    user: string;
    reason: string;
  }): TemplateResult => {
    const subject = `Inventory Adjusted: ${details.productName}`;
    const html = getBaseLayout(
      subject,
      `<p>Hello,</p>
       <p>An inventory adjustment has been recorded for the following product:</p>
       <table class="table">
         <tr><th>Product</th><td>${details.productName} (${details.sku})</td></tr>
         <tr><th>Previous Stock</th><td>${details.prevStock}</td></tr>
         <tr><th>New Stock</th><td><strong>${details.newStock}</strong></td></tr>
         <tr><th>Adjusted By</th><td>${details.user}</td></tr>
         <tr><th>Reason</th><td>${details.reason}</td></tr>
       </table>`
    );
    const text = `Inventory Adjusted: ${details.productName} (${details.sku}) changed from ${details.prevStock} to ${details.newStock} by ${details.user}. Reason: ${details.reason}`;
    return { html, text, subject };
  },

  inventoryImport: (details: {
    fileName: string;
    totalImported: number;
    user: string;
  }): TemplateResult => {
    const subject = "Inventory CSV Import Completed";
    const html = getBaseLayout(
      subject,
      `<p>Hello,</p>
       <p>The bulk product import process has completed successfully.</p>
       <table class="table">
         <tr><th>Import Source</th><td>${details.fileName}</td></tr>
         <tr><th>Total Records Loaded</th><td>${details.totalImported}</td></tr>
         <tr><th>Executed By</th><td>${details.user}</td></tr>
       </table>`
    );
    const text = `CSV Import Complete: ${details.totalImported} products imported from ${details.fileName} by ${details.user}.`;
    return { html, text, subject };
  },

  // CRUD Templates
  productCreated: (prod: { name: string; sku: string; qty: number; user: string }): TemplateResult => {
    const subject = `New Product Registered: ${prod.name}`;
    const html = getBaseLayout(
      subject,
      `<p>Hello,</p>
       <p>A new product record has been created in the catalog:</p>
       <table class="table">
         <tr><th>Product Name</th><td>${prod.name}</td></tr>
         <tr><th>SKU Code</th><td>${prod.sku}</td></tr>
         <tr><th>Initial Quantity</th><td>${prod.qty} units</td></tr>
         <tr><th>Recorded By</th><td>${prod.user}</td></tr>
       </table>`
    );
    const text = `Product Created: ${prod.name} (${prod.sku}) by ${prod.user}.`;
    return { html, text, subject };
  },

  productUpdated: (prod: { name: string; sku: string; user: string }): TemplateResult => {
    const subject = `Catalog Updated: ${prod.name}`;
    const html = getBaseLayout(
      subject,
      `<p>Hello,</p>
       <p>The product catalog registry has been updated for product: <strong>${prod.name} (${prod.sku})</strong>.</p>
       <p>Change made by: <strong>${prod.user}</strong></p>`
    );
    const text = `Product Updated: ${prod.name} (${prod.sku}) by ${prod.user}.`;
    return { html, text, subject };
  },

  productDeleted: (name: string, sku: string, user: string): TemplateResult => {
    const subject = `Product Deleted: ${name}`;
    const html = getBaseLayout(
      subject,
      `<p>Hello,</p>
       <p>A product record has been removed from the active catalog:</p>
       <table class="table">
         <tr><th>Product Name</th><td>${name}</td></tr>
         <tr><th>SKU Code</th><td>${sku}</td></tr>
         <tr><th>Deleted By</th><td>${user}</td></tr>
       </table>`
    );
    const text = `Product Deleted: ${name} (${sku}) by ${user}.`;
    return { html, text, subject };
  },

  supplierCreated: (companyName: string, contact: string, user: string): TemplateResult => {
    const subject = `New Supplier Registered: ${companyName}`;
    const html = getBaseLayout(
      subject,
      `<p>Hello,</p>
       <p>A new vendor record has been created:</p>
       <table class="table">
         <tr><th>Company Name</th><td>${companyName}</td></tr>
         <tr><th>Contact Person</th><td>${contact}</td></tr>
         <tr><th>Created By</th><td>${user}</td></tr>
       </table>`
    );
    const text = `Supplier Created: ${companyName} (${contact}) by ${user}.`;
    return { html, text, subject };
  },

  supplierUpdated: (companyName: string, user: string): TemplateResult => {
    const subject = `Supplier Profile Updated: ${companyName}`;
    const html = getBaseLayout(
      subject,
      `<p>Hello,</p>
       <p>The supplier profile for <strong>${companyName}</strong> has been updated by <strong>${user}</strong>.</p>`
    );
    const text = `Supplier Updated: ${companyName} by ${user}.`;
    return { html, text, subject };
  },

  supplierDeleted: (companyName: string, user: string): TemplateResult => {
    const subject = `Supplier Removed: ${companyName}`;
    const html = getBaseLayout(
      subject,
      `<p>Hello,</p>
       <p>The supplier record for <strong>${companyName}</strong> has been deleted from the registry by <strong>${user}</strong>.</p>`
    );
    const text = `Supplier Deleted: ${companyName} by ${user}.`;
    return { html, text, subject };
  },

  // User Administration
  roleChanged: (name: string, oldRole: string, newRole: string, adminUser: string): TemplateResult => {
    const subject = "System Role Permission Update";
    const html = getBaseLayout(
      subject,
      `<p>Hello ${name},</p>
       <p>Your user role clearance has been updated in the database.</p>
       <table class="table">
         <tr><th>Previous Role</th><td>${oldRole}</td></tr>
         <tr><th>New Assigned Role</th><td><strong>${newRole}</strong></td></tr>
         <tr><th>Authorized By</th><td>${adminUser}</td></tr>
       </table>
       <p>Please log out and log back in for these updates to take effect.</p>`
    );
    const text = `Hello ${name},\n\nYour role has been changed from ${oldRole} to ${newRole} by ${adminUser}.`;
    return { html, text, subject };
  },

  // Security Settings Changes
  securityAlert: (action: string, ip: string, user: string): TemplateResult => {
    const subject = `Security Alert: System Config Change - ${action}`;
    const html = getBaseLayout(
      subject,
      `<p>Hello Administrator,</p>
       <p>A critical security-relevant setting has been modified in the settings module.</p>
       <table class="table">
         <tr><th>Action</th><td>${action}</td></tr>
         <tr><th>Executed By</th><td>${user}</td></tr>
         <tr><th>IP Address</th><td>${ip}</td></tr>
         <tr><th>Time</th><td>${new Date().toISOString()}</td></tr>
       </table>`
    );
    const text = `Security Alert: ${action} by ${user} from IP ${ip}.`;
    return { html, text, subject };
  },

  // Reports
  scheduledReport: (type: "Daily" | "Weekly" | "Monthly", metrics: {
    totalProducts: number;
    valuation: number;
    lowStockCount: number;
  }): TemplateResult => {
    const subject = `${type} Inventory Performance Digest`;
    const html = getBaseLayout(
      subject,
      `<p>Hello Administrator,</p>
       <p>Please find your automated digest of current inventory levels and valuations below:</p>
       <table class="table">
         <tr><th>Report Interval</th><td>${type} System Cron</td></tr>
         <tr><th>Total Active SKUs</th><td>${metrics.totalProducts}</td></tr>
         <tr><th>Total Valuation</th><td><strong>$${metrics.valuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td></tr>
         <tr><th>Low/Out items</th><td><span class="badge badge-warning">${metrics.lowStockCount} items</span></td></tr>
       </table>
       <p>Full tables and CSV details are accessible directly on your settings portal.</p>`
    );
    const text = `${type} Report:\nProducts: ${metrics.totalProducts}\nValuation: $${metrics.valuation}\nLow Stock: ${metrics.lowStockCount}`;
    return { html, text, subject };
  },
};
