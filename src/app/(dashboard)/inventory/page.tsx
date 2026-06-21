import React from "react";
import { InventoryRepository } from "@/repositories/InventoryRepository";
import { ProductRepository } from "@/repositories/ProductRepository";
import { stockIn, stockOut, adjustStock } from "@/actions/inventoryActions";
import {
  ArrowDownCircle, ArrowUpCircle, AlertCircle, SlidersHorizontal, Search,
  Package, Filter, TrendingDown, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { SubmitButton } from "@/components/SubmitButton";

export const revalidate = 0;

const TYPE_BADGE: Record<string, string> = {
  IN: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  OUT: "bg-red-50 text-red-600 border border-red-100",
  RETURN: "bg-blue-50 text-blue-600 border border-blue-100",
  ADJUSTMENT: "bg-amber-50 text-amber-600 border border-amber-100",
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  IN: <TrendingUp className="w-3 h-3" />,
  OUT: <TrendingDown className="w-3 h-3" />,
  RETURN: <ArrowDownCircle className="w-3 h-3" />,
  ADJUSTMENT: <SlidersHorizontal className="w-3 h-3" />,
};

export default async function InventoryPage(props: {
  searchParams: Promise<{
    action?: string;
    productId?: string;
    type?: string;
    page?: string;
    error?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const action = searchParams.action || "";
  const productId = searchParams.productId || "";
  const typeFilter = searchParams.type || "";
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 15;
  const offset = (page - 1) * limit;

  const session = await auth();
  const role = (session?.user as any)?.role || "STAFF";

  const inventoryRepo = new InventoryRepository();
  const productRepo = new ProductRepository();

  const [rawTransactions, totalCount, rawProducts, rawLowStock] = await Promise.all([
    inventoryRepo.findTransactions({ productId, type: typeFilter, limit, offset }),
    inventoryRepo.countTransactions({ productId, type: typeFilter }),
    productRepo.findAll({ limit: 200, offset: 0 }),
    productRepo.findLowStock(5),
  ]);

  // Serialize Mongoose documents → plain objects
  const transactions: Record<string, any>[] = JSON.parse(JSON.stringify(rawTransactions));
  const products: Record<string, any>[] = JSON.parse(JSON.stringify(rawProducts));
  const lowStockProducts: Record<string, any>[] = JSON.parse(JSON.stringify(rawLowStock));

  const totalPages = Math.ceil(totalCount / limit);

    const errorMsg = searchParams.error ? String(searchParams.error) : '';

  // Render error banner if present
  const errorBanner = errorMsg && (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-2">
      <AlertCircle className="w-5 h-5 text-red-600" />
      <span className="text-red-700 text-sm font-medium">{errorMsg}</span>
    </div>
  );

  // Modified handlers to forward errors via query param
  const handleStockIn = async (formData: FormData) => {
    "use server";
    const result = await stockIn(null, formData);
    if (result?.error) {
      redirect(`/inventory?error=${encodeURIComponent(result.error)}`);
    } else {
      redirect(`/inventory`);
    }
  };

  const handleStockOut = async (formData: FormData) => {
    "use server";
    const result = await stockOut(null, formData);
    if (result?.error) {
      redirect(`/inventory?error=${encodeURIComponent(result.error)}`);
    } else {
      redirect(`/inventory`);
    }
  };

  const handleAdjust = async (formData: FormData) => {
    "use server";
    const result = await adjustStock(null, formData);
    if (result?.error) {
      redirect(`/inventory?error=${encodeURIComponent(result.error)}`);
    } else {
      redirect(`/inventory`);
    }
  };

  const inputCls =
    "w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none transition";
  const labelCls = "text-xs font-bold text-slate-600 uppercase";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventory</h1>
          <p className="text-slate-500 text-sm">
            Track stock movements — inbound, outbound, returns and adjustments.
          </p>
        </div>
        {role !== "STAFF" ? (
          <div className="flex items-center gap-2">
            <Link
              href="/inventory?action=stock-in"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl px-4 py-2.5 shadow-md shadow-emerald-500/10 transition flex items-center gap-2 text-sm"
            >
              <ArrowDownCircle className="w-4 h-4" />
              Stock In
            </Link>
            <Link
              href="/inventory?action=stock-out"
              className="bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl px-4 py-2.5 shadow-md shadow-red-500/10 transition flex items-center gap-2 text-sm"
            >
              <ArrowUpCircle className="w-4 h-4" />
              Stock Out
            </Link>
            <Link
              href="/inventory?action=adjust"
              className="bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl px-4 py-2.5 shadow-md shadow-amber-500/10 transition flex items-center gap-2 text-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Adjust
            </Link>
          </div>
        ) : (
          <span className="bg-slate-50 border border-slate-200 text-slate-500 font-semibold rounded-xl px-4 py-2.5 text-xs italic">Read Only View</span>
        )}
      </div>

      {errorBanner}

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-amber-700 text-xs font-bold uppercase mb-2 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5" /> Low Stock Alert
          </p>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.map((p) => (
              <span
                key={String(p._id)}
                className="inline-flex items-center gap-1.5 text-xs bg-white border border-amber-200 text-amber-700 rounded-lg px-2.5 py-1 font-semibold"
              >
                <Package className="w-3 h-3" />
                {p.name} — {p.quantity} / {p.minimumStock} min
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <form method="GET" action="/inventory" className="flex flex-wrap gap-2">
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            name="productId"
            defaultValue={productId}
            className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 outline-none transition appearance-none cursor-pointer"
          >
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={String(p._id)} value={String(p._id)}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
        </div>
        <select
          name="type"
          defaultValue={typeFilter}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none transition appearance-none cursor-pointer"
        >
          <option value="">All Types</option>
          <option value="IN">Stock In</option>
          <option value="OUT">Stock Out</option>
          <option value="RETURN">Return</option>
          <option value="ADJUSTMENT">Adjustment</option>
        </select>
        <button
          type="submit"
          className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold rounded-xl px-4 py-2.5 text-sm transition"
        >
          Filter
        </button>
        {(productId || typeFilter) && (
          <Link
            href="/inventory"
            className="bg-white border border-slate-200 text-slate-500 hover:text-slate-800 font-semibold rounded-xl px-4 py-2.5 text-sm transition"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Summary bar */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing <span className="font-semibold text-slate-700">{transactions.length}</span> of{" "}
          <span className="font-semibold text-slate-700">{totalCount}</span> transactions
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {page > 1 && (
              <Link
                href={`/inventory?productId=${productId}&type=${typeFilter}&page=${page - 1}`}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition font-semibold"
              >
                ← Prev
              </Link>
            )}
            <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold">{page}</span>
            {page < totalPages && (
              <Link
                href={`/inventory?productId=${productId}&type=${typeFilter}&page=${page + 1}`}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition font-semibold"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Transaction Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm">
            <SlidersHorizontal className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            No transactions found. Record a stock movement to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-5 py-3.5">Product</th>
                  <th className="text-center px-4 py-3.5">Type</th>
                  <th className="text-right px-4 py-3.5">Qty</th>
                  <th className="text-right px-4 py-3.5">Before</th>
                  <th className="text-right px-4 py-3.5">After</th>
                  <th className="text-left px-4 py-3.5">Notes</th>
                  <th className="text-left px-4 py-3.5">Recorded By</th>
                  <th className="text-right px-5 py-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const product = tx.productId as any;
                  const user = tx.userId as any;
                  return (
                    <tr key={String(tx._id)} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{product?.name || "—"}</p>
                          <p className="text-[10px] font-mono text-slate-400">{product?.sku || ""}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_BADGE[tx.type]
                            }`}
                        >
                          {TYPE_ICON[tx.type]}
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-700">
                        {tx.type === "OUT" ? "-" : "+"}{tx.quantity}
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-500">{tx.previousStock}</td>
                      <td className="px-4 py-3.5 text-right font-semibold text-slate-800">{tx.newStock}</td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs max-w-[180px] truncate">
                        {tx.notes || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 text-xs">{user?.name || "System"}</td>
                      <td className="px-5 py-3.5 text-right text-slate-500 text-xs whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── STOCK IN MODAL ─────────────────────────────────────────── */}
      {action === "stock-in" && role !== "STAFF" && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Record Stock In</h2>
              </div>
              <Link href="/inventory" className="text-slate-400 hover:text-slate-700 font-semibold text-sm">✕</Link>
            </div>
            <form action={handleStockIn} className="space-y-4">
              <div className="space-y-1">
                <label className={labelCls}>Product *</label>
                <select name="productId" required className={inputCls}>
                  <option value="">Select a product</option>
                  {products.map((p) => (
                    <option key={String(p._id)} value={String(p._id)}>
                      {p.name} ({p.sku}) — Stock: {p.quantity}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Quantity Received *</label>
                <input type="number" name="quantity" required min="1" placeholder="e.g. 50" className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Notes / Reference</label>
                <input type="text" name="notes" placeholder="e.g. PO #1023, Batch ABC" className={inputCls} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Link href="/inventory" className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl px-4 py-2.5 text-xs transition">Cancel</Link>
                <SubmitButton type="submit" loadingText="Confirming..." className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl px-4 py-2.5 text-xs shadow-md shadow-emerald-500/10 transition">
                  Confirm Stock In
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── STOCK OUT MODAL ─────────────────────────────────────────── */}
      {action === "stock-out" && role !== "STAFF" && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-50 rounded-lg">
                  <ArrowUpCircle className="w-4 h-4 text-red-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Record Stock Out</h2>
              </div>
              <Link href="/inventory" className="text-slate-400 hover:text-slate-700 font-semibold text-sm">✕</Link>
            </div>
            <form action={handleStockOut} className="space-y-4">
              <div className="space-y-1">
                <label className={labelCls}>Product *</label>
                <select name="productId" required className={inputCls}>
                  <option value="">Select a product</option>
                  {products.map((p) => (
                    <option key={String(p._id)} value={String(p._id)}>
                      {p.name} ({p.sku}) — Stock: {p.quantity}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Quantity Dispatched *</label>
                <input type="number" name="quantity" required min="1" placeholder="e.g. 10" className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Notes / Reference</label>
                <input type="text" name="notes" placeholder="e.g. Order #789, Customer: ABC Ltd" className={inputCls} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Link href="/inventory" className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl px-4 py-2.5 text-xs transition">Cancel</Link>
                <SubmitButton type="submit" loadingText="Confirming..." className="bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl px-4 py-2.5 text-xs shadow-md shadow-red-500/10 transition">
                  Confirm Stock Out
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADJUST MODAL ─────────────────────────────────────────────── */}
      {action === "adjust" && role !== "STAFF" && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Adjust Stock</h2>
              </div>
              <Link href="/inventory" className="text-slate-400 hover:text-slate-700 font-semibold text-sm">✕</Link>
            </div>
            <form action={handleAdjust} className="space-y-4">
              <div className="space-y-1">
                <label className={labelCls}>Product *</label>
                <select name="productId" required className={inputCls}>
                  <option value="">Select a product</option>
                  {products.map((p) => (
                    <option key={String(p._id)} value={String(p._id)}>
                      {p.name} ({p.sku}) — Current: {p.quantity}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>New Quantity (Absolute) *</label>
                <input type="number" name="newQuantity" required min="0" placeholder="e.g. 75" className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Reason *</label>
                <input type="text" name="reason" required placeholder="e.g. Physical count correction" className={inputCls} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Link href="/inventory" className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl px-4 py-2.5 text-xs transition">Cancel</Link>
                <SubmitButton type="submit" loadingText="Applying..." className="bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl px-4 py-2.5 text-xs shadow-md shadow-amber-500/10 transition">
                  Apply Adjustment
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
