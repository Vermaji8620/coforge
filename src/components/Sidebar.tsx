/**
 * Application Sidebar Navigation component.
 * Renders brand identity, primary section routes (Dashboard, Upload, Search,
 * Documents, Compliance), dynamic badge notifications, and user persona controls.
 */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  Search,
  FileText,
  ShieldCheck,
  FileSpreadsheet,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  complianceCount?: number;
  user?: {
    name: string;
    role: string;
    department: string;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  complianceCount = 17,
  user = { name: "Priya Mehta", role: "Ops lead", department: "Legal" },
}) => {
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Upload", href: "/upload", icon: Upload },
    { label: "Search", href: "/search", icon: Search },
    { label: "Documents", href: "/documents/northwind", icon: FileText },
    {
      label: "Compliance",
      href: "/compliance",
      icon: ShieldCheck,
      badge: complianceCount > 0 ? complianceCount : undefined,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between h-screen sticky top-0 px-4 py-6 select-none shrink-0 z-30">
      <div>
        {/* Brand Header */}
        <Link href="/" className="flex items-center gap-3 px-2 mb-8 group">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-900 text-base leading-tight tracking-tight">
              CodeForge
            </h1>
            <span className="text-slate-800 text-sm font-semibold tracking-tight">
              Runner
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href) ||
                  (item.label === "Documents" && pathname.startsWith("/documents"));

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#ede9fe] text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-indigo-600" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-600">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Persona Pill */}
      <div className="relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50/80 hover:bg-slate-100/90 border border-slate-100 text-left transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center shrink-0 border border-indigo-200">
            PM
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
              {user.name}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user.role} · {user.department}
            </p>
          </div>
        </button>

        {showUserMenu && (
          <div className="absolute bottom-14 left-0 right-0 bg-white rounded-xl shadow-lg border border-slate-200 p-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <button
              onClick={async () => {
                setShowUserMenu(false);
                try {
                  await fetch("/api/auth/logout", { method: "POST" });
                } catch (e) {
                  console.error(e);
                }
                window.location.href = "/login";
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg text-left transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
