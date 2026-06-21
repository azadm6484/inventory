"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logoutUser } from "@/actions/authActions";
import { 
  LayoutDashboard, 
  Home,
  Package, 
  Tags, 
  Truck, 
  History, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X
} from "lucide-react";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = React.useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home, roles: ["ADMIN", "MANAGER", "STAFF"] },
    { name: "Products", href: "/products", icon: Package, roles: ["ADMIN", "MANAGER", "STAFF"] },
    { name: "Categories", href: "/categories", icon: Tags, roles: ["ADMIN", "MANAGER", "STAFF"] },
    { name: "Suppliers", href: "/suppliers", icon: Truck, roles: ["ADMIN", "MANAGER", "STAFF"] },
    { name: "Inventory", href: "/inventory", icon: History, roles: ["ADMIN", "MANAGER", "STAFF"] },
    { name: "User Directory", href: "/users", icon: Users, roles: ["ADMIN"] },
    { name: "Settings", href: "/settings", icon: Settings, roles: ["ADMIN"] },
  ];

  const handleLogout = () => {
    startTransition(async () => {
      await logoutUser();
    });
  };

  const allowedNav = navigation.filter((item) => item.roles.includes(user.role));

  return (
    <>
      {/* Mobile menu toggle */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between w-full sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Image src="/inventory.png" alt="Logo" width={32} height={32} className="rounded-lg object-contain" />
          <span className="text-slate-800 font-bold text-sm tracking-wide">Enterprise Inventory</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-500 hover:text-slate-800 transition p-1 rounded-lg hover:bg-slate-100"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar background overlay for mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* Sidebar main body */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 lg:sticky lg:h-screen w-64 bg-white border-r border-slate-200 flex flex-col justify-between
        transform ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-200 ease-in-out
      `}>
        {/* Upper brand section */}
        <div className="flex flex-col">
          <div className="px-6 py-6 border-b border-slate-200 flex items-center gap-3">
            <Image
              src="/inventory.png"
              alt="Enterprise Inventory Logo"
              width={40}
              height={40}
              className="rounded-xl object-contain"
            />
            <div>
              <h1 className="text-slate-800 font-bold text-base tracking-wide leading-5">Enterprise</h1>
              <p className="text-blue-600 text-xs font-semibold">Inventory SaaS</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-4 py-6 space-y-1 flex-1">
            {allowedNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition group
                    ${isActive 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" 
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-500"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Lower profile section */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3 px-2 py-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-sm text-blue-600 uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-slate-800 text-sm font-semibold truncate leading-4">{user.name}</p>
              <span className="text-blue-600 font-bold text-[10px] tracking-widest uppercase">
                {user.role}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600 hover:bg-red-50 transition outline-none text-xs font-semibold"
          >
            <LogOut className="w-4 h-4" />
            {isPending ? "Logging Out..." : "Sign Out"}
          </button>
        </div>
      </aside>
    </>
  );
}
