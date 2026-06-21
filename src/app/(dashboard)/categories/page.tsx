import React from "react";
import { CategoryRepository } from "@/repositories/CategoryRepository";
import { createCategory, updateCategory, deleteCategory } from "@/actions/categoryActions";
import { Plus, Edit2, Trash2, Search, Tag, Eye } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { SubmitButton } from "@/components/SubmitButton";

export const revalidate = 0;

async function handleAddCategory(formData: FormData) {
  "use server";
  const { createCategory } = await import("@/actions/categoryActions");
  const { redirect } = await import("next/navigation");
  const result = await createCategory(null, formData);
  if (!result.error) redirect("/categories");
}

async function handleEditCategory(categoryId: string, formData: FormData) {
  "use server";
  if (!categoryId) return;
  const { updateCategory } = await import("@/actions/categoryActions");
  const { redirect } = await import("next/navigation");
  const result = await updateCategory(categoryId, null, formData);
  if (!result.error) redirect("/categories");
}

async function handleDeleteCategory(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  if (!id) return;
  const { deleteCategory } = await import("@/actions/categoryActions");
  const { redirect } = await import("next/navigation");
  await deleteCategory(id);
  redirect("/categories");
}

export default async function CategoriesPage(props: {
  searchParams: Promise<{ query?: string; action?: string; id?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.query || "";
  const action = searchParams.action || "";
  const categoryId = searchParams.id || "";

  const session = await auth();
  const role = (session?.user as any)?.role || "STAFF";

  const categoryRepo = new CategoryRepository();
  const rawCategories = await categoryRepo.findAll({ query });
  const categories: Record<string, any>[] = JSON.parse(JSON.stringify(rawCategories));

  let editingCategory: Record<string, any> | null = null;
  if (action === "edit" && categoryId) {
    const rawEditing = await categoryRepo.findById(categoryId);
    editingCategory = rawEditing ? JSON.parse(JSON.stringify(rawEditing)) : null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Categories</h1>
          <p className="text-slate-500 text-sm">Organize and classify your inventory catalog items.</p>
        </div>
        {role !== "STAFF" && (
          <Link
            href="/categories?action=add"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-4 py-2.5 shadow-md shadow-blue-500/10 transition flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </Link>
        )}
      </div>

      {/* Search Filter */}
      <form method="GET" action="/categories" className="flex gap-2 w-full max-w-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            name="query"
            defaultValue={query}
            placeholder="Search categories..."
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
        {categories.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-sm">
            No categories found. Try adjusting your search query or add a new category.
          </div>
        ) : (
          categories.map((category) => (
            <div key={String(category._id)} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Tag className="w-4 h-4" />
                    </div>
                    <h3 className="text-slate-900 font-bold text-sm">{category.name}</h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    category.status === "ACTIVE" 
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                      : "bg-slate-50 text-slate-500 border border-slate-150"
                  }`}>
                    {category.status}
                  </span>
                </div>
                <p className="text-slate-500 text-xs line-clamp-2 h-8 leading-relaxed">
                  {category.description || "No description provided."}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 mt-4 pt-3.5">
                <span className="text-[10px] text-slate-400 font-medium">
                  Created {new Date(category.createdAt).toLocaleDateString()}
                </span>
                {role !== "STAFF" ? (
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/categories?action=edit&id=${category._id}`}
                      className="p-1.5 hover:bg-slate-50 border border-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Link>
                     <form action={handleDeleteCategory} className="inline">
                      <input type="hidden" name="id" value={String(category._id)} />
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
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900">Add New Category</h2>
              <Link href="/categories" className="text-slate-400 hover:text-slate-700 font-semibold text-sm">✕</Link>
            </div>
             <form action={handleAddCategory} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Category Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Electronics, Office Supplies"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Write a brief classification details..."
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Status</label>
                <select
                  name="status"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none transition"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Link
                  href="/categories"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl px-4 py-2.5 text-xs transition"
                >
                  Cancel
                </Link>
                <SubmitButton
                  loadingText="Saving Category..."
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-4 py-2.5 text-xs shadow-md shadow-blue-500/10 transition"
                >
                  Save Category
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {action === "edit" && editingCategory && role !== "STAFF" && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900">Edit Category</h2>
              <Link href="/categories" className="text-slate-400 hover:text-slate-700 font-semibold text-sm">✕</Link>
            </div>
             <form action={handleEditCategory.bind(null, categoryId)} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Category Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingCategory.name}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingCategory.description || ""}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Status</label>
                <select
                  name="status"
                  defaultValue={editingCategory.status}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none transition"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Link
                  href="/categories"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl px-4 py-2.5 text-xs transition"
                >
                  Cancel
                </Link>
                <SubmitButton
                  loadingText="Updating Category..."
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-4 py-2.5 text-xs shadow-md shadow-blue-500/10 transition"
                >
                  Update Category
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
