/**
 * Root Application Layout for CodeForge Runner.
 * Manages global shell framing: renders full-page login for unauthenticated users,
 * and responsive persistent navigation with mobile sliding drawer and active session context.
 */
"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, X, UploadCloud, FileSpreadsheet } from "lucide-react";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";

  const [currentUser, setCurrentUser] = useState({
    name: "Priya Mehta",
    role: "Ops lead",
    department: "Legal",
  });
  const [complianceCount, setComplianceCount] = useState(17);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Validate active session and fetch counters
  useEffect(() => {
    async function verifySession() {
      try {
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.user) {
            setCurrentUser(userData.user);
          }
          if (isLoginPage) {
            router.push("/");
          }
        } else {
          if (!isLoginPage) {
            router.push("/login");
          }
        }

        if (!isLoginPage) {
          const compRes = await fetch("/api/compliance");
          if (compRes.ok) {
            const compData = await compRes.json();
            if (compData.counts?.all !== undefined) {
              setComplianceCount(compData.counts.all);
            }
          }
        }
      } catch (err) {
        console.error("Session verification error:", err);
      } finally {
        setIsVerifying(false);
      }
    }

    verifySession();
  }, [pathname, isLoginPage, router]);

  // Dedicated full-page layout for login/registration
  if (isLoginPage) {
    return (
      <html lang="en">
        <head>
          <title>Sign In · CodeForge Runner</title>
          <meta
            name="description"
            content="Sign in to CodeForge Runner autonomous document intelligence platform."
          />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </head>
        <body className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased">
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <title>CodeForge Runner | Enterprise Document Intelligence & Compliance</title>
        <meta
          name="description"
          content="Intelligent document processing, multi-stage agentic pipeline, contract semantic search, and audit trail compliance engine."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased flex flex-col lg:flex-row">
        {/* Mobile Header Bar (< lg) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-slate-900 text-sm">CodeForge</span>
              <span className="text-slate-600 text-xs font-semibold">Runner</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/upload"
              className="p-2 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
              title="Upload documents"
            >
              <UploadCloud className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Responsive Sidebar (Slide-out drawer on mobile/tablet, sticky on desktop) */}
        <Sidebar
          complianceCount={complianceCount}
          user={currentUser}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 w-full px-3 py-3 sm:px-6 sm:py-6 lg:px-8 max-w-7xl mx-auto overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
