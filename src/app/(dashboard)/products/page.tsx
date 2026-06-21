import React from "react";
import { ProductRepository } from "@/repositories/ProductRepository";
import { CategoryRepository } from "@/repositories/CategoryRepository";
import { SupplierRepository } from "@/repositories/SupplierRepository";
import { createProduct, updateProduct, deleteProduct } from "@/actions/productActions";
import {
  Plus, Edit2, Trash2, Search, Package, AlertTriangle,
  CheckCircle, Archive, Filter,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ImageUpload } from "@/components/ImageUpload";
import { ProductFilters } from "@/components/ProductFilters";
import { auth } from "@/lib/auth/auth";
import { SubmitButton } from "@/components/SubmitButton";

export const revalidate = 0;

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  DRAFT: "bg-amber-50  text-amber-600  border border-amber-100",
  ARCHIVED: "bg-slate-50  text-slate-500  border border-slate-200",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  ACTIVE: <CheckCircle className="w-3 h-3" />,
  DRAFT: <AlertTriangle className="w-3 h-3" />,
  ARCHIVED: <Archive className="w-3 h-3" />,
};

async function handleAddProduct(formData: FormData) {
  "use server";
  const { createProduct } = await import("@/actions/productActions");
  const { redirect } = await import("next/navigation");
  const result = await createProduct(null, formData);
  if (!result.error) redirect("/products");
}

async function handleEditProduct(productId: string, formData: FormData) {
  "use server";
  if (!productId) return;
  const { updateProduct } = await import("@/actions/productActions");
  const { redirect } = await import("next/navigation");
  const result = await updateProduct(productId, null, formData);
  if (!result.error) redirect("/products");
}

async function handleDeleteProduct(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  if (!id) return;
  const { deleteProduct } = await import("@/actions/productActions");
  const { redirect } = await import("next/navigation");
  await deleteProduct(id);
  redirect("/products");
}

