"use client";

// Filter bar for the home page: search box, status select and tier buttons. The state lives in the URL,
// so the server page re-queries the database and the filters work together.

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { STATUS_OPTIONS } from "@/components/status-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ALL = "all";
const STATUS_ITEMS = [{ value: ALL, label: "All statuses" }, ...STATUS_OPTIONS];
const TIERS = [
  { value: ALL, label: "All" },
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "cold", label: "Cold" },
];

export function LeadFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");

  // Change one query parameter and keep the others.
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value && value !== ALL) next.set(key, value);
    else next.delete(key);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  // Wait until the user stops typing before searching.
  useEffect(() => {
    if (search === (params.get("q") ?? "")) return;
    const timer = setTimeout(() => setParam("q", search.trim()), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const tier = params.get("tier") ?? ALL;
  const status = params.get("status") ?? ALL;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name, location, property..."
        aria-label="Search leads"
        className="w-full sm:w-72"
      />
      <Select value={status} items={STATUS_ITEMS} onValueChange={(value) => setParam("status", String(value))}>
        <SelectTrigger aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-1">
        {TIERS.map((item) => (
          <Button
            key={item.value}
            type="button"
            size="sm"
            variant={tier === item.value ? "default" : "outline"}
            onClick={() => setParam("tier", item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
