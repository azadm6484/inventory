import React from "react";
import { SupplierRepository } from "@/repositories/SupplierRepository";
import { createSupplier, updateSupplier, deleteSupplier } from "@/actions/supplierActions";
import { Plus, Edit2, Trash2, Search, Building2, Phone, Mail, MapPin } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { SubmitButton } from "@/components/SubmitButton";

export const revalidate = 0;

async function handleAddSupplier(formData: FormData) {
  "use server";
  const { createSupplier } = await import("@/actions/supplierActions");
  const { redirect } = await import("next/navigation");
  const result = await createSupplier(null, formData);
  if (!result.error) redirect("/suppliers");
}

async function handleEditSupplier(supplierId: string, formData: FormData) {
  "use server";
  if (!supplierId) return;
  const { updateSupplier } = await import("@/actions/supplierActions");
  const { redirect } = await import("next/navigation");
  const result = await updateSupplier(supplierId, null, formData);
  if (!result.error) redirect("/suppliers");
}

async function handleDeleteSupplier(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  if (!id) return;
  const { deleteSupplier } = await import("@/actions/supplierActions");
  const { redirect } = await import("next/navigation");
  await deleteSupplier(id);
  redirect("/suppliers");
}

export default async function SuppliersPage(props: {
  searchParams: Promise<{ query?: string; action?: string; id?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.query || "";
  const action = searchParams.action || "";
  const supplierId = searchParams.id || "";
  
  const session = await auth();
  const role = (session?.user as any)?.role || "STAFF";

  const supplierRepo = new SupplierRepository();
  const rawSuppliers = await supplierRepo.findAll({ query });
  const suppliers: Record<string, any>[] = JSON.parse(JSON.stringify(rawSuppliers));

  let editingSupplier: Record<string, any> | null = null;
  if (action === "edit" && supplierId) {
    const rawEditing = await supplierRepo.findById(supplierId);
    editingSupplier = rawEditing ? JSON.parse(JSON.stringify(rawEditing)) : null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Suppliers</h1>
          <p className="text-slate-500 text-sm">Manage vendor contact details, tax registry, and procurement contracts.</p>
        </div>
        {role !== "STAFF" && (
          <Link
            href="/suppliers?action=add"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-4 py-2.5 shadow-md shadow-blue-500/10 transition flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </Link>
        )}
      </div>

      {/* Search Filter */}
      <form method="GET" action="/suppliers" className="flex gap-2 w-full max-w-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            name="query"
            defaultValue={query}
            placeholder="Search suppliers by name, contact or email..."
            className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 outline-none transition"
          />
        </div>
        <button
          type="submit"
          className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold rounded-xl px-4 py-2.5 text-sm transition"
        >
          Search
        </button>
      </form>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {suppliers.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-sm">
            No vendors found. Try adjusting your search query or add a new supplier.
          </div>
        ) : (
          suppliers.map((supplier) => (
            <div key={String(supplier._id)} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-slate-900 font-bold text-sm leading-4">{supplier.companyName}</h3>
                      <span className="text-[10px] text-slate-400 font-medium">Contact: {supplier.contactPerson}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2 text-slate-600 text-xs">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-slate-600 text-xs">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center gap-2 text-slate-600 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{supplier.address}</span>
                    </div>
                  )}
                </div>

                {supplier.gstNumber && (
                  <div className="bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 font-mono inline-block">
                    GST: {supplier.gstNumber}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 mt-4 pt-3.5">
                <span className="text-[10px] text-slate-400 font-medium">
                  Added {new Date(supplier.createdAt).toLocaleDateString()}
                </span>
                {role !== "STAFF" ? (
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/suppliers?action=edit&id=${supplier._id}`}
                      className="p-1.5 hover:bg-slate-50 border border-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Link>
                    <form action={handleDeleteSupplier} className="inline">
                      <input type="hidden" name="id" value={String(supplier._id)} />
                      <SubmitButton
                        loadingText=""
                        className="p-1.5 hover:bg-red-50 border border-slate-100 rounded-lg text-slate-500 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </SubmitButton>
                    </form>
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs italic font-medium">Read Only</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Overlays (Query Driven) */}
      {action === "add" && role !== "STAFF" && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900">Add New Supplier</h2>
              <Link href="/suppliers" className="text-slate-400 hover:text-slate-700 font-semibold text-sm">✕</Link>
            </div>
            <form action={handleAddSupplier} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    required
                    placeholder="e.g. Acme Corp"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Contact Person</label>
                  <input
                    type="text"
                    name="contactPerson"
                    required
                    placeholder="e.g. Jane Doe"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="e.g. supplier@acme.com"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="e.g. +1 555 1234"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none transition"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="e.g. 123 Industrial Parkway, Suite A"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">GST/Tax Registration ID</label>
                <input
                  type="text"
                  name="gstNumber"
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none transition"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Link
                  href="/suppliers"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl px-4 py-2.5 text-xs transition"
                >
                  Cancel
                </Link>
                <SubmitButton
                  loadingText="Saving Supplier..."
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-4 py-2.5 text-xs shadow-md shadow-blue-500/10 transition"
                >
                  Save Supplier
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {action === "edit" && editingSupplier && role !== "STAFF" && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900">Edit Supplier</h2>
              <Link href="/suppliers" className="text-slate-400 hover:text-slate-700 font-semibold text-sm">✕</Link>
            </div>
            <form action={handleEditSupplier.bind(null, supplierId)} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    required
                    defaultValue={editingSupplier.companyName}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Contact Person</label>
                  <input
                    type="text"
                    name="contactPerson"
                    required
                    defaultValue={editingSupplier.contactPerson}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    defaultValue={editingSupplier.email}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={editingSupplier.phone || ""}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none transition"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Address</label>
                <input
                  type="text"
                  name="address"
                  defaultValue={editingSupplier.address || ""}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">GST/Tax Registration ID</label>
                <input
                  type="text"
                  name="gstNumber"
                  defaultValue={editingSupplier.gstNumber || ""}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none transition"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Link
                  href="/suppliers"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl px-4 py-2.5 text-xs transition"
                >
                  Cancel
                </Link>
                <SubmitButton
                  loadingText="Updating Supplier..."
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-4 py-2.5 text-xs shadow-md shadow-blue-500/10 transition"
                >
                  Update Supplier
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
