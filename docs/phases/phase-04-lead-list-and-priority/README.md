# Phase 4: Lead list and prioritization

Covers core requirement 4.

## Goal
The home page is a ranked list of all leads, grouped by hot, warm and cold, scannable in seconds.

## Build steps
1. `GET /api/leads`: uses `listLeads` with optional `tier`, `status` and `q` (search name, location, property) filters. Sort order from ARCHITECTURE.md section 6.
2. `components/lead-card.tsx`: one compact row per lead
   - Tier badge + score
   - Name, location, property requirement (truncated)
   - Budget and timeline as small chips
   - Next action (1 line, truncated)
   - Follow-up chip: "Overdue 2d" (red), "Due today" (amber), "In 3d" (grey), from `next_follow_up_at`
   - Status pill
   - Click opens the lead page
3. `components/lead-list.tsx`: three sections Hot, Warm, Cold with counts; a "Not analyzed" section for null analysis. Filter bar: search box, status select, tier toggle.
4. `app/page.tsx`: server component. Top area reserved for the Today panel (Phase 9). Below it, the lead list. A "New lead" button top right.
5. Status change: small select on the lead page header calls `PATCH /api/leads/[id]` and adds a `status_change` event. Won and lost leads drop to a collapsed "Closed" section on the list.
6. Empty state: "No leads yet. Add one or load demo data." with a button calling `POST /api/demo/reset` (route built in Phase 10; button can be hidden until then).

## Done when
- [ ] 10 leads show grouped and in the right order
- [ ] Search and filters work together
- [ ] An overdue warm lead appears above a non-overdue hot lead (overdue first rule)
- [ ] List renders well on a laptop and readable on mobile width

## Interview talking point
"Overdue follow-ups sort above everything, even a new hot lead. A promised callback that's missed costs more trust than a new lead waiting an hour."
