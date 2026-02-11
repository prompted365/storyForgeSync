# StoryForge — AI Filmmaking Production Engine
## PRD v1.3 | Feb 11, 2026

## What's LIVE (v1.3)
### All Previous Features +
- **Drag-and-drop shot reordering** (dnd-kit) — grab handle on each shot card, reorders within scene
- **Batch compilation** — Select mode toggle, checkbox on each shot, "Batch Compile (N)" button → compiles all selected shots with full context
- **Notion sync** — Push to Notion button generates full shot list with schema. Schema: Name, Shot Number, Scene, Status, Framing, Camera, Duration, Zone, StoryForge ID, Project, Production Status
- **AI Image Description** — "AI Describe from Image" button on Add World and Add Character dialogs. Paste image URL → GPT-5.2 generates structured entity description → auto-fills form
- **Inline editing** — Click any world name/description or character name/description/personality/visual_notes/arc_summary to edit in-place. Pencil icon on hover, Enter to save, Escape to cancel

### Backend Endpoints Added
- POST /api/projects/{id}/shots/reorder — reorder shots by ID array
- POST /api/projects/{id}/batch-compile — compile multiple shots at once
- POST /api/projects/{id}/notion/push — generate Notion-ready data with schema
- POST /api/projects/{id}/describe-image — AI image description

### Notion DB Schema (for user to create)
| Property | Type | Description |
|---|---|---|
| Name | title | Shot description |
| Shot Number | number | Sequential number |
| Scene | select | Scene title |
| Status | status | Not Started / In Progress / Complete |
| Framing | select | Camera framing |
| Camera | select | Camera movement |
| Duration | number | Seconds |
| Zone | select | Emotional zone |
| StoryForge ID | rich_text | UUID for sync |
| Project | select | Project name |
| Production Status | select | Granular status |

## What's COMING SOON
- Notion direct write (currently generates data, user creates DB manually)
- Object/Prop full CRUD UI (add/edit/delete)
- Drag-and-drop scene reordering
- Share Production Bible export
- Error boundaries
- Mobile responsive
