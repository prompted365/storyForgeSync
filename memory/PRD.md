# StoryForge — AI Filmmaking Production Engine
## PRD v1.4 | Feb 11, 2026

## What's LIVE (v1.4)
### Notion Sync — LIVE, BIDIRECTIONAL-READY
- Push to Notion button writes directly to Notion database via API
- Smart sync: detects existing entries by StoryForge ID, updates instead of duplicating
- Database: `storyforge-sync` (ID: `3048ac5f-d635-8024-8401-c823235a5a52`)
- All 15 Mito shots synced with: Name, Shot Number, Scene, Status, Framing, Camera, Duration, Zone, StoryForge ID, Project
- Notion credentials stored in Settings > Secrets (NOTION_API_KEY, NOTION_DB_ID)
- Sync log stored in MongoDB for audit trail

### All Previous Features (v1.3)
- World Bible with inline editing + AI Image Description
- Shot Sequencer with drag-and-drop reordering
- AI Scene Compiler (GPT-5.2) with frame continuity
- Production Pipeline Kanban
- Batch compilation
- Shot Detail Dialog
- Compile-from-Shot
- New Project creation
- Toast notifications + delete confirmations
- Docker deployment config
- Project export

## Coming Soon
- Notion read sync (pull changes FROM Notion back to StoryForge)
- Object/Prop CRUD UI
- Share Production Bible export
