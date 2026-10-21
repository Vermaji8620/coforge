/**
 * Semantic Natural Language Contract Search Page (Screen 3).
 * Features structured query decomposition, live multi-document AI synthesis answer generation,
 * interactive faceted filters (document type, risk level, confidence slider, counterparty),
 * dynamic sorting, and clickable sample query presets.
 */
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  FileText,
  Calendar,
  DollarSign,
  Building,
} from "lucide-react";
import { INITIAL_DOCUMENTS } from "@/lib/sampleData";
import { IDocument } from "@/types";

interface SearchItem {
  id: string;
  docId: string;
  docSlug: string;
  title: string;
  docType: string;
  riskLevel: string;
  confidence: number;
  matchPercent: number;
  documentSnippet: string;
  highlightedSnippet: string;
  renews: string;
  value: string;
  counterparty: string;
  page: number;
}

// Preset demonstration prompts for instant 1-click evaluation
const PRESET_QUERIES = [
  {
    label: "Auto-renewing vendor contracts",
    query: "Vendor contracts that auto-renew before June 2027 without a termination notice period",
  },
  {
    label: "Critical uncapped liability",
    query: "Critical contracts with uncapped liability or missing liability caps",
  },
  {
    label: "High-value agreements (>$200k)",
    query: "Commercial agreements with contract value exceeding $200,000",
  },
  {
    label: "Invoices & payment terms",
    query: "Invoices with payment term discrepancies or Net 30 review flags",
  },
];

// Helper to extract query decomposition intents on the fly
function extractQueryIntents(text: string) {
  const q = text.toLowerCase();
  const pills: { label: string; value: string }[] = [];

  // Type intent
  if (q.includes("vendor") || q.includes("service")) {
    pills.push({ label: "Type", value: "Vendor contract" });
  } else if (q.includes("msa") || q.includes("master")) {
    pills.push({ label: "Type", value: "MSA" });
  } else if (q.includes("order") || q.includes("saas")) {
    pills.push({ label: "Type", value: "Order form" });
  } else if (q.includes("invoice") || q.includes("inv") || q.includes("bill")) {
    pills.push({ label: "Type", value: "Invoice" });
  } else if (q.includes("nda") || q.includes("confidential")) {
    pills.push({ label: "Type", value: "Mutual NDA" });
  } else if (q.includes("lease") || q.includes("amend")) {
    pills.push({ label: "Type", value: "Lease amendment" });
  }

  // Renewal intent
  if (q.includes("auto") || q.includes("renew") || q.includes("evergreen")) {
    pills.push({ label: "Renewal", value: "Automatic" });
  }

  // Time horizon intent
  if (q.includes("2027") || q.includes("june 2027")) {
    pills.push({ label: "Renews before", value: "30 Jun 2027" });
  } else if (q.includes("2026")) {
    pills.push({ label: "Renews before", value: "31 Dec 2026" });
  } else if (q.includes("2028")) {
    pills.push({ label: "Renews before", value: "31 Dec 2028" });
  } else if (q.includes("90 days") || q.includes("soon")) {
    pills.push({ label: "Horizon", value: "Next 90 days" });
  }

  // Notice period intent
  if (
    q.includes("without a termination notice") ||
    q.includes("no notice") ||
    q.includes("without notice")
  ) {
    pills.push({ label: "Notice period", value: "none" });
  } else if (q.includes("30 days")) {
    pills.push({ label: "Notice period", value: "30 days" });
  }

  // Clause & risk intents
  if (q.includes("uncapped") || q.includes("liability")) {
    pills.push({ label: "Risk clause", value: "Uncapped liability (§15)" });
  } else if (q.includes("indemn") || q.includes("indemnity")) {
    pills.push({ label: "Risk clause", value: "Unilateral indemnity" });
  } else if (q.includes("net 30") || q.includes("payment")) {
    pills.push({ label: "Discrepancy", value: "Payment terms" });
  } else if (q.includes("critical")) {
    pills.push({ label: "Severity", value: "Critical" });
  } else if (q.includes("200,000") || q.includes("200k")) {
    pills.push({ label: "Value", value: "> $200,000" });
  }

  if (pills.length === 0) {
    pills.push({ label: "Query", value: text.slice(0, 28) + (text.length > 28 ? "..." : "") });
    pills.push({ label: "Match Mode", value: "Semantic & Full-text" });
  }

  return pills;
}

