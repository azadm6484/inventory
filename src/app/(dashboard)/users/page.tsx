import React from "react";
import { UserRepository } from "@/repositories/UserRepository";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Mail, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Calendar, 
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";

export const revalidate = 0;

async function handleAddUser(formData: FormData) {
  "use server";
  const { createUser } = await import("@/actions/userActions");
  const { redirect } = await import("next/navigation");
  
  const result = await createUser(null, formData);
  if (result?.error) {
    redirect(`/users?action=add&error=${encodeURIComponent(result.error)}`);
  }
  redirect("/users?success=" + encodeURIComponent("User created successfully."));
}

async function handleEditUser(userId: string, formData: FormData) {
  "use server";
  if (!userId) return;
  const { updateUser } = await import("@/actions/userActions");
  const { redirect } = await import("next/navigation");
  
  const result = await updateUser(userId, null, formData);
  if (result?.error) {
    redirect(`/users?action=edit&id=${userId}&error=${encodeURIComponent(result.error)}`);
  }
  redirect("/users?success=" + encodeURIComponent("User updated successfully."));
}

async function handleDeleteUser(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  if (!id) return;
  const { deleteUser } = await import("@/actions/userActions");
  const { redirect } = await import("next/navigation");
  
  const result = await deleteUser(id);
  if (result?.error) {
    redirect(`/users?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/users?success=" + encodeURIComponent("User deleted successfully."));
}

export default async function UsersPage(props: {
  searchParams: Promise<{ 
    query?: string; 
    role?: string; 
    status?: string; 
    action?: string; 
    id?: string;
    error?: string;
    success?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.query || "";
  const roleFilter = searchParams.role || "";
  const statusFilter = searchParams.status || "";
  const action = searchParams.action || "";
  const targetId = searchParams.id || "";
  const errorMsg = searchParams.error || "";
  const successMsg = searchParams.success || "";

  const userRepo = new UserRepository();
  const rawUsers = await userRepo.findAll({ 
    query, 
    role: roleFilter || undefined, 
    status: statusFilter || undefined, 
    limit: 100, 
    offset: 0 
  });
  const users: Record<string, any>[] = JSON.parse(JSON.stringify(rawUsers));

  let editingUser: Record<string, any> | null = null;
  if (action === "edit" && targetId) {
    const rawEditing = await userRepo.findById(targetId);
    editingUser = rawEditing ? JSON.parse(JSON.stringify(rawEditing)) : null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Directory</h1>
          <p className="text-slate-500 text-sm">Manage system permissions, active user accounts, and roles (Admin, Manager, Staff).</p>
        </div>
        <Link
          href="/users?action=add"
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-4 py-2.5 shadow-md shadow-blue-500/10 transition flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add New User
        </Link>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2.5 text-sm">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2.5 text-sm">
          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search and Filters */}
      <form method="GET" action="/users" className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            name="query"
            defaultValue={query}
            placeholder="Search users by name or email..."
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 outline-none transition"
          />
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-initial">
            <select
              name="role"
              defaultValue={roleFilter}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-600"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="STAFF">Staff</option>
            </select>
          </div>
          <div className="flex-1 md:flex-initial">
            <select
              name="status"
              defaultValue={statusFilter}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-600"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold rounded-xl px-5 py-2.5 text-sm transition"
          >
            Apply Filters
          </button>
        </div>
      </form>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No users found matching the query.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const roleColors = {
                    ADMIN: "bg-purple-50 text-purple-700 border-purple-100",
                    MANAGER: "bg-blue-50 text-blue-700 border-blue-100",
                    STAFF: "bg-slate-100 text-slate-700 border-slate-200"
                  }[u.role as "ADMIN" | "MANAGER" | "STAFF"] || "bg-slate-50 text-slate-700 border-slate-100";

                  const statusColors = {
                    ACTIVE: "bg-green-50 text-green-700 border-green-100",
                    PENDING: "bg-amber-50 text-amber-700 border-amber-100",
                    INACTIVE: "bg-red-50 text-red-700 border-red-100"
                  }[u.status as "ACTIVE" | "PENDING" | "INACTIVE"] || "bg-slate-50 text-slate-700 border-slate-100";

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-sm text-blue-600 uppercase">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">{u.name}</span>
                            <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" />
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${roleColors}`}>
                          <Shield className="w-3 h-3" />
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${statusColors}`}>
                          {u.status === "ACTIVE" ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/users?action=edit&id=${u._id}`}
                            className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>
                          <form action={handleDeleteUser} className="inline">
                            <input type="hidden" name="id" value={u._id} />
                            <SubmitButton
                              loadingText=""
                              className="p-1.5 hover:bg-red-50 border border-slate-200 rounded-lg text-slate-500 hover:text-red-600 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </SubmitButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {action === "add" && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900">Add New User</h2>
              <Link href="/users" className="text-slate-400 hover:text-slate-700 font-semibold text-sm">✕</Link>
            </div>
            <form action={handleAddUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="e.g. john@company.com"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Temporary Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Min 8 characters"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Role</label>
                  <select
                    name="role"
                    required
                    defaultValue="STAFF"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none transition"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="STAFF">Staff</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Status</label>
                  <select
                    name="status"
                    required
                    defaultValue="ACTIVE"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none transition"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PENDING">Pending</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Link
                  href="/users"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl px-4 py-2.5 text-xs transition"
                >
                  Cancel
                </Link>
                <SubmitButton
                  loadingText="Creating..."
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-4 py-2.5 text-xs shadow-md shadow-blue-500/10 transition"
                >
                  Create User
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {action === "edit" && editingUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900">Edit User Profile</h2>
              <Link href="/users" className="text-slate-400 hover:text-slate-700 font-semibold text-sm">✕</Link>
            </div>
            <form action={handleEditUser.bind(null, targetId)} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingUser.name}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Email Address (Read-only)</label>
                <input
                  type="email"
                  disabled
                  defaultValue={editingUser.email}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-400 outline-none cursor-not-allowed"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Role</label>
                  <select
                    name="role"
                    required
                    defaultValue={editingUser.role}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none transition"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="STAFF">Staff</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Status</label>
                  <select
                    name="status"
                    required
                    defaultValue={editingUser.status}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none transition"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PENDING">Pending</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Link
                  href="/users"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl px-4 py-2.5 text-xs transition"
                >
                  Cancel
                </Link>
                <SubmitButton
                  loadingText="Updating..."
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-4 py-2.5 text-xs shadow-md shadow-blue-500/10 transition"
                >
                  Update User
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
