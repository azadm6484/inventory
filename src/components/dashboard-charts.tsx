"use client";

import React from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ChartDataPoint {
  month: string;
  in: number;
  out: number;
}

interface DashboardChartsProps {
  movementData: ChartDataPoint[];
  lowStockProducts: any[];
}

export default function DashboardCharts({ movementData, lowStockProducts }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Stock movement chart */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col mb-6">
          <h2 className="text-slate-800 text-base font-bold">Stock Movement Trends</h2>
          <p className="text-slate-400 text-xs font-medium">Monthly quantity of items checked In vs checked Out</p>
        </div>

        <div className="h-80 w-full">
          {movementData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              No movement logs recorded yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={movementData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px" }}
                  labelStyle={{ color: "#1e293b", fontWeight: "bold" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Area
                  type="monotone"
                  dataKey="in"
                  name="Stock In"
                  stroke="#2563eb"
                  fillOpacity={1}
                  fill="url(#colorIn)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="out"
                  name="Stock Out"
                  stroke="#f59e0b"
                  fillOpacity={1}
                  fill="url(#colorOut)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Low Stock alerting list */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex flex-col mb-4">
            <h2 className="text-slate-800 text-base font-bold">Low Stock Warning</h2>
            <p className="text-slate-400 text-xs font-medium">Items approaching or below safety threshold</p>
          </div>

          <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
            {lowStockProducts.length === 0 ? (
              <div className="text-slate-400 text-sm text-center py-12">
                ✓ All items healthy and in-stock
              </div>
            ) : (
              lowStockProducts.map((product) => (
                <div 
                  key={product._id} 
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-800 text-xs font-bold truncate leading-4">{product.name}</p>
                    <span className="text-[10px] text-slate-400 font-mono">{product.sku}</span>
                  </div>
                  <div className="text-right pl-3">
                    <p className={`text-xs font-extrabold ${product.quantity === 0 ? "text-red-600" : "text-amber-600"}`}>
                      Qty: {product.quantity}
                    </p>
                    <span className="text-[9px] text-slate-400 block font-semibold">Min: {product.minimumStock}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {lowStockProducts.length > 0 && (
          <Link 
            href="/products?status=ACTIVE" 
            className="w-full mt-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 py-2.5 rounded-xl text-center text-xs font-bold text-slate-700 transition block"
          >
            Review Catalog
          </Link>
        )}
      </div>
    </div>
  );
}