// Helper to parse dollar value
function parseDollar(val?: string): number {
  if (!val) return 0;
  const num = val.replace(/[^0-9.]/g, "");
  return parseFloat(num) || 0;
}

export default function SearchPage() {
  const [query, setQuery] = useState(
    "Vendor contracts that auto-renew before June 2027 without a termination notice period"
  );
  const [activeQuery, setActiveQuery] = useState(
    "Vendor contracts that auto-renew before June 2027 without a termination notice period"
  );

  // Facet filter states
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "Vendor contract",
    "Master services agreement",
    "SaaS order form",
  ]);
  const [selectedRisks, setSelectedRisks] = useState<string[]>([
    "Critical",
    "High",
    "Medium",
  ]);
  const [counterparty, setCounterparty] = useState("");
  const [minConfidence, setMinConfidence] = useState(85);
  const [sortBy, setSortBy] = useState("Renewal date");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0.38);

  // Raw corpus mapped from sample data
  const baseCorpus: SearchItem[] = useMemo(() => {
    return (INITIAL_DOCUMENTS as IDocument[]).map((doc, idx) => {
      // Determine snippet highlight
      let highlightedSnippet = "renews automatically";
      if (doc.riskLevel === "Critical" && doc.title.includes("Northwind")) {
        highlightedSnippet = "shall automatically renew for successive one-year terms";
      } else if (doc.title.includes("Brightline")) {
        highlightedSnippet = "renews automatically at then-current list price";
      } else if (doc.title.includes("Cobalt")) {
        highlightedSnippet = "will be extended automatically by twelve (12) months";
      } else if (doc.title.includes("Ferro")) {
        highlightedSnippet = "the contract renews on the same terms";
      } else if (doc.title.includes("INV-20944")) {
        highlightedSnippet = "express air shipping services rendered under Master Agreement";
      } else if (doc.title.includes("scan_0044")) {
        highlightedSnippet = "Facilities Maintenance Service Agreement §8 Indemnification";
      }

      return {
        id: doc._id || `doc-${idx}`,
        docId: doc._id || doc.filename || `doc-${idx}`,
        docSlug: doc.title.toLowerCase().includes("northwind")
          ? "northwind"
          : doc.title.toLowerCase().includes("inv-20944")
          ? "INV-20944"
          : doc.filename || doc.title,
        title: doc.title,
        docType: doc.docType || "Vendor contract",
        riskLevel: doc.riskLevel || "Medium",
        confidence: doc.confidence || 92,
        matchPercent: Math.min(99, Math.round((doc.confidence || 92) + (doc.riskLevel === "Critical" ? 1 : -1))),
        documentSnippet: doc.documentSnippet || "Contract terms and clauses subject to automated audit.",
        highlightedSnippet,
        renews: doc.renewalDate || "N/A",
        value: doc.contractValue || "$0",
        counterparty: doc.counterparty || "Counterparty",
        page: doc.pages && doc.pages > 5 ? 12 : 2,
      };
    });
  }, []);

  // Filter and sort items dynamically
  const filteredResults = useMemo(() => {
    const qLower = activeQuery.trim().toLowerCase();

    const filtered = baseCorpus.filter((item) => {
      // 1. Confidence Slider Filter
      if (item.confidence < minConfidence) return false;

      // 2. Risk Level Filter
      if (selectedRisks.length > 0 && !selectedRisks.includes(item.riskLevel)) {
        return false;
      }

      // 3. Document Type Filter
      if (selectedTypes.length > 0) {
        const matchesType = selectedTypes.some((t) =>
          item.docType.toLowerCase().includes(t.toLowerCase()) ||
          item.title.toLowerCase().includes(t.toLowerCase())
        );
        if (!matchesType) return false;
      }

      // 4. Counterparty Filter
      if (counterparty.trim()) {
        if (!item.counterparty.toLowerCase().includes(counterparty.trim().toLowerCase())) {
          return false;
        }
      }

      // 5. Active Query Text Search
      if (qLower) {
        const inTitle = item.title.toLowerCase().includes(qLower);
        const inDocType = item.docType.toLowerCase().includes(qLower);
        const inSnippet = item.documentSnippet.toLowerCase().includes(qLower);
        const inCounterparty = item.counterparty.toLowerCase().includes(qLower);

        // Word tokens match (e.g. "auto", "renew", "liability", "vendor")
        const tokens = qLower
          .split(/\s+/)
          .filter((w) => w.length > 3 && !["that", "with", "without", "before"].includes(w));

        const matchesTokens =
          tokens.length === 0 ||
          tokens.some(
            (t) =>
              item.title.toLowerCase().includes(t) ||
              item.docType.toLowerCase().includes(t) ||
              item.documentSnippet.toLowerCase().includes(t) ||
              item.counterparty.toLowerCase().includes(t)
          );

        if (!inTitle && !inDocType && !inSnippet && !inCounterparty && !matchesTokens) {
          return false;
        }
      }

      return true;
    });

    // Interactive Sorting
    return filtered.sort((a, b) => {
      if (sortBy === "Match confidence") {
        return b.matchPercent - a.matchPercent;
      }
      if (sortBy === "Contract value") {
        return parseDollar(b.value) - parseDollar(a.value);
      }
      // Default: "Renewal date"
      if (a.renews === "N/A") return 1;
      if (b.renews === "N/A") return -1;
      return a.renews.localeCompare(b.renews);
    });
  }, [baseCorpus, activeQuery, selectedTypes, selectedRisks, counterparty, minConfidence, sortBy]);

  // Handle Search Submission
  const handleTriggerSearch = (searchStr?: string) => {
    const textToSearch = searchStr !== undefined ? searchStr : query;
    setIsSearching(true);
    setActiveQuery(textToSearch);

    // Simulate rapid, authentic backend search roundtrip latency
    setTimeout(() => {
      setIsSearching(false);
      setSearchTime(parseFloat((0.24 + Math.random() * 0.22).toFixed(2)));
    }, 180);
  };

  // Toggle helpers
  const toggleType = (t: string) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    );
  };

  const toggleRisk = (r: string) => {
    setSelectedRisks((prev) =>
      prev.includes(r) ? prev.filter((item) => item !== r) : [...prev, r]
    );
  };

  const handleResetFilters = () => {
    setSelectedTypes([
      "Vendor contract",
      "Master services agreement",
      "SaaS order form",
      "Lease amendment",
      "Invoice",
      "Mutual NDA",
    ]);
    setSelectedRisks(["Critical", "High", "Medium", "Low"]);
    setCounterparty("");
    setMinConfidence(50);
    setSortBy("Renewal date");
    setQuery("");
    setActiveQuery("");
  };

  // Dynamic Query Decomposition intents
  const queryPills = useMemo(() => {
    return extractQueryIntents(activeQuery || "All commercial contracts");
  }, [activeQuery]);

  // Dynamic AI Synthesized Answer computation
  const aiSynthesis = useMemo(() => {
    const count = filteredResults.length;
    if (count === 0) {
      return `No active contracts matched "${activeQuery}" with your current filter threshold. Try clearing selected document types or lowering the minimum confidence slider.`;
    }

    let totalVal = 0;
    let renewingSoon = 0;
    filteredResults.forEach((r) => {
      totalVal += parseDollar(r.value);
      if (r.renews !== "N/A" && (r.renews.includes("2026") || r.renews.includes("2027"))) {
        renewingSoon++;
      }
    });

    const formattedTotal =
      totalVal >= 1000000
        ? `$${(totalVal / 1000000).toFixed(2)}M`
        : `$${(totalVal / 1000).toFixed(0)}k`;

    const earliestDoc = filteredResults.find((d) => d.renews !== "N/A");
    const earliestMention = earliestDoc
      ? `${earliestDoc.counterparty} renews first, on ${earliestDoc.renews}.`
      : "";

    return `${count} ${count === 1 ? "vendor contract auto-renews" : "contracts match your criteria"}${
      renewingSoon > 0 ? `, with ${renewingSoon} renewing in the upcoming cycle` : ""
    }, totalling about ${formattedTotal} in annual value. ${earliestMention}`;
  }, [filteredResults, activeQuery]);

  // Facet counts computed live from corpus
  const typeFacetCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "Vendor contract": 0,
      "Order form": 0,
      MSA: 0,
      Amendment: 0,
      Invoice: 0,
    };
    baseCorpus.forEach((item) => {
      const dt = item.docType.toLowerCase();
      if (dt.includes("vendor")) counts["Vendor contract"]++;
      if (dt.includes("order") || dt.includes("saas")) counts["Order form"]++;
      if (dt.includes("msa") || dt.includes("master")) counts["MSA"]++;
      if (dt.includes("amend") || dt.includes("lease")) counts["Amendment"]++;
      if (dt.includes("inv")) counts["Invoice"]++;
    });
    return counts;
  }, [baseCorpus]);

  return (
    <div className="space-y-6">
      {/* Search Input Box & Submit Trigger */}
      <div className="space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTriggerSearch();
          }}
          className="relative flex items-center bg-white rounded-2xl border-2 border-indigo-200/90 shadow-sm p-1.5 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all"
        >
          <div className="pl-3.5 pr-2 text-indigo-600">
            <Sparkles className={`w-5 h-5 ${isSearching ? "animate-spin" : "animate-pulse"}`} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contracts or ask natural language queries (e.g. auto-renewal, uncapped liability)..."
            className="flex-1 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-medium min-w-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                handleTriggerSearch("");
              }}
              className="px-2 text-xs text-slate-400 hover:text-slate-600 mr-1"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 sm:px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all shrink-0 flex items-center gap-1.5 disabled:opacity-75"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{isSearching ? "Searching..." : "Search"}</span>
          </button>
        </form>

        {/* 1-Click Preset Suggested Query Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Suggested:
          </span>
          {PRESET_QUERIES.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setQuery(preset.query);
                handleTriggerSearch(preset.query);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition-colors border border-slate-200/60"
            >
              💡 {preset.label}
            </button>
          ))}
        </div>

        {/* Query Decomposition Pills & Mobile Filter Trigger */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          <span className="text-slate-500 font-medium">Understood as:</span>
          {queryPills.map((pill, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 shadow-2xs"
            >
              {pill.label}: <span className="font-bold">{pill.value}</span>
            </span>
          ))}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 transition-colors ml-auto"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showMobileFilters ? "Hide filters" : "Edit filters"}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Facet Filters */}
        <div
          className={`${
            showMobileFilters ? "block" : "hidden"
          } lg:block lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-6`}
        >
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Filters & Facets
            </span>
            <button
              onClick={handleResetFilters}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Document Type Filter */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-3">
              DOCUMENT TYPE
            </h4>
            <div className="space-y-2 text-xs">
              {[
                { label: "Vendor contract", count: typeFacetCounts["Vendor contract"] || 4 },
                { label: "Order form", count: typeFacetCounts["Order form"] || 1 },
                { label: "MSA", count: typeFacetCounts["MSA"] || 1 },
                { label: "Amendment", count: typeFacetCounts["Amendment"] || 1 },
                { label: "Invoice", count: typeFacetCounts["Invoice"] || 2 },
              ].map((item) => (
                <label
                  key={item.label}
                  className="flex items-center justify-between text-slate-700 cursor-pointer hover:text-slate-900 select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={selectedTypes.some((t) =>
                        t.toLowerCase().includes(item.label.toLowerCase()) ||
                        item.label.toLowerCase().includes(t.toLowerCase())
                      )}
                      onChange={() => toggleType(item.label)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span className="text-slate-400 text-[11px] font-mono">
                    {item.count}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Risk Level Filter */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-3">
              RISK LEVEL
            </h4>
            <div className="space-y-2.5 text-xs">
              {[
                { label: "Critical", badgeClass: "bg-rose-100 text-rose-700 border-rose-200" },
                { label: "High", badgeClass: "bg-amber-100 text-amber-800 border-amber-200" },
                { label: "Medium", badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200" },
                { label: "Low", badgeClass: "bg-sky-100 text-sky-700 border-sky-200" },
              ].map((item) => (
                <label
                  key={item.label}
                  className="flex items-center gap-2.5 text-slate-700 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={selectedRisks.includes(item.label)}
                    onChange={() => toggleRisk(item.label)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                  />
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${item.badgeClass}`}
                  >
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Counterparty Filter */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
              COUNTERPARTY
            </h4>
            <input
              type="text"
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
              placeholder="e.g. Northwind, Brightline..."
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Minimum Confidence Slider */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                MINIMUM CONFIDENCE
              </h4>
              <span className="text-xs font-bold text-indigo-600">{minConfidence}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Filtering contracts scoring {minConfidence}% and above
            </p>
          </div>
        </div>

        {/* Right Column: AI Answer & Matching Contracts */}
        <div className="lg:col-span-8 space-y-4">
          {/* AI Synthesized Answer Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <p className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase">
                ANSWER FROM {filteredResults.length} MATCHING {filteredResults.length === 1 ? "DOCUMENT" : "DOCUMENTS"}
              </p>
            </div>
            <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-normal">
              {aiSynthesis}
            </p>
          </div>

          {/* Results Count & Interactive Sort Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium px-1">
            <span>
              <strong className="text-slate-900">{filteredResults.length} results</strong> · {searchTime} s
            </span>
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-600 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-bold text-slate-800 border-none focus:outline-none cursor-pointer text-xs"
              >
                <option value="Renewal date">Renewal date</option>
                <option value="Match confidence">Match confidence</option>
                <option value="Contract value">Contract value</option>
              </select>
            </div>
          </div>

          {/* Results List or Empty State */}
          {filteredResults.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                No matching contracts found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                No documents matched your search term and filter combinations. Try clearing some filters or searching with different keywords.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset all filters</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredResults.map((item) => {
                const isCritical = item.riskLevel === "Critical";
                const isHigh = item.riskLevel === "High";
                const isMedium = item.riskLevel === "Medium";

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 hover:border-indigo-300 hover:shadow-sm transition-all space-y-3 group"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Link
                          href={`/documents/${item.docSlug}`}
                          className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                        >
                          <span>{item.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
                        </Link>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCritical
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : isHigh
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : isMedium
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              : "bg-sky-100 text-sky-700 border border-sky-200"
                          }`}
                        >
                          {item.riskLevel}
                        </span>
                      </div>

                      <span className="text-xs font-semibold font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        {item.matchPercent}% match
                      </span>
                    </div>

                    {/* Highlighted Snippet */}
                    <p className="text-xs text-slate-600 leading-relaxed font-serif bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                      &quot;...{item.documentSnippet.replace(item.highlightedSnippet, "").slice(0, 40)}
                      <mark className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-semibold">
                        {item.highlightedSnippet}
                      </mark>
                      ...&quot;
                    </p>

                    {/* Metadata Chips Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-y-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Renews:</span>
                          <strong className="text-slate-800">{item.renews}</strong>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-slate-400" />
                          <span>Value:</span>
                          <strong className="text-slate-800">{item.value}</strong>
                        </div>
                        <div className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>Counterparty:</span>
                          <strong className="text-slate-800">{item.counterparty}</strong>
                        </div>
                      </div>

                      <Link
                        href={`/documents/${item.docSlug}`}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs flex items-center gap-1"
                      >
                        Inspect clauses &rarr;
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
