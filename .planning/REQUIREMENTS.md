# Requirements: Tierboard

**Defined:** 2026-09-14
**Core Value:** Someone can open Tierboard during lunch and be ranking a pasted list of pizza places within 30 seconds — on a laptop, TV, or phone — with no login, no backend, and no confusion.

## v1 Requirements

### Board

- [ ] **BOARD-01**: User sees default S/A/B/C/D/F tiers with colored labels and an Unranked tray below them
- [ ] **BOARD-02**: User can drag items between tiers and the Unranked tray, and reorder within a tier
- [ ] **BOARD-03**: User can reorder tiers by dragging or with move up/down controls
- [ ] **BOARD-04**: User can edit the board title inline in the header
- [ ] **BOARD-05**: Unranked tray stays usable with dozens of items (wrapping, scroll, sort/shuffle)
- [ ] **BOARD-06**: User can optionally show item counts per tier

### Entry

- [ ] **ENTRY-01**: User can add a single item by typing and pressing Enter, staying ready for the next
- [ ] **ENTRY-02**: User can paste a newline-separated list and get one item per line
- [ ] **ENTRY-03**: User can paste a comma-separated line and get one item per value
- [ ] **ENTRY-04**: Whitespace is trimmed and duplicates are detected (skippable)
- [ ] **ENTRY-05**: User can add 20 items without touching the mouse (N to open, Enter, Esc)

### Items

- [ ] **ITEM-01**: Item supports name, subtitle, emoji, image, accent color, notes, URL
- [ ] **ITEM-02**: User can set an image by URL or upload one (stored locally in IndexedDB); broken images fall back gracefully
- [ ] **ITEM-03**: Clicking an item opens a lightweight editor (rename, emoji, image, notes, duplicate, delete, move to tier, unrank)
- [ ] **ITEM-04**: Text-only items look good without images

### Tiers

- [ ] **TIER-01**: User can rename and recolor tiers
- [ ] **TIER-02**: User can add, duplicate, and delete tiers; deleting a non-empty tier asks and defaults to moving items to Unranked
- [ ] **TIER-03**: User can reset to S/A/B/C/D/F or apply presets (GOAT…Trash, Must Have…Skip, Love…Hate)
- [ ] **TIER-04**: User can sort a tier A–Z, Z–A, or randomize it

### Persistence

- [ ] **PERS-01**: Boards autosave locally and survive closing the browser
- [ ] **PERS-02**: User can keep multiple boards and pick from a home screen with title, modified time, item count, preview
- [ ] **PERS-03**: User can open, rename, duplicate, delete boards; creating a new board takes one step
- [ ] **PERS-04**: User can start from templates (Restaurants, Pizza Places, Fast Food, Movies, Video Games, Albums, Sports Teams, Tools, Cars, Vacation Destinations, Snacks, Coffee, Office Lunch Spots)

### History

- [ ] **HIST-01**: Undo/redo covers movement, creation, deletion, tier changes, reordering, renames, bulk ops
- [ ] **HIST-02**: Ctrl/Cmd+Z undoes and Ctrl/Cmd+Shift+Z (and Ctrl+Y) redoes

### Ranking

- [ ] **RANK-01**: Quick Rank mode shows one unranked item with large tier buttons; 1–9 keys assign
- [ ] **RANK-02**: Any item can be ranked without dragging (tap → tier sheet; number keys on a selected item)
- [ ] **RANK-03**: Comparison mode asks "Which is better?" pairwise and suggests an adjustable tier distribution
- [ ] **RANK-04**: Random item picks an unranked item with a brief selector animation
- [ ] **RANK-05**: Random debate picks two ranked items to reconsider
- [ ] **RANK-06**: Tie breaker runs head-to-head votes across 2+ chosen items
- [ ] **RANK-07**: Clear Rankings returns everything to Unranked; Delete All Items is separate

### Group

