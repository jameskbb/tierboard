# Tierboard

## What This Is

Tierboard is a fast, polished, free tier-ranking web app that runs entirely in the browser and deploys as a static site on GitHub Pages. It is built for spontaneous group use — a team at lunch saying "let's rank every pizza place in town" should be able to open the site, paste a list, and start dragging items into S/A/B/C/D/F within 30 seconds, without anyone stopping the conversation to figure out the software. It is not a TierMaker clone: it is what a tier-ranking app should feel like if designed today — keyboard-first, mobile-friendly, visually distinctive, and full of small group features (quick rank, random pick, voting, hot takes, comparison mode).

## Core Value

Someone can open Tierboard during lunch and be ranking a pasted list of pizza places within 30 seconds — on a laptop, TV, or phone — with no login, no backend, and no confusion.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Tier board with default S/A/B/C/D/F tiers, Unranked tray, drag-and-drop between/within tiers and tier reordering
- [ ] Lightning-fast item entry: single (Enter-to-add), bulk paste (newlines or commas), duplicate detection, fully keyboard driven
- [ ] Rich items: name, subtitle, emoji, image (URL or local upload in IndexedDB), accent color, notes, URL, hot take
- [ ] Lightweight item editing (rename, emoji, image, notes, duplicate, delete, move to tier, return to Unranked)
- [ ] Tier customization: rename, recolor, add, delete (items → Unranked by default), reorder, duplicate, reset, presets
- [ ] Autosave + multiple boards with a home/board picker (open, rename, duplicate, delete, preview)
- [ ] Real undo/redo for all board mutations with Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z
- [ ] Quick Rank mode (big tier buttons, 1–9 keys) — ranking never requires dragging
- [ ] Presentation / Group mode (big type, dark, fullscreen, add + random access, DnD still works)
- [ ] Share links: compressed board state in the URL hash, opened as a temporary board until "Save to My Boards"
- [ ] JSON import/export with schemaVersion + migrations; CSV export; CSV/text import
- [ ] PNG export (normal + high-res) from a dedicated render path, copy-image-to-clipboard, optional branding
- [ ] Random item picker with selector animation; random debate; tie breaker
- [ ] Local voting (tier tallies + up/down) around one shared screen, architected for future multiplayer
- [ ] Pairwise comparison mode producing a suggested tier distribution
- [ ] Hot takes with notes, stats panel, search, command palette, shortcuts panel
- [ ] Templates, light/dark/system theme, board themes (Classic, Neon, Minimal, Retro, Arcade)
- [ ] Responsive design built intentionally for phones (tap-to-rank sheet, long-press drag, scrollable rows)
- [ ] Accessibility: semantic HTML, keyboard navigation, focus states, ARIA, reduced motion
- [ ] GitHub Pages deployment via GitHub Actions (typecheck → test → build → deploy), subpath-safe
- [ ] Polished public README with image headers and architecture/roadmap docs

### Out of Scope

- Backend / accounts / login — core app must be static and work on GitHub Pages
- Live multiplayer rooms — v2; this version only defines clean interfaces (board repository, share transport, vote source) so Supabase/Firebase/WebSockets can be added later
- AI-based ranking — comparison mode uses a simple pairwise (binary insertion) algorithm by design
- Embedding uploaded images in share links — too large for URLs; users are told and offered JSON/PNG export instead

## Context

- Greenfield repo `jameskbb/tierboard` (GitHub), deployed at `https://jameskbb.github.io/tierboard/`.
- Benchmark scenario: eight coworkers at a table, one laptop, "We're ranking pizza places." Every feature is judged against friction in that scenario.
- Definition of done (from the brief): create "Lubbock Pizza", paste 15 places, rank immediately, drag smoothly, rank without dragging, undo an accidental move, customize a tier, present, random-pick the next place, close and reopen with the board intact, export a polished PNG, share via URL and open on another device, use comfortably from a phone, deploy via GitHub Pages.
- Visual direction: modern, playful, fast, confident, slightly nerdy, polished; restrained animation; no generic "AI SaaS" gradients/glassmorphism; not TierMaker's styling.

## Constraints

- **Tech stack**: React + TypeScript (strict) + Vite + Tailwind CSS + dnd-kit + Lucide; zustand for state; idb-keyval for image blobs; Vitest — chosen in the brief, minimal extra deps
- **Hosting**: static GitHub Pages under a subpath (`/tierboard/`) — hash routing, relative asset base
- **No backend**: all persistence local (localStorage + IndexedDB); sharing via URL hash
- **Performance**: responsive with 100+ items, many tiers, images, during drag
- **Code quality**: no `any`, no giant components, ESLint + Prettier, clear feature folders

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hash routing (`#/`, `#/b/:id`, `#/s/:payload`) with a tiny custom router | Most reliable on GitHub Pages; no 404 hacks; share payload lives in the hash (never sent to server) | — Pending |
| Pure board-operation functions + zustand store with snapshot history | Easy to test, undo/redo is trivial and complete, UI stays thin | — Pending |
| Drag preview kept in local component state, committed as one op on drop | One undo step per drag; no history pollution during drag-over | — Pending |
| Native CompressionStream (deflate-raw) + base64url for share links | Zero dependency, good compression, available in all modern browsers and Node | — Pending |
| Canvas 2D renderer for PNG export (lazy loaded) instead of DOM screenshot | Dedicated render tree, no UI controls, predictable output, handles CORS failures gracefully | — Pending |
| Repository / transport / vote-source interfaces | Future live rooms can swap in realtime implementations without touching UI | — Pending |
| Skip GSD research agents; brief fully specifies stack and features | Saves time; package versions verified directly against npm | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-14 after initialization*
