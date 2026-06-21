import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { ProductRepository } from "@/repositories/ProductRepository";
import { InventoryRepository } from "@/repositories/InventoryRepository";
import { CategoryRepository } from "@/repositories/CategoryRepository";
import { SupplierRepository } from "@/repositories/SupplierRepository";
import { UserRepository } from "@/repositories/UserRepository";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const productRepo = new ProductRepository();
  const inventoryRepo = new InventoryRepository();
  const categoryRepo = new CategoryRepository();
  const supplierRepo = new SupplierRepository();
  const userRepo = new UserRepository();

  try {
    const [
      totalProducts,
      totalCategories,
      totalSuppliers,
      totalUsers,
      valuation,
      lowStockCount,
      outOfStockCount,
      movementStats,
    ] = await Promise.all([
      productRepo.count({}),
      categoryRepo.count({}),
      supplierRepo.count({}),
      userRepo.count({}),
      productRepo.getInventoryValuation(),
      productRepo.countLowStock(),
      productRepo.countOutOfStock(),
      inventoryRepo.getMovementStats(6),
    ]);

    return NextResponse.json({
      stats: {
        totalProducts,
        totalCategories,
        totalSuppliers,
        totalUsers,
        inventoryValue: valuation.totalValue,
        inventoryCost: valuation.totalCost,
        lowStockProducts: lowStockCount,
        outOfStockProducts: outOfStockCount,
      },
      movementStats,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
