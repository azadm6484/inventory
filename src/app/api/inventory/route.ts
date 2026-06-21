import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { InventoryRepository } from "@/repositories/InventoryRepository";

const inventoryRepo = new InventoryRepository();

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId") || "";
  const type = searchParams.get("type") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = (page - 1) * limit;

  try {
    const [transactions, total] = await Promise.all([
      inventoryRepo.findTransactions({ productId, type, limit, offset }),
      inventoryRepo.countTransactions({ productId, type }),
    ]);

    return NextResponse.json({
      data: transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
