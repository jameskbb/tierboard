# Roadmap: Tierboard

## Overview

Build Tierboard from an empty repo to a deployed, polished static app in five coarse phases: first the core ranking board (the "30 seconds to ranking pizza" loop), then persistence and history so work is never lost, then sharing and exporting so results leave the app, then the group/smart-ranking features that make it fun, and finally the design/mobile/accessibility polish pass, tests, GitHub Pages delivery and README.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Core Board** - Scaffold, data model, tier board, drag-and-drop, fast entry, item and tier editing
- [x] **Phase 2: Boards & History** - Autosave, multi-board home, templates, undo/redo
- [x] **Phase 3: Share & Export** - URL-hash sharing, JSON/CSV import-export, PNG export and copy image
- [x] **Phase 4: Group & Smart Ranking** - Quick Rank, presentation mode, random pick/debate, voting, comparison, tie breaker, hot takes, stats
- [x] **Phase 5: Polish & Ship** - Themes, search, command palette, shortcuts, mobile/a11y polish, tests, Pages workflow, README

## Phase Details

### Phase 1: Core Board
**Goal**: A user can create items fast and rank them on a customizable tier board by drag or tap
**Depends on**: Nothing (first phase)
**Requirements**: BOARD-01, BOARD-02, BOARD-03, BOARD-04, BOARD-05, BOARD-06, ENTRY-01, ENTRY-02, ENTRY-03, ENTRY-04, ENTRY-05, ITEM-01, ITEM-02, ITEM-03, ITEM-04, TIER-01, TIER-02, TIER-03, TIER-04
**Success Criteria** (what must be TRUE):
  1. Pasting 15 newline-separated names creates 15 Unranked items instantly
  2. Items drag smoothly between tiers and within a tier; tiers can be reordered
  3. Clicking an item opens a small editor with emoji, image, notes, move and delete
  4. Deleting a non-empty tier offers moving its items to Unranked (the default)
**Plans**: 3 plans

Plans:
- [x] 01-01: Scaffold, strict TS/ESLint/Tailwind, data model and pure board operations
- [x] 01-02: Board view, tiers, items, dnd-kit multi-container drag
- [x] 01-03: Add-items dialog (bulk parsing, dedupe), item editor, tier settings and presets

### Phase 2: Boards & History
**Goal**: Work is never lost and is easy to undo; many boards can live side by side
**Depends on**: Phase 1
**Requirements**: PERS-01, PERS-02, PERS-03, PERS-04, HIST-01, HIST-02
**Success Criteria** (what must be TRUE):
  1. Closing and reopening the browser restores every board
  2. Home screen lists boards with preview and supports open/rename/duplicate/delete
  3. Ctrl/Cmd+Z undoes an accidental drag; Ctrl/Cmd+Shift+Z redoes it
**Plans**: 2 plans

Plans:
- [x] 02-01: Repository interface, localStorage + IndexedDB images, autosave, hash router, home page, templates
- [x] 02-02: Snapshot history with coalescing, keyboard undo/redo

### Phase 3: Share & Export
**Goal**: Results leave the app as links, files and polished images
**Depends on**: Phase 2
**Requirements**: SHARE-01, SHARE-02, SHARE-03, EXPORT-01, EXPORT-02, EXPORT-03, EXPORT-04
**Success Criteria** (what must be TRUE):
  1. A copied share link opens the same board on another device as a temporary board
  2. Exported PNG shows title, tiers and items with no UI controls, at 1x or 2x
  3. JSON export re-imports losslessly; CSV lists tier and rank per item
**Plans**: 2 plans

Plans:
- [x] 03-01: Share codec + transport interface, shared-board page, JSON/CSV
- [x] 03-02: Canvas export renderer (lazy), export dialog, clipboard

### Phase 4: Group & Smart Ranking
**Goal**: Ranking with a group around one screen is fast and fun
**Depends on**: Phase 3
**Requirements**: RANK-01, RANK-02, RANK-03, RANK-04, RANK-05, RANK-06, RANK-07, GROUP-01, GROUP-02, GROUP-03, GROUP-04, GROUP-05
**Success Criteria** (what must be TRUE):
  1. Quick Rank ranks a long list using only number keys
  2. Presentation mode is readable across a conference room and still supports drag, add and random
  3. Voting tallies produce a group result that can be applied in one click
  4. Comparison mode produces a suggested distribution the user can adjust and accept
**Plans**: 2 plans

Plans:
- [x] 04-01: Quick Rank, presentation mode, random pick, random debate, hot takes, stats
- [x] 04-02: Voting (tier + up/down), pairwise comparison, tie breaker

### Phase 5: Polish & Ship
**Goal**: The app feels finished on every device and deploys itself
**Depends on**: Phase 4
**Requirements**: UX-01, UX-02, UX-03, UX-04, UX-05, UX-06, UX-07, DEL-01, DEL-02, DEL-03, DEL-04
**Success Criteria** (what must be TRUE):
  1. The app is comfortable on a phone (tap-to-rank, long-press drag, no scroll fights)
  2. Pushing to main typechecks, tests, builds and deploys to GitHub Pages under /tierboard/
  3. README presents the project with image headers, screenshots and architecture/roadmap
**Plans**: 2 plans

Plans:
- [x] 05-01: Themes, search, command palette, shortcuts panel, delight, mobile + a11y pass
- [x] 05-02: Tests, deploy workflow, README with screenshots, final production build

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Board | 3/3 | Complete | 2026-09-14 |
| 2. Boards & History | 2/2 | Complete | 2026-09-14 |
| 3. Share & Export | 2/2 | Complete | 2026-09-14 |
| 4. Group & Smart Ranking | 2/2 | Complete | 2026-09-14 |
| 5. Polish & Ship | 2/2 | Complete | 2026-09-14 |
