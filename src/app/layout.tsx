/**
 * Root Application Layout for CodeForge Runner.
 * Manages global shell framing: renders full-page login for unauthenticated users,
 * and persistent sidebar navigation with active session context for dashboard routes.
 */
"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
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
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="flex min-h-screen bg-[#f8fafc] text-slate-800 antialiased">
        <Sidebar
          complianceCount={complianceCount}
          user={currentUser}
        />

        <main className="flex-1 min-w-0 px-6 py-6 lg:px-8 max-w-7xl mx-auto overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
