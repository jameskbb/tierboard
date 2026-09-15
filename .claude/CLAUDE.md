<!-- GSD:project-start source:PROJECT.md -->

## Project

**Tierboard**

Tierboard is a fast, polished, free tier-ranking web app that runs entirely in the browser and deploys as a static site on GitHub Pages. It is built for spontaneous group use — a team at lunch saying "let's rank every pizza place in town" should be able to open the site, paste a list, and start dragging items into S/A/B/C/D/F within 30 seconds, without anyone stopping the conversation to figure out the software. It is not a TierMaker clone: it is what a tier-ranking app should feel like if designed today — keyboard-first, mobile-friendly, visually distinctive, and full of small group features (quick rank, random pick, voting, hot takes, comparison mode).

**Core Value:** Someone can open Tierboard during lunch and be ranking a pasted list of pizza places within 30 seconds — on a laptop, TV, or phone — with no login, no backend, and no confusion.

### Constraints

- **Tech stack**: React + TypeScript (strict) + Vite + Tailwind CSS + dnd-kit + Lucide; zustand for state; idb-keyval for image blobs; Vitest — chosen in the brief, minimal extra deps
- **Hosting**: static GitHub Pages under a subpath (`/tierboard/`) — hash routing, relative asset base
- **No backend**: all persistence local (localStorage + IndexedDB); sharing via URL hash
- **Performance**: responsive with 100+ items, many tiers, images, during drag
- **Code quality**: no `any`, no giant components, ESLint + Prettier, clear feature folders

<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->

## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
