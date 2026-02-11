# StoryForge — AI Filmmaking Production Engine
## PRD v1.0 | Feb 11, 2026

## Original Problem Statement
"Investigate my notion workspace and surface an application need that we can build to facilitate more efficient work"

## User Discovery
- Workspace: "xtendable" (Breyden Taylor) — Notion workspace with bt-tracker (task management), stakeholder-eeShow (CRM), and massive Everything's Energy Show production data
- Key project: **Mito** — a 5-minute animated short (not a podcast episode) exploring consciousness and cellular healing
- User has ArtCraft + WorldLabs Marble + Nano Banana Pro/Midjourney/Veo/Kling/Sora for generation
- Existing production architecture: declarative media grammar with Intent/Constraint/Emission separation, zone classification, multi-layer audio (SOUND_DESIGN, VOLUME_LAYERS, SPATIAL, NARRATIVE, EXCLUDE)
- **Gap identified**: No production management layer tying tools together for a coherent animated short

## Architecture
- **Backend**: FastAPI (Python) on port 8001
- **Frontend**: React + Tailwind CSS on port 3000
- **Database**: MongoDB
- **AI**: GPT-5.2 via Emergent LLM key (emergentintegrations library)
- **Design**: Dark theme, Barlow Condensed / Manrope / JetBrains Mono fonts

## Core Requirements
1. Project-agnostic (not Mito-specific) — configurable brand, compliance, style
2. World Bible (Worlds/Characters/Props registries)
3. Shot Sequencer / Storyboard with scene grouping
4. AI Scene Compiler (NL → structured prompts for image/video/audio)
5. Production Pipeline Kanban (7 stages)
6. Duration budgeting (running total vs target)
7. Seed from Notion data

## What's Been Implemented (v1.0 — Feb 11, 2026)
- [x] Full CRUD backend for Projects, Worlds, Characters, Objects, Scenes, Shots
- [x] Dashboard with global stats
- [x] Project view with 5-tab interface
- [x] World Bible (Worlds with emotional zones, Characters with identity sheets, Props)
- [x] Storyboard with scene grouping, tension meters, shot cards, duration tracking
- [x] Pipeline Kanban with 7 production stages and shot advancement
- [x] AI Scene Compiler with GPT-5.2 (context-aware: reads brand config, world state, character bible)
- [x] Project Settings (brand config, compliance rails, forbidden/required elements, visual style, defaults)
- [x] Mito seed endpoint that creates complete project with 5 worlds, 2 characters, 5 scenes, 15 shots
- [x] Add World / Add Character dialogs
- [x] Copy-to-clipboard for all compiled prompts
- [x] Dark theme with professional production tool aesthetic

## User Personas
1. **Creative Director** (primary): Manages entire production, uses compiler to generate prompts, tracks pipeline
2. **Production Artist**: Works in ArtCraft/Marble, uses StoryForge for shot reference and prompt copying
3. **Audio Designer**: References audio stacks from compiler for zone-aware audio production

## Backlog (Prioritized)
### P0 — Next Session
- [ ] Shot detail editing (click shot → edit all fields inline)
- [ ] Drag-and-drop shot reordering in storyboard
- [ ] Batch compilation (select multiple shots → compile all)

### P1
- [ ] Notion bi-directional sync (push shot status to bt-tracker)
- [ ] Image upload for worlds/characters (reference images)
- [ ] Shot-level compilation (compile from shot card directly)
- [ ] Export full shot list as JSON for pipeline automation

### P2
- [ ] Scene-level AI compilation (compile entire scene at once)
- [ ] Prompt version history with diffs
- [ ] Coherence dashboard (cross-shot consistency checker)
- [ ] Duration warnings (overrun/underrun alerts)
- [ ] Multi-project comparison view

## Tech Debt
- None significant for v1.0

## Enhancement Suggestions
- **Revenue/Impact**: Add a "Share Production Bible" feature that exports a beautiful PDF/web link of the world bible + storyboard — perfect for client presentations or team onboarding. The structured data is already there; packaging it as a shareable artifact turns StoryForge from a personal tool into a collaboration platform.
