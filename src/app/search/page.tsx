/**
 * Semantic Natural Language Contract Search Page (Screen 3).
 * Features structured query decomposition, multi-document AI synthesis answer generation,
 * faceted filters (document type, risk level, confidence), and highlighted clause matches.
 */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState(
    "Vendor contracts that auto-renew before June 2027 without a termination notice period"
  );
  const [counterparty, setCounterparty] = useState("");
  const [minConfidence, setMinConfidence] = useState(85);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["Vendor contract"]);
  const [selectedRisks, setSelectedRisks] = useState<string[]>(["Critical", "High", "Medium"]);
  const [sortBy, setSortBy] = useState("Renewal date");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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

  const results = [
    {
      id: "res-1",
      title: "MSA – Northwind Logistics",
      riskLevel: "Critical",
      matchPercent: 97,
      snippetPrefix: "...This Agreement ",
      highlightedSnippet: "shall automatically renew for successive one-year terms",
      snippetSuffix: " unless terminated in accordance with Section 14...",
      renews: "1 Dec 2026",
      value: "$480,000",
      counterparty: "Northwind Logistics",
      page: 12,
      docId: "northwind",
    },
    {
      id: "res-2",
      title: "Order form – Brightline Analytics",
      riskLevel: "High",
      matchPercent: 94,
      snippetPrefix: "...Subscription term ",
      highlightedSnippet: "renews automatically at then-current list price",
      snippetSuffix: "; no notice requirement applies...",
      renews: "15 Jan 2027",
      value: "$312,000",
      counterparty: "Brightline",
      page: 2,
      docId: "brightline",
    },
    {
      id: "res-3",
      title: "Vendor agreement – Cobalt Facilities",
      riskLevel: "High",
      matchPercent: 91,
      snippetPrefix: "...The term ",
      highlightedSnippet: "will be extended automatically by twelve (12) months",
      snippetSuffix: " on each anniversary...",
      renews: "28 Feb 2027",
      value: "$226,500",
      counterparty: "Cobalt Facilities",
      page: 4,
      docId: "cobalt",
    },
    {
      id: "res-4",
      title: "Services contract – Ferro Print Co.",
      riskLevel: "Medium",
      matchPercent: 88,
      snippetPrefix: "...Unless either party objects, ",
      highlightedSnippet: "the contract renews on the same terms",
      snippetSuffix: " for a further period of one year...",
      renews: "3 Apr 2027",
      value: "$94,000",
      counterparty: "Ferro Print Co.",
      page: 7,
      docId: "ferro",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Search Input Box */}
      <div className="space-y-3">
        <div className="relative flex items-center bg-white rounded-2xl border-2 border-indigo-200/90 shadow-sm p-1.5 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
          <div className="pl-3.5 pr-2 text-indigo-600">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contracts or ask natural language queries..."
            className="flex-1 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-medium min-w-0"
          />
          <button className="px-4 sm:px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all shrink-0">
            Search
          </button>
        </div>

        {/* Query Decomposition Pills & Mobile Filter Trigger */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Understood as:</span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
            Type: <span className="font-bold">Vendor contract</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
            Renewal: <span className="font-bold">Automatic</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
            Renews before <span className="font-bold">30 Jun 2027</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
            Notice period: <span className="font-bold">none</span>
          </span>
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showMobileFilters ? "Hide filters" : "Edit filters"}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Facet Filters (Collapsible on mobile/tablet, fixed column on desktop) */}
        <div className={`${showMobileFilters ? "block" : "hidden"} lg:block lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-6`}>
          {/* Document Type */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-3">
              DOCUMENT TYPE
            </h4>
            <div className="space-y-2 text-xs">
              {[
                { label: "Vendor contract", count: 14 },
                { label: "Order form", count: 9 },
                { label: "MSA", count: 6 },
                { label: "Amendment", count: 3 },
              ].map((item) => (
                <label
                  key={item.label}
                  className="flex items-center justify-between text-slate-700 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(item.label)}
                      onChange={() => toggleType(item.label)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
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

          {/* Risk Level */}
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
                  className="flex items-center gap-2.5 text-slate-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedRisks.includes(item.label)}
                    onChange={() => toggleRisk(item.label)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
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
              placeholder="Any"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Minimum Confidence Slider */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                MINIMUM CONFIDENCE
              </h4>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-600 font-medium mt-1">
              {minConfidence}% and above
            </p>
          </div>
        </div>

        {/* Right Column: AI Answer & Matching Contracts */}
        <div className="lg:col-span-8 space-y-4">
          {/* AI Synthesized Answer Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase mb-2">
              ANSWER FROM 14 DOCUMENTS
            </p>
            <p className="text-xs text-slate-700 leading-relaxed font-normal">
              14 vendor contracts auto-renew before 30 June 2027 with no notice period.{" "}
              <span className="font-bold text-slate-900">
                4 renew in the next 90 days
              </span>
              , totalling about $1.2M in annual value. Northwind Logistics renews first, on 1 December 2026.
            </p>
          </div>

          {/* Results Count & Sort Header */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span>
              <strong className="text-slate-800">14 results</strong> · 0.38 s
            </span>
            <div className="flex items-center gap-1.5">
              <span>Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 border-none focus:outline-none cursor-pointer"
              >
                <option>Renewal date</option>
                <option>Match confidence</option>
                <option>Contract value</option>
              </select>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-3.5">
            {results.map((item) => {
              const isCritical = item.riskLevel === "Critical";
              const isHigh = item.riskLevel === "High";

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-slate-200 transition-all shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Link
                        href={`/documents/${item.docId}`}
                        className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors"
                      >
                        {item.title}
                      </Link>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isCritical
                            ? "bg-rose-100 text-rose-700"
                            : isHigh
                            ? "bg-amber-100 text-amber-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {item.riskLevel}
                      </span>
                    </div>

                    <span className="text-xs font-semibold text-slate-500">
                      {item.matchPercent}% match
                    </span>
                  </div>

                  {/* Highlighted Snippet */}
                  <p className="text-xs text-slate-600 leading-relaxed font-serif">
                    {item.snippetPrefix}
                    <mark className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-medium">
                      {item.highlightedSnippet}
                    </mark>
                    {item.snippetSuffix}
                  </p>

                  {/* Metadata Chips Footer */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-2 border-t border-slate-50">
                    <div>
                      Renews{" "}
                      <strong className="text-slate-800">{item.renews}</strong>
                    </div>
                    <div>
                      Value{" "}
                      <strong className="text-slate-800">{item.value}</strong>
                    </div>
                    <div>
                      Counterparty{" "}
                      <strong className="text-slate-800">{item.counterparty}</strong>
                    </div>
                    <div>
                      Page{" "}
                      <strong className="text-slate-800">{item.page}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
