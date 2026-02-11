# StoryForge — AI Filmmaking Production Engine
## PRD v1.2 | Feb 11, 2026

## What's LIVE (v1.2)
### Backend
- Full CRUD: Projects, Worlds, Characters, Objects, Scenes, Shots (all with GET/POST/PUT/DELETE)
- AI Scene Compiler (GPT-5.2) with frame continuity, reference images, brand/world/character context
- AI Image Description endpoint (URL → structured entity description)
- Frame Continuity Chain API (returns all shots in order with transition data)
- Compilation History (stored in DB, queryable per project/shot)
- Project Export (full JSON)
- Batch Status Update (multi-shot advancement)
- Secrets Management API (store/retrieve API keys from DB)
- Health Check + MongoDB indexes on startup
- Shot filtering by scene_id and status
- Mito seed with 5 worlds, 2 characters, 5 scenes, 15 shots with transition types

### Frontend
- Dashboard with stats + project cards
- New Project creation page (brand, style, defaults, target duration)
- Project View with 5 tabs + Export button
- World Bible: Worlds/Characters/Props with image thumbnails, add/delete with confirm dialogs
- Storyboard: Scene grouping, Add Scene dialog, Add Shot dialog, shot cards with image thumbnails
- Shot Detail Dialog: Full editing (description, duration, framing, camera, status, prompt stack, audio stack, frame continuity, transitions, reference images, notes) + Compile button + Delete with confirmation
- Compile-from-Shot: Click Compile on any shot → switches to AI Compiler tab with pre-filled context (scene, world, characters, adjacent frame URLs)
- Pipeline Kanban: 7-stage advancement with toast notifications
- AI Compiler: World/character/zone/framing/camera selectors, reference images, frame continuity display, compilation history viewer
- Settings: API Keys & Secrets (EMERGENT_LLM_KEY, NOTION_API_KEY), Project Identity, Tags, Compliance Rails, Visual Style, Model Preferences, Default Settings
- Toast notifications on all operations (sonner)
- Delete confirmation dialogs on all destructive operations
- Dark theme throughout

### Deployment
- Dockerfile.backend, Dockerfile.frontend, docker-compose.yml, nginx.conf
- .env.example files for both services
- README.md with full setup instructions

## What's COMING SOON
- Notion bi-directional sync (MCP tools available, integration code pending)
- Drag-and-drop shot/scene reordering
- Batch compilation (multi-shot in one call)
- Image upload (currently URL-based)
- Inline editing on world/character cards
- Share Production Bible (PDF/web export)
- AI Image Description from UI (backend ready, frontend button pending)
- Keyboard shortcuts
- Error boundaries
- Mobile responsive layouts
