# StoryForge

**AI Filmmaking Production Engine**

StoryForge is a production management platform for AI-generated animated shorts and visual media. It sits alongside your creative tools (ArtCraft, WorldLabs Marble, Veo, Kling, Sora) and manages the entire production pipeline — from world bible to final render.

## Features

### LIVE
- **World Bible** — Register persistent worlds, characters, and props with descriptions, emotional zones, and reference image URLs
- **Shot Sequencer** — Visual storyboard organized by scenes with duration tracking and dramatic tension meters
- **AI Scene Compiler** — Natural language → structured prompts (image/video/audio) powered by GPT-5.2, context-aware (reads brand config, world state, character bible)
- **Production Pipeline** — 7-stage Kanban: Concept → World Built → Blocked → Generated → Audio Layered → Mixed → Final
- **Frame Continuity** — first_frame_url / last_frame_url per shot, transition types, compiler uses adjacent frames for visual bridging
- **Brand & Compliance Config** — Per-project brand, forbidden/required elements, visual style guidelines injected into every compilation
- **Secrets Management** — Configure API keys from the UI (Settings tab)
- **AI Image Description** — Paste an image URL → AI generates structured entity descriptions (world/character/prop)
- **Compilation History** — All AI compilations stored and queryable per project/shot
- **Project Export** — Full project data as JSON
- **Mito Seed** — One-click seed of complete animated short project with 5 worlds, 2 characters, 5 scenes, 15 shots

### COMING SOON
- Notion bi-directional sync
- Drag-and-drop shot reordering
- Batch compilation (multi-shot)
- Image upload (currently URL-based)
- Share Production Bible (PDF/web export)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS, shadcn/ui, Lucide icons |
| Backend | FastAPI (Python), Pydantic |
| Database | MongoDB (Motor async driver) |
| AI | GPT-5.2 via Emergent LLM key |
| Fonts | Barlow Condensed, Manrope, JetBrains Mono |

## Local Development (Docker — Mac M2)

```bash
# Clone
git clone <your-repo-url> storyforge
cd storyforge

# Configure
cp backend/.env.example backend/.env
# Edit backend/.env and set your EMERGENT_LLM_KEY

# Run
docker compose up --build

# Access
open http://localhost:3000
```

## Local Development (Without Docker)

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your keys
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend (separate terminal)
cd frontend
yarn install
cp .env.example .env
# Set REACT_APP_BACKEND_URL=http://localhost:8001
yarn start
```

## API Reference

FastAPI auto-generates docs at `/docs` (Swagger) and `/redoc`.

### Key Endpoints
| Method | Path | Description |
|---|---|---|
| GET | /api/health | Health check |
| GET | /api/projects | List all projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project with stats |
| GET | /api/projects/:id/worlds | List worlds |
| GET | /api/projects/:id/characters | List characters |
| GET | /api/projects/:id/scenes | List scenes (with shot counts) |
| GET | /api/projects/:id/shots | List shots (filterable by scene_id, status) |
| PATCH | /api/projects/:id/shots/:sid/status | Update shot production status |
| POST | /api/projects/:id/compile | AI Scene Compiler |
| POST | /api/projects/:id/describe-image | AI Image Description |
| GET | /api/projects/:id/continuity | Frame continuity chain |
| GET | /api/projects/:id/compilations | Compilation history |
| GET | /api/projects/:id/export | Full project JSON export |
| GET/PUT | /api/secrets | Manage API keys |
| POST | /api/seed/example | Seed example project |

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=storyforge
CORS_ORIGINS=*
EMERGENT_LLM_KEY=your-key-here
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=http://localhost:3000
```

## Project Structure
```
/
├── backend/
│   ├── server.py          # FastAPI app (all routes)
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── pages/         # React page components
│   │   ├── lib/api.js     # API client
│   │   └── components/ui/ # shadcn/ui components
│   └── .env
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── nginx.conf
└── README.md
```

## License

Private — Breyden Taylor / xtendable