export default async function ProductsPage(props: {
  searchParams: Promise<{
    query?: string;
    action?: string;
    id?: string;
    categoryId?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.query || "";
  const action = searchParams.action || "";
  const productId = searchParams.id || "";
  const categoryId = searchParams.categoryId || "";
  const status = searchParams.status || "";
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 12;
  const offset = (page - 1) * limit;

  const session = await auth();
  const role = (session?.user as any)?.role || "STAFF";

  const productRepo = new ProductRepository();
  const categoryRepo = new CategoryRepository();
  const supplierRepo = new SupplierRepository();

  const [rawProducts, totalCount, rawCategories, rawSuppliers] = await Promise.all([
    productRepo.findAll({ query, categoryId, status, limit, offset }),
    productRepo.count({ query, categoryId, status }),
    categoryRepo.findAll({}),
    supplierRepo.findAll({}),
  ]);

  // Serialize Mongoose documents → plain objects to avoid Next.js RSC serialization errors
  const products = JSON.parse(JSON.stringify(rawProducts));
  const categories = JSON.parse(JSON.stringify(rawCategories));
  const suppliers = JSON.parse(JSON.stringify(rawSuppliers));

  const serializedCategories = (categories as Array<{ _id: string; name: string }>).map((c) => ({
    _id: String(c._id),
    name: c.name,
  }));

  const totalPages = Math.ceil(totalCount / limit);

  let editingProduct: Record<string, any> | null = null;
  if (action === "edit" && productId) {
    const rawEditing = await productRepo.findById(productId);
    editingProduct = rawEditing ? JSON.parse(JSON.stringify(rawEditing)) : null;
  }

  const inputCls =
    "w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none transition";
  const labelCls = "text-xs font-bold text-slate-600 uppercase";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products</h1>
          <p className="text-slate-500 text-sm">
            Manage your product catalog, pricing, stock levels and images.
          </p>
        </div>
        {role !== "STAFF" && (
          <Link
            href="/products?action=add"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-4 py-2.5 shadow-md shadow-blue-500/10 transition flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        )}
      </div>

      {/* Filters */}
      <ProductFilters
        categories={serializedCategories}
        initialQuery={query}
        initialCategoryId={categoryId}
        initialStatus={status}
      />

      {/* Summary bar */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing <span className="font-semibold text-slate-700">{products.length}</span> of{" "}
          <span className="font-semibold text-slate-700">{totalCount}</span> products
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {page > 1 && (
              <Link
                href={`/products?query=${query}&categoryId=${categoryId}&status=${status}&page=${page - 1}`}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition font-semibold"
              >
                ← Prev
              </Link>
            )}
            <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold">
              {page}
            </span>
            {page < totalPages && (
              <Link
                href={`/products?query=${query}&categoryId=${categoryId}&status=${status}&page=${page + 1}`}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition font-semibold"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm">
            <Package className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            No products found. Try adjusting your filters or{" "}
            <Link href="/products?action=add" className="text-blue-600 font-semibold hover:underline">
              add a product
            </Link>
            .
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-5 py-3.5">Product</th>
                  <th className="text-left px-4 py-3.5">SKU</th>
                  <th className="text-left px-4 py-3.5">Category</th>
                  <th className="text-right px-4 py-3.5">Buy Price</th>
                  <th className="text-right px-4 py-3.5">Sell Price</th>
                  <th className="text-right px-4 py-3.5">Stock</th>
                  <th className="text-center px-4 py-3.5">Status</th>
                  <th className="text-right px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product: any) => {
                  const isLow = product.quantity <= product.minimumStock && product.quantity > 0;
                  const isOut = product.quantity === 0;
                  return (
                    <tr
                      key={String(product._id)}
                      className="hover:bg-slate-50 transition group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                              <Package className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800 leading-4">{product.name}</p>
                            {product.barcode && (
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {product.barcode}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          {product.sku}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 text-xs">
                        {(product.categoryId as any)?.name || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-700 font-medium">
                        ₹{product.purchasePrice.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-700 font-medium">
                        ₹{product.sellingPrice.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${isOut
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : isLow
                              ? "bg-amber-50 text-amber-600 border border-amber-100"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            }`}
                        >
                          {isOut && <AlertTriangle className="w-3 h-3" />}
                          {product.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[product.status]
                            }`}
                        >
                          {STATUS_ICON[product.status]}
                          {product.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {role !== "STAFF" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/products?action=edit&id=${product._id}`}
                              className="p-1.5 hover:bg-slate-100 border border-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Link>
                            <form action={handleDeleteProduct} className="inline">
                              <input type="hidden" name="id" value={String(product._id)} />
                              <SubmitButton
                                loadingText=""
                                className="p-1.5 hover:bg-red-50 border border-slate-100 rounded-lg text-slate-500 hover:text-red-600 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </SubmitButton>
                            </form>
                          </div>
                        ) : (
                          <div className="text-right text-slate-400 text-xs italic font-medium">Read Only</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ADD MODAL ─────────────────────────────────────────────── */}
      {action === "add" && role !== "STAFF" && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900">Add New Product</h2>
              <Link href="/products" className="text-slate-400 hover:text-slate-700 font-semibold text-sm">
                ✕
              </Link>
            </div>
            <form action={handleAddProduct} className="space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className={labelCls}>Product Name *</label>
                  <input type="text" name="name" required placeholder="e.g. HP LaserJet Printer" className={inputCls} />
                </div>
              </div>
              {/* Row 2 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Category *</label>
                  <select name="categoryId" required className={inputCls}>
                    <option value="">Select category</option>
                    {categories.map((c: any) => (
                      <option key={String(c._id)} value={String(c._id)}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Supplier *</label>
                  <select name="supplierId" required className={inputCls}>
                    <option value="">Select supplier</option>
                    {suppliers.map((s: any) => (
                      <option key={String(s._id)} value={String(s._id)}>{s.companyName}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Row 3 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Purchase Price (₹) *</label>
                  <input type="number" name="purchasePrice" required min="0" step="0.01" placeholder="0.00" className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Selling Price (₹) *</label>
                  <input type="number" name="sellingPrice" required min="0" step="0.01" placeholder="0.00" className={inputCls} />
                </div>
              </div>
              {/* Row 4 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Initial Qty *</label>
                  <input type="number" name="quantity" required min="0" defaultValue={0} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Min Stock *</label>
                  <input type="number" name="minimumStock" required min="0" defaultValue={10} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Status</label>
                  <select name="status" className={inputCls}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>
              {/* Row 5 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Barcode</label>
                  <input type="text" name="barcode" placeholder="e.g. 8901030952616" className={inputCls} />
                </div>
                <ImageUpload name="image" label="Product Image" />
              </div>
              {/* Description */}
              <div className="space-y-1">
                <label className={labelCls}>Description</label>
                <textarea name="description" rows={2} placeholder="Brief product description..." className={inputCls} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Link href="/products" className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl px-4 py-2.5 text-xs transition">
                  Cancel
                </Link>
                <SubmitButton loadingText="Saving Product..." className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-4 py-2.5 text-xs shadow-md shadow-blue-500/10 transition">
                  Save Product
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ─────────────────────────────────────────────── */}
      {action === "edit" && editingProduct && role !== "STAFF" && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900">Edit Product</h2>
              <Link href="/products" className="text-slate-400 hover:text-slate-700 font-semibold text-sm">
                ✕
              </Link>
            </div>
            <form action={handleEditProduct.bind(null, productId)} className="space-y-4">
              <div className="col-span-2 space-y-1">
                <label className={labelCls}>Product Name *</label>
                <input type="text" name="name" required defaultValue={editingProduct.name} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Category *</label>
                  <select name="categoryId" required className={inputCls} defaultValue={(editingProduct.categoryId as any)?._id?.toString() || ""}>
                    <option value="">Select category</option>
                    {categories.map((c: any) => (
                      <option key={String(c._id)} value={String(c._id)}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Supplier *</label>
                  <select name="supplierId" required className={inputCls} defaultValue={(editingProduct.supplierId as any)?._id?.toString() || ""}>
                    <option value="">Select supplier</option>
                    {suppliers.map((s: any) => (
                      <option key={String(s._id)} value={String(s._id)}>{s.companyName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Purchase Price (₹) *</label>
                  <input type="number" name="purchasePrice" required min="0" step="0.01" defaultValue={editingProduct.purchasePrice} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Selling Price (₹) *</label>
                  <input type="number" name="sellingPrice" required min="0" step="0.01" defaultValue={editingProduct.sellingPrice} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Qty *</label>
                  <input type="number" name="quantity" required min="0" defaultValue={editingProduct.quantity} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Min Stock *</label>
                  <input type="number" name="minimumStock" required min="0" defaultValue={editingProduct.minimumStock} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Status</label>
                  <select name="status" defaultValue={editingProduct.status} className={inputCls}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Barcode</label>
                  <input type="text" name="barcode" defaultValue={editingProduct.barcode || ""} className={inputCls} />
                </div>
                <ImageUpload name="image" label="Product Image" defaultValue={editingProduct.image || ""} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Description</label>
                <textarea name="description" rows={2} defaultValue={editingProduct.description || ""} className={inputCls} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Link href="/products" className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl px-4 py-2.5 text-xs transition">
                  Cancel
                </Link>
                <SubmitButton loadingText="Updating Product..." className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-4 py-2.5 text-xs shadow-md shadow-blue-500/10 transition">
                  Update Product
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
