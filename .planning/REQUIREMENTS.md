# Requirements: Tierboard

**Defined:** 2026-09-14
**Core Value:** Someone can open Tierboard during lunch and be ranking a pasted list of pizza places within 30 seconds — on a laptop, TV, or phone — with no login, no backend, and no confusion.

## v1 Requirements

### Board

- [x] **BOARD-01**: User sees default S/A/B/C/D/F tiers with colored labels and an Unranked tray below them
- [x] **BOARD-02**: User can drag items between tiers and the Unranked tray, and reorder within a tier
- [x] **BOARD-03**: User can reorder tiers by dragging or with move up/down controls
- [x] **BOARD-04**: User can edit the board title inline in the header
- [x] **BOARD-05**: Unranked tray stays usable with dozens of items (wrapping, scroll, sort/shuffle)
- [x] **BOARD-06**: User can optionally show item counts per tier

### Entry

- [x] **ENTRY-01**: User can add a single item by typing and pressing Enter, staying ready for the next
- [x] **ENTRY-02**: User can paste a newline-separated list and get one item per line
- [x] **ENTRY-03**: User can paste a comma-separated line and get one item per value
- [x] **ENTRY-04**: Whitespace is trimmed and duplicates are detected (skippable)
- [x] **ENTRY-05**: User can add 20 items without touching the mouse (N to open, Enter, Esc)

### Items

- [x] **ITEM-01**: Item supports name, subtitle, emoji, image, accent color, notes, URL
- [x] **ITEM-02**: User can set an image by URL or upload one (stored locally in IndexedDB); broken images fall back gracefully
- [x] **ITEM-03**: Clicking an item opens a lightweight editor (rename, emoji, image, notes, duplicate, delete, move to tier, unrank)
- [x] **ITEM-04**: Text-only items look good without images

### Tiers

- [x] **TIER-01**: User can rename and recolor tiers
- [x] **TIER-02**: User can add, duplicate, and delete tiers; deleting a non-empty tier asks and defaults to moving items to Unranked
- [x] **TIER-03**: User can reset to S/A/B/C/D/F or apply presets (GOAT…Trash, Must Have…Skip, Love…Hate)
- [x] **TIER-04**: User can sort a tier A–Z, Z–A, or randomize it

### Persistence

- [x] **PERS-01**: Boards autosave locally and survive closing the browser
- [x] **PERS-02**: User can keep multiple boards and pick from a home screen with title, modified time, item count, preview
- [x] **PERS-03**: User can open, rename, duplicate, delete boards; creating a new board takes one step
- [x] **PERS-04**: User can start from templates (Restaurants, Pizza Places, Fast Food, Movies, Video Games, Albums, Sports Teams, Tools, Cars, Vacation Destinations, Snacks, Coffee, Office Lunch Spots)

### History

- [x] **HIST-01**: Undo/redo covers movement, creation, deletion, tier changes, reordering, renames, bulk ops
- [x] **HIST-02**: Ctrl/Cmd+Z undoes and Ctrl/Cmd+Shift+Z (and Ctrl+Y) redoes

### Ranking

- [x] **RANK-01**: Quick Rank mode shows one unranked item with large tier buttons; 1–9 keys assign
- [x] **RANK-02**: Any item can be ranked without dragging (tap → tier sheet; number keys on a selected item)
- [x] **RANK-03**: Comparison mode asks "Which is better?" pairwise and suggests an adjustable tier distribution
- [x] **RANK-04**: Random item picks an unranked item with a brief selector animation
- [x] **RANK-05**: Random debate picks two ranked items to reconsider
- [x] **RANK-06**: Tie breaker runs head-to-head votes across 2+ chosen items
- [x] **RANK-07**: Clear Rankings returns everything to Unranked; Delete All Items is separate

### Group

- [x] **GROUP-01**: Presentation mode hides clutter, enlarges type/labels, supports fullscreen, keeps DnD, add, and random
- [x] **GROUP-02**: Voting mode tallies tier votes (+/−) for one item and shows the group result; apply moves the item
- [x] **GROUP-03**: Up/down (better/worse) voting for a ranked item
- [x] **GROUP-04**: Hot takes: flag an item with 🔥 and an optional note, shown on the board and in exports
- [x] **GROUP-05**: Stats panel (totals, per-tier counts and %, most crowded, empty tiers, hot takes)

### Share & Export

- [x] **SHARE-01**: Copy Share Link encodes the board (compressed, URL-safe) into the URL hash
- [x] **SHARE-02**: Opening a share link shows a temporary board that never overwrites saved boards until "Save to My Boards"
- [x] **SHARE-03**: Oversized links and locally uploaded images are explained with alternatives
- [x] **EXPORT-01**: JSON export/import with schemaVersion and migrations
- [x] **EXPORT-02**: CSV export (item, tier, rank, notes, hot take…) and CSV/text import to Unranked
- [x] **EXPORT-03**: PNG export (normal + high-res) with title, all tiers, items, optional branding, no UI controls
- [x] **EXPORT-04**: Copy image to clipboard where supported

### Experience

- [x] **UX-01**: Light/Dark/System theme and board themes (Classic, Neon, Minimal, Retro, Arcade)
- [x] **UX-02**: Keyboard shortcuts (N, /, F, R, Q, ?, Esc, Cmd/Ctrl+K, undo/redo) that never fire while typing
- [x] **UX-03**: Instant search across name/subtitle/notes that highlights matches and shows their tier
- [x] **UX-04**: Command palette (Cmd/Ctrl+K) with board actions and item jump
- [x] **UX-05**: Subtle delight: ranking-complete celebration, F→S moment, drop feedback, random selector animation
- [x] **UX-06**: Designed for phones: compact cards, horizontally scrollable rows, long-press drag, tap-to-rank sheet
- [x] **UX-07**: Accessible: semantic HTML, focus states, ARIA labels, contrast, reduced motion

### Delivery

- [x] **DEL-01**: GitHub Actions workflow installs, typechecks, tests, builds and deploys `dist` to Pages
- [x] **DEL-02**: App works under `https://USERNAME.github.io/REPOSITORY/`
- [x] **DEL-03**: Vitest covers serialization, migration, moves, tier deletion, undo/redo, bulk parsing, duplicates
- [x] **DEL-04**: README with image headers, features, quick start, deployment, architecture, roadmap, license

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
| BOARD-01..06 | Phase 1 | Complete |
| ENTRY-01..05 | Phase 1 | Complete |
| ITEM-01..04 | Phase 1 | Complete |
| TIER-01..04 | Phase 1 | Complete |
| PERS-01..04 | Phase 2 | Complete |
| HIST-01..02 | Phase 2 | Complete |
| SHARE-01..03 | Phase 3 | Complete |
| EXPORT-01..04 | Phase 3 | Complete |
| RANK-01..07 | Phase 4 | Complete |
| GROUP-01..05 | Phase 4 | Complete |
| UX-01..07 | Phase 5 | Complete |
| DEL-01..04 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 55 total
- Mapped to phases: 55
- Unmapped: 0 ✓

---
*Requirements defined: 2026-09-14*
*Last updated: 2026-09-14 after v1 build and verification*
