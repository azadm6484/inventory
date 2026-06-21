import { NextRequest, NextResponse } from "next/server";
import { ProductRepository } from "@/repositories/ProductRepository";
import { EmailService } from "@/services/EmailService";

// This endpoint is called by Vercel Cron or node-cron
// Add to vercel.json: { "crons": [{ "path": "/api/cron/reports", "schedule": "0 8 * * *" }] }
export async function GET(req: NextRequest) {
  // Validate cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") as "Daily" | "Weekly" | "Monthly") || "Daily";

  try {
    const productRepo = new ProductRepository();
    const [total, valuation, lowStockCount] = await Promise.all([
      productRepo.count({ status: "ACTIVE" }),
      productRepo.getInventoryValuation(),
      productRepo.countLowStock(),
    ]);

    await EmailService.sendScheduledReport(type, {
      totalProducts: total,
      valuation: valuation.totalValue,
      lowStockCount,
    });

    return NextResponse.json({
      success: true,
      message: `${type} report sent successfully`,
      metrics: { totalProducts: total, valuation: valuation.totalValue, lowStockCount },
    });
  } catch (error: any) {
    console.error("Cron report error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
