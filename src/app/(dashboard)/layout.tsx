import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import Sidebar from "@/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const user = {
    name: session.user.name || "Enterprise User",
    email: session.user.email || "",
    role: (session.user as any).role || "STAFF",
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 text-slate-800">
      <Sidebar user={user} />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
