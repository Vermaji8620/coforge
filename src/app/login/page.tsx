/**
 * Enterprise Authentication Page (/login).
 * Features split-screen branding, live agent pipeline value showcase,
 * tabbed sign-in & registration workflows, and one-click demo persona access.
 */
"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileSpreadsheet,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building,
  Briefcase,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("from") || "/";

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("priya.mehta@codeforge.ai");
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Legal Specialist");
  const [department, setDepartment] = useState("Legal Operations");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // One-click quick fill for demo persona
  const handleFillDemoPersona = () => {
    setActiveTab("login");
    setEmail("priya.mehta@codeforge.ai");
    setPassword("password123");
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const endpoint = activeTab === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        activeTab === "login"
          ? { email, password }
          : { name, email, password, role, department };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Please verify credentials.");
      }

      setSuccessMsg(
        activeTab === "login"
          ? "Authentication successful! Redirecting..."
          : "Account created successfully! Redirecting..."
      );

      // Force full reload or window navigation so cookies & middleware recognize session
      setTimeout(() => {
        window.location.href = returnTo;
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0f172a] text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Left Column: Enterprise Product Showcase */}
      <div className="lg:w-1/2 p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] border-b lg:border-b-0 lg:border-r border-indigo-950/60">
        {/* Subtle background glow circle */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-lg tracking-tight">
                  CodeForge
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-semibold text-[11px] border border-indigo-500/30">
                  Runner 2.0
                </span>
              </div>
              <p className="text-xs text-indigo-200/60 font-medium">
                Autonomous Document Operations Platform
              </p>
            </div>
          </div>

          <div className="max-w-md space-y-4">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Enterprise Document Intelligence & Policy Governance
            </h1>
            <p className="text-sm text-slate-300/80 leading-relaxed font-normal">
              Continuous multi-stage AI pipelines that ingest, extract, and audit
              complex commercial agreements against regulatory standards in real time.
            </p>
          </div>
        </div>

        {/* Live Multi-Stage Agent Pipeline Preview Card */}
        <div className="my-8 relative z-10 bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-indigo-500/20 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Live Autonomous Pipeline
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              All 4 agents healthy
            </span>
          </div>

          {/* 4 Agent Pills */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-indigo-400 font-bold text-[11px]">01 OCR</span>
                <span className="text-[10px] text-slate-400">p50 1.8s</span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">99.1% deskew accuracy</p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-indigo-400 font-bold text-[11px]">02 Classify</span>
                <span className="text-[10px] text-slate-400">p50 0.4s</span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">Contract taxonomy tag</p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-indigo-400 font-bold text-[11px]">03 Extract</span>
                <span className="text-[10px] text-slate-400">p50 2.6s</span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">23+ structured fields</p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-indigo-400 font-bold text-[11px]">04 Comply</span>
                <span className="text-[10px] text-slate-400">p50 1.1s</span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">Decision trail & audits</p>
            </div>
          </div>
        </div>

        {/* Footer Metrics & Certifications */}
        <div className="relative z-10 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <div>
              <p className="font-bold text-white text-base leading-none">12,480+</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Docs Audited Daily</p>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div>
              <p className="font-bold text-white text-base leading-none">98.6%</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Field Accuracy</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>SOC 2 Type II · PCI-DSS Compliant</span>
          </div>
        </div>
      </div>

      {/* Right Column: Clean White Authentication Box */}
      <div className="lg:w-1/2 bg-[#f8fafc] text-slate-800 flex items-center justify-center p-6 lg:p-14">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 lg:p-10 border border-slate-200/90 shadow-xl space-y-6">
          {/* Header & Mode Switcher */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>

              {/* Segmented Tab Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("login");
                    setErrorMsg("");
                  }}
                  className={`px-3.5 py-1.5 rounded-lg transition-all ${
                    activeTab === "login"
                      ? "bg-white text-indigo-600 shadow-xs font-bold"
                      : "hover:text-slate-900"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("register");
                    setErrorMsg("");
                  }}
                  className={`px-3.5 py-1.5 rounded-lg transition-all ${
                    activeTab === "register"
                      ? "bg-white text-indigo-600 shadow-xs font-bold"
                      : "hover:text-slate-900"
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {activeTab === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {activeTab === "login"
                ? "Sign in to access contracts, live pipelines, and compliance audit logs."
                : "Register to manage compliance policies and automated document reviews."}
            </p>
          </div>

          {/* Quick 1-Click Demo Persona Banner */}
          <button
            type="button"
            onClick={handleFillDemoPersona}
            className="w-full p-3 rounded-2xl bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200/80 text-left transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                PM
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-indigo-950">
                    Priya Mehta
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100 px-1.5 py-0.2 rounded">
                    Demo Persona
                  </span>
                </div>
                <p className="text-[11px] text-indigo-700/80 font-medium">
                  Ops lead · Legal Operations
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
              Fill &rarr;
            </span>
          </button>

          {/* Status Message Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "register" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Henderson"
                      className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Role
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Department
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                {activeTab === "login" && (
                  <button
                    type="button"
                    onClick={() => alert("To reset password in demo, use password123 or fill demo persona.")}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            {activeTab === "login" && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <label
                  htmlFor="rememberMe"
                  className="text-xs text-slate-600 font-medium cursor-pointer"
                >
                  Keep me signed in for 7 days
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-sm shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>
                    {activeTab === "login" ? "Sign In to CodeForge Runner" : "Create Enterprise Account"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Security Note */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Secured with MongoDB authentication & 256-bit JWT encryption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-slate-300 text-xs">
          Loading CodeForge Runner Authentication...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
