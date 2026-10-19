/**
 * Header Topbar component for CodeForge Runner.
 * Displays contextual page headers, current workspace date indicators,
 * global document inquiry search input, and quick file ingestion triggers.
 */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UploadCloud } from "lucide-react";
import Link from "next/link";

interface TopbarProps {
  title?: string;
  subtitle?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  title = "Dashboard",
  subtitle = "Tuesday, 13 October · all workspaces",
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 pt-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Global Query Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ask about any document..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 shadow-sm transition-all"
          />
        </form>

        {/* Upload Action Button */}
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm shadow-indigo-200"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload documents</span>
        </Link>
      </div>
    </div>
  );
};
