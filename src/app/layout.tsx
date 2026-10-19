/**
 * Root Application Layout for CodeForge Runner.
 * Assembles persistent sidebar navigation, top-level layout grid,
 * interactive authentication modal context, and dynamic session states.
 */
"use client";

import React, { useState, useEffect } from "react";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { AuthModal } from "@/components/AuthModal";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState({
    name: "Priya Mehta",
    role: "Ops lead",
    department: "Legal",
  });
  const [complianceCount, setComplianceCount] = useState(17);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Fetch initial profile and compliance counters
  useEffect(() => {
    async function loadInitialData() {
      try {
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.user) {
            setCurrentUser(userData.user);
          }
        }

        const compRes = await fetch("/api/compliance");
        if (compRes.ok) {
          const compData = await compRes.json();
          if (compData.counts?.all) {
            setComplianceCount(compData.counts.all);
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    }
    loadInitialData();
  }, []);

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
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        <main className="flex-1 min-w-0 px-6 py-6 lg:px-8 max-w-7xl mx-auto overflow-y-auto">
          {children}
        </main>

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={(user) => {
            setCurrentUser(user);
          }}
        />
      </body>
    </html>
  );
}