- [ ] **GROUP-01**: Presentation mode hides clutter, enlarges type/labels, supports fullscreen, keeps DnD, add, and random
- [ ] **GROUP-02**: Voting mode tallies tier votes (+/−) for one item and shows the group result; apply moves the item
- [ ] **GROUP-03**: Up/down (better/worse) voting for a ranked item
- [ ] **GROUP-04**: Hot takes: flag an item with 🔥 and an optional note, shown on the board and in exports
- [ ] **GROUP-05**: Stats panel (totals, per-tier counts and %, most crowded, empty tiers, hot takes)

### Share & Export

- [ ] **SHARE-01**: Copy Share Link encodes the board (compressed, URL-safe) into the URL hash
- [ ] **SHARE-02**: Opening a share link shows a temporary board that never overwrites saved boards until "Save to My Boards"
- [ ] **SHARE-03**: Oversized links and locally uploaded images are explained with alternatives
- [ ] **EXPORT-01**: JSON export/import with schemaVersion and migrations
- [ ] **EXPORT-02**: CSV export (item, tier, rank, notes, hot take…) and CSV/text import to Unranked
- [ ] **EXPORT-03**: PNG export (normal + high-res) with title, all tiers, items, optional branding, no UI controls
- [ ] **EXPORT-04**: Copy image to clipboard where supported

### Experience

- [ ] **UX-01**: Light/Dark/System theme and board themes (Classic, Neon, Minimal, Retro, Arcade)
- [ ] **UX-02**: Keyboard shortcuts (N, /, F, R, Q, ?, Esc, Cmd/Ctrl+K, undo/redo) that never fire while typing
- [ ] **UX-03**: Instant search across name/subtitle/notes that highlights matches and shows their tier
- [ ] **UX-04**: Command palette (Cmd/Ctrl+K) with board actions and item jump
- [ ] **UX-05**: Subtle delight: ranking-complete celebration, F→S moment, drop feedback, random selector animation
- [ ] **UX-06**: Designed for phones: compact cards, horizontally scrollable rows, long-press drag, tap-to-rank sheet
- [ ] **UX-07**: Accessible: semantic HTML, focus states, ARIA labels, contrast, reduced motion

### Delivery

- [ ] **DEL-01**: GitHub Actions workflow installs, typechecks, tests, builds and deploys `dist` to Pages
- [ ] **DEL-02**: App works under `https://USERNAME.github.io/REPOSITORY/`
- [ ] **DEL-03**: Vitest covers serialization, migration, moves, tier deletion, undo/redo, bulk parsing, duplicates
- [ ] **DEL-04**: README with image headers, features, quick start, deployment, architecture, roadmap, license

## v2 Requirements

### Live Rooms

- **LIVE-01**: Host opens a room (e.g. `/room/PIZZA`) and participants join from phones
- **LIVE-02**: Host puts an item up for ranking; everyone votes from their phone
- **LIVE-03**: Shared board updates live for all participants

## Out of Scope

| Feature | Reason |
|---------|--------|
| Accounts / login | Friction; no backend in this version |
| Server-side storage or short links | GitHub Pages is static; URL-hash sharing instead |
| AI ranking | Pairwise comparison is simpler, transparent and good enough |
| Embedding uploaded images in share URLs | Too large; users are pointed to JSON/PNG export |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BOARD-01..06 | Phase 1 | Pending |
| ENTRY-01..05 | Phase 1 | Pending |
| ITEM-01..04 | Phase 1 | Pending |
| TIER-01..04 | Phase 1 | Pending |
| PERS-01..04 | Phase 2 | Pending |
| HIST-01..02 | Phase 2 | Pending |
| SHARE-01..03 | Phase 3 | Pending |
| EXPORT-01..04 | Phase 3 | Pending |
| RANK-01..07 | Phase 4 | Pending |
| GROUP-01..05 | Phase 4 | Pending |
| UX-01..07 | Phase 5 | Pending |
| DEL-01..04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 55 total
- Mapped to phases: 55
- Unmapped: 0 ✓

---
*Requirements defined: 2026-09-14*
*Last updated: 2026-09-14 after initial definition*
