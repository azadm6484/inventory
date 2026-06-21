import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center relative overflow-hidden px-4">
      {/* Background gradients for soft, modern depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-3xl -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-indigo-100/30 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 p-8 relative">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/20 mb-3 text-white">
            E
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Enterprise Inventory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your catalog, stock & settings</p>
        </div>
        {children}
      </div>
    </div>
  );
}
