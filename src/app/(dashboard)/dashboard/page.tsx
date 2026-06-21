import React from "react";
import { ProductRepository } from "@/repositories/ProductRepository";
import { InventoryRepository } from "@/repositories/InventoryRepository";
import { CategoryRepository } from "@/repositories/CategoryRepository";
import { SupplierRepository } from "@/repositories/SupplierRepository";
import { UserRepository } from "@/repositories/UserRepository";
import DashboardCharts from "@/components/dashboard-charts";
import { Package, Tags, Truck, AlertTriangle, Coins, BarChart3 } from "lucide-react";

export const revalidate = 0; // Dynamic rendering

export default async function DashboardPage() {
  const productRepo = new ProductRepository();
  const inventoryRepo = new InventoryRepository();
  const categoryRepo = new CategoryRepository();
  const supplierRepo = new SupplierRepository();
  const userRepo = new UserRepository();

  const [
    totalProducts,
    totalCategories,
    totalSuppliers,
    totalUsers,
    valuation,
    lowStockCount,
    outOfStockCount,
    rawLowStockList,
    rawMovementStats,
  ] = await Promise.all([
    productRepo.count({}),
    categoryRepo.count({}),
    supplierRepo.count({}),
    userRepo.count({}),
    productRepo.getInventoryValuation(),
    productRepo.countLowStock(),
    productRepo.countOutOfStock(),
    productRepo.findLowStock(6),
    inventoryRepo.getMovementStats(6),
  ]);

  // Serialize Mongoose docs → plain objects for client components
  const lowStockList: Record<string, any>[] = JSON.parse(JSON.stringify(rawLowStockList));

  // Define month names for formatting
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Group movement records by month-year using corrected fields
  const collapsedMovementMap = new Map<string, { month: string; in: number; out: number }>();
  rawMovementStats.forEach((item: any) => {
    const monthName = months[item.month - 1] || `${item.month}`;
    const key = `${monthName} ${item.year}`;
    const existing = collapsedMovementMap.get(key) || { month: key, in: 0, out: 0 };

    if (item.type === "IN") {
      existing.in += item.totalQty;
    } else if (item.type === "OUT" || item.type === "ADJUST") {
      // Adjust can be positive or negative, treat as outflow
      existing.out += item.totalQty;
    }
    collapsedMovementMap.set(key, existing);
  });

  const movementChartData = Array.from(collapsedMovementMap.values()).reverse();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const cards = [
    {
      title: "Total Valuation",
      value: formatCurrency(valuation.totalValue),
      subtext: `Cost: ${formatCurrency(valuation.totalCost)}`,
      icon: Coins,
      colorClass: "bg-blue-50 border-blue-100 text-blue-600",
    },
    {
      title: "Catalog Products",
      value: totalProducts.toString(),
      subtext: `${totalCategories} Categories`,
      icon: Package,
      colorClass: "bg-emerald-50 border-emerald-100 text-emerald-600",
    },
    {
      title: "Low Stock Alert",
      value: lowStockCount.toString(),
      subtext: `${outOfStockCount} Out of stock`,
      icon: AlertTriangle,
      colorClass: "bg-amber-50 border-amber-100 text-amber-600",
    },
    {
      title: "Active Vendors",
      value: totalSuppliers.toString(),
      subtext: "Suppliers managed",
      icon: Truck,
      colorClass: "bg-violet-50 border-violet-100 text-violet-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Dashboard</h1>
        <p className="text-slate-500 text-sm">Real-time inventory metrics, stock valuation, and activity trends.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 flex justify-between items-start"
            >
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{card.title}</p>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{card.value}</h3>
                <p className="text-slate-500 text-xs font-medium">{card.subtext}</p>
              </div>
              <div className={`p-2.5 rounded-xl border ${card.colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <DashboardCharts movementData={movementChartData} lowStockProducts={lowStockList} />
    </div>
  );
}
