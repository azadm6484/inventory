"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Filter } from "lucide-react";
import Link from "next/link";

interface CategoryOption {
  _id: any;
  name: string;
}

interface ProductFiltersProps {
  categories: CategoryOption[];
  initialQuery?: string;
  initialCategoryId?: string;
  initialStatus?: string;
}

export function ProductFilters({
  categories,
  initialQuery = "",
  initialCategoryId = "",
  initialStatus = "",
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const isFirstRender = useRef(true);

  // Helper to construct URL with updated query parameters
  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Always reset page to 1 when filters change
    params.delete("page");

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  };

  // Debounce search query input
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const delayDebounce = setTimeout(() => {
      updateParams({ query });
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateParams({ categoryId: e.target.value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateParams({ status: e.target.value });
  };

  const handleClear = () => {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("query");
    params.delete("categoryId");
    params.delete("status");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const hasActiveFilters = initialQuery || initialCategoryId || initialStatus;

  return (
    <div className="flex flex-wrap gap-2 w-full">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, SKU, barcode..."
          className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 outline-none transition"
        />
      </div>

      <div className="relative">
        <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <select
          value={initialCategoryId}
          onChange={handleCategoryChange}
          className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 outline-none transition appearance-none cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={String(c._id)} value={String(c._id)}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <select
        value={initialStatus}
        onChange={handleStatusChange}
        className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none transition appearance-none cursor-pointer"
      >
        <option value="">All Statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="DRAFT">Draft</option>
        <option value="ARCHIVED">Archived</option>
      </select>

      {hasActiveFilters && (
        <button
          onClick={handleClear}
          className="bg-white border border-slate-200 text-slate-500 hover:text-slate-800 font-semibold rounded-xl px-4 py-2.5 text-sm transition"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
