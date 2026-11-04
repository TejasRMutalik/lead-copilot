"use client";

// Dropdown on the lead page that changes the lead's status (PATCH /api/leads/[id]).

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LeadStatus } from "@/types";

export const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "negotiating", label: "Negotiating" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export function StatusSelect({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function change(next: LeadStatus) {
    if (next === status) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json();
      if (json.ok) router.refresh();
      else toast.error(json.error?.message ?? "Could not change the status.");
    } catch {
      toast.error("Could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Select
      value={status}
      items={STATUS_OPTIONS}
      onValueChange={(value) => change(value as LeadStatus)}
      disabled={saving}
    >
      <SelectTrigger size="sm" aria-label="Lead status">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
