# StoryForge — AI Filmmaking Production Engine
## PRD v1.1 | Feb 11, 2026

## Original Problem Statement
"Investigate my notion workspace and surface an application need that we can build to facilitate more efficient work"

## What Was Built
Universal AI filmmaking production engine. Project-agnostic, config-driven. Works alongside ArtCraft + WorldLabs Marble + any video gen model.

## Architecture
- **Backend**: FastAPI (Python) on port 8001 — MongoDB — GPT-5.2 via Emergent LLM key
- **Frontend**: React 19 + Tailwind CSS + shadcn/ui on port 3000
- **Deployment**: Docker Compose (Dockerfile.backend, Dockerfile.frontend, nginx.conf, docker-compose.yml)

## What's LIVE (v1.1)
- Full CRUD: Projects, Worlds, Characters, Objects, Scenes, Shots
- AI Scene Compiler (GPT-5.2, context-aware: brand/world/character/compliance)
- AI Image Description (URL → structured entity description)
- Frame Continuity (first_frame_url, last_frame_url, transition_in/out, compiler uses for visual bridging)
- Reference Images in prompts (world/character/shot reference images passed to compiler)
- Production Pipeline Kanban (7 stages with advance)
- Storyboard with scene grouping, tension meters, duration tracking
- World Bible (worlds with emotional zones, characters with identity sheets, props)
- Project Settings (brand, compliance, style, defaults, tags, model preferences)
- Secrets Management (API keys configurable from UI)
- Compilation History (stored in DB, queryable per project/shot)
- Project Export (full JSON)
- Batch Status Update API
- Health Check endpoint
- MongoDB indexes
- Docker deployment config (Dockerfile.backend, Dockerfile.frontend, docker-compose.yml, nginx.conf)
- README with setup instructions
- Mito seed with 5 worlds, 2 characters, 5 scenes, 15 shots

## What's STUBBED (exists but incomplete)
- New Project creation (button exists, page route needs creation)
- Shot detail editing (no click-to-edit panel yet)
- Scene/Shot CRUD in UI (backend ready, frontend dialogs pending)
- Object add/edit UI (backend ready, frontend dialog pending)
- Image display (URL fields exist, no thumbnail rendering on cards)

## What's COMING SOON
- Notion bi-directional sync
- Drag-and-drop reordering (storyboard + kanban)
- Batch compilation (multi-shot)
- Image upload (currently URL-based references)
- Confirmation dialogs before delete
- Toast notifications on operations
- Search/filter on all lists
- Compile from shot card
- Share Production Bible (PDF/web export)
- Inline editing on world/character cards
- Keyboard shortcuts
- Error boundaries

## Backlog (Prioritized)
### P0 — Next Session
- [ ] New Project creation page
- [ ] Shot detail slide-out panel (edit all fields)
- [ ] Add Scene / Add Shot dialogs
- [ ] Toast notifications (sonner already in deps)
- [ ] Delete confirmation dialogs
- [ ] Image thumbnail display on cards

### P1
- [ ] Notion sync (read/write)
- [ ] Compile from shot card
- [ ] Inline editing
- [ ] Search/filter
- [ ] Batch compile UI

### P2
- [ ] Share Production Bible export
- [ ] Drag-and-drop
- [ ] Duration warnings
- [ ] Mobile responsive
- [ ] Keyboard shortcuts
