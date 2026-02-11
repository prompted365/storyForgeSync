from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="StoryForge API")
api_router = APIRouter(prefix="/api")

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

PRODUCTION_STAGES = ["concept", "world_built", "blocked", "generated", "audio_layered", "mixed", "final"]
EMOTIONAL_ZONES = ["intimate", "contemplative", "tense", "revelatory", "chaotic", "transcendent", "desolate", "triumphant", "liminal"]
FRAMINGS = ["extreme_wide", "wide", "medium_wide", "medium", "medium_close", "close", "extreme_close"]
CAMERA_MOVEMENTS = ["static", "pan_left", "pan_right", "tilt_up", "tilt_down", "dolly_in", "dolly_out", "crane_up", "crane_down", "orbit", "handheld", "tracking"]

def utcnow():
    return datetime.now(timezone.utc).isoformat()

def new_id():
    return str(uuid.uuid4())

# --- Pydantic Models ---

class ProjectCreate(BaseModel):
    name: str
    brand_primary: str = ""
    brand_secondary: str = ""
    description: str = ""
    compliance_notes: List[str] = []
    forbidden_elements: List[str] = []
    required_elements: List[str] = []
    visual_style: str = ""
    default_time_of_day: str = "day"
    default_weather: str = "clear"
    default_lighting: str = "natural"
    default_aspect_ratio: str = "16:9"
    model_preferences: Dict[str, str] = {}
    tags: List[str] = []

class WorldCreate(BaseModel):
    name: str
    description: str = ""
    marble_url: str = ""
    reference_images: List[str] = []
    emotional_zone: str = "contemplative"
    atmosphere: str = ""
    time_of_day: str = ""
    weather: str = ""
    lighting_notes: str = ""
    spatial_character: str = ""
    tags: List[str] = []

class CharacterCreate(BaseModel):
    name: str
    role: str = ""
    description: str = ""
    identity_images: List[str] = []
    personality: str = ""
    voice_profile: str = ""
    visual_notes: str = ""
    motivation_notes: str = ""
    arc_summary: str = ""
    relationships: List[Dict[str, str]] = []
    tags: List[str] = []

class ObjectCreate(BaseModel):
    name: str
    category: str = ""
    description: str = ""
    reference_images: List[str] = []
    narrative_significance: str = ""
    usage_notes: str = ""
    tags: List[str] = []

class SceneCreate(BaseModel):
    scene_number: int
    title: str
    synopsis: str = ""
    world_id: Optional[str] = None
    character_ids: List[str] = []
    emotional_zone: str = "contemplative"
    narrative_purpose: str = ""
    dramatic_tension: int = 5
    time_of_day: str = ""
    weather: str = ""
    lighting: str = ""
    director_notes: str = ""

class ShotCreate(BaseModel):
    scene_id: str
    shot_number: int
    duration_target_sec: float = 5.0
    framing: str = "medium"
    camera_movement: str = "static"
    camera_notes: str = ""
    description: str = ""
    intent: str = ""
    constraint: str = ""
    emission: str = ""
    sound_design: str = ""
    volume_layers: str = ""
    spatial: str = ""
    narrative: str = ""
    exclude: str = ""
    production_status: str = "concept"
    reference_frame_url: str = ""
    generated_asset_url: str = ""
    notes: str = ""

class ShotUpdate(BaseModel):
    shot_number: Optional[int] = None
    duration_target_sec: Optional[float] = None
    framing: Optional[str] = None
    camera_movement: Optional[str] = None
    camera_notes: Optional[str] = None
    description: Optional[str] = None
    intent: Optional[str] = None
    constraint: Optional[str] = None
    emission: Optional[str] = None
    sound_design: Optional[str] = None
    volume_layers: Optional[str] = None
    spatial: Optional[str] = None
    narrative: Optional[str] = None
    exclude: Optional[str] = None
    production_status: Optional[str] = None
    reference_frame_url: Optional[str] = None
    generated_asset_url: Optional[str] = None
    notes: Optional[str] = None

class CompileRequest(BaseModel):
    project_id: str
    scene_description: str
    world_id: Optional[str] = None
    character_ids: List[str] = []
    emotional_zone: str = "contemplative"
    framing: str = "medium"
    camera_movement: str = "static"
    time_of_day: str = ""
    weather: str = ""
    additional_context: str = ""

# --- Helper: strip _id ---
def clean_doc(doc):
    if doc and "_id" in doc:
        del doc["_id"]
    return doc

def clean_docs(docs):
    return [clean_doc(d) for d in docs]

# ==================== PROJECTS ====================

@api_router.post("/projects")
async def create_project(data: ProjectCreate):
    doc = data.model_dump()
    doc["id"] = new_id()
    doc["created_at"] = utcnow()
    doc["updated_at"] = utcnow()
    await db.projects.insert_one(doc)
    return clean_doc(doc)

@api_router.get("/projects")
async def list_projects():
    projects = await db.projects.find({}, {"_id": 0}).to_list(100)
    for p in projects:
        p["world_count"] = await db.worlds.count_documents({"project_id": p["id"]})
        p["character_count"] = await db.characters.count_documents({"project_id": p["id"]})
        p["shot_count"] = await db.shots.count_documents({"project_id": p["id"]})
        shots = await db.shots.find({"project_id": p["id"]}, {"_id": 0, "production_status": 1}).to_list(1000)
        total = len(shots)
        done = sum(1 for s in shots if s.get("production_status") == "final")
        p["completion_pct"] = round((done / total * 100) if total > 0 else 0, 1)
        p["total_duration"] = sum(s.get("duration_target_sec", 0) for s in await db.shots.find({"project_id": p["id"]}, {"_id": 0, "duration_target_sec": 1}).to_list(1000))
    return projects

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str):
    doc = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Project not found")
    doc["world_count"] = await db.worlds.count_documents({"project_id": project_id})
    doc["character_count"] = await db.characters.count_documents({"project_id": project_id})
    doc["shot_count"] = await db.shots.count_documents({"project_id": project_id})
    doc["scene_count"] = await db.scenes.count_documents({"project_id": project_id})
    doc["object_count"] = await db.objects.count_documents({"project_id": project_id})
    shots = await db.shots.find({"project_id": project_id}, {"_id": 0, "production_status": 1, "duration_target_sec": 1}).to_list(1000)
    total = len(shots)
    done = sum(1 for s in shots if s.get("production_status") == "final")
    doc["completion_pct"] = round((done / total * 100) if total > 0 else 0, 1)
    doc["total_duration"] = sum(s.get("duration_target_sec", 0) for s in shots)
    stage_counts = {}
    for stage in PRODUCTION_STAGES:
        stage_counts[stage] = sum(1 for s in shots if s.get("production_status") == stage)
    doc["stage_counts"] = stage_counts
    return doc

@api_router.put("/projects/{project_id}")
async def update_project(project_id: str, data: ProjectCreate):
    update = data.model_dump()
    update["updated_at"] = utcnow()
    result = await db.projects.update_one({"id": project_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(404, "Project not found")
    return await get_project(project_id)

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    await db.projects.delete_one({"id": project_id})
    await db.worlds.delete_many({"project_id": project_id})
    await db.characters.delete_many({"project_id": project_id})
    await db.objects.delete_many({"project_id": project_id})
    await db.scenes.delete_many({"project_id": project_id})
    await db.shots.delete_many({"project_id": project_id})
    return {"status": "deleted"}

# ==================== WORLDS ====================

@api_router.post("/projects/{project_id}/worlds")
async def create_world(project_id: str, data: WorldCreate):
    doc = data.model_dump()
    doc["id"] = new_id()
    doc["project_id"] = project_id
    doc["created_at"] = utcnow()
    await db.worlds.insert_one(doc)
    return clean_doc(doc)

@api_router.get("/projects/{project_id}/worlds")
async def list_worlds(project_id: str):
    return clean_docs(await db.worlds.find({"project_id": project_id}, {"_id": 0}).to_list(500))

@api_router.get("/projects/{project_id}/worlds/{world_id}")
async def get_world(project_id: str, world_id: str):
    doc = await db.worlds.find_one({"id": world_id, "project_id": project_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "World not found")
    return doc

@api_router.put("/projects/{project_id}/worlds/{world_id}")
async def update_world(project_id: str, world_id: str, data: WorldCreate):
    update = data.model_dump()
    result = await db.worlds.update_one({"id": world_id, "project_id": project_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(404, "World not found")
    return await get_world(project_id, world_id)

@api_router.delete("/projects/{project_id}/worlds/{world_id}")
async def delete_world(project_id: str, world_id: str):
    await db.worlds.delete_one({"id": world_id, "project_id": project_id})
    return {"status": "deleted"}

# ==================== CHARACTERS ====================

@api_router.post("/projects/{project_id}/characters")
async def create_character(project_id: str, data: CharacterCreate):
    doc = data.model_dump()
    doc["id"] = new_id()
    doc["project_id"] = project_id
    doc["created_at"] = utcnow()
    await db.characters.insert_one(doc)
    return clean_doc(doc)

@api_router.get("/projects/{project_id}/characters")
async def list_characters(project_id: str):
    return clean_docs(await db.characters.find({"project_id": project_id}, {"_id": 0}).to_list(500))

@api_router.put("/projects/{project_id}/characters/{char_id}")
async def update_character(project_id: str, char_id: str, data: CharacterCreate):
    update = data.model_dump()
    result = await db.characters.update_one({"id": char_id, "project_id": project_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(404, "Character not found")
    doc = await db.characters.find_one({"id": char_id}, {"_id": 0})
    return doc

@api_router.delete("/projects/{project_id}/characters/{char_id}")
async def delete_character(project_id: str, char_id: str):
    await db.characters.delete_one({"id": char_id, "project_id": project_id})
    return {"status": "deleted"}

# ==================== OBJECTS/PROPS ====================

@api_router.post("/projects/{project_id}/objects")
async def create_object(project_id: str, data: ObjectCreate):
    doc = data.model_dump()
    doc["id"] = new_id()
    doc["project_id"] = project_id
    doc["created_at"] = utcnow()
    await db.objects.insert_one(doc)
    return clean_doc(doc)

@api_router.get("/projects/{project_id}/objects")
async def list_objects(project_id: str):
    return clean_docs(await db.objects.find({"project_id": project_id}, {"_id": 0}).to_list(500))

@api_router.delete("/projects/{project_id}/objects/{obj_id}")
async def delete_object(project_id: str, obj_id: str):
    await db.objects.delete_one({"id": obj_id, "project_id": project_id})
    return {"status": "deleted"}

# ==================== SCENES ====================

@api_router.post("/projects/{project_id}/scenes")
async def create_scene(project_id: str, data: SceneCreate):
    doc = data.model_dump()
    doc["id"] = new_id()
    doc["project_id"] = project_id
    doc["created_at"] = utcnow()
    await db.scenes.insert_one(doc)
    return clean_doc(doc)

@api_router.get("/projects/{project_id}/scenes")
async def list_scenes(project_id: str):
    scenes = clean_docs(await db.scenes.find({"project_id": project_id}, {"_id": 0}).sort("scene_number", 1).to_list(500))
    for s in scenes:
        s["shot_count"] = await db.shots.count_documents({"scene_id": s["id"], "project_id": project_id})
    return scenes

@api_router.put("/projects/{project_id}/scenes/{scene_id}")
async def update_scene(project_id: str, scene_id: str, data: SceneCreate):
    update = data.model_dump()
    result = await db.scenes.update_one({"id": scene_id, "project_id": project_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(404, "Scene not found")
    doc = await db.scenes.find_one({"id": scene_id}, {"_id": 0})
    return doc

@api_router.delete("/projects/{project_id}/scenes/{scene_id}")
async def delete_scene(project_id: str, scene_id: str):
    await db.scenes.delete_one({"id": scene_id, "project_id": project_id})
    await db.shots.delete_many({"scene_id": scene_id, "project_id": project_id})
    return {"status": "deleted"}

# ==================== SHOTS ====================

@api_router.post("/projects/{project_id}/shots")
async def create_shot(project_id: str, data: ShotCreate):
    doc = data.model_dump()
    doc["id"] = new_id()
    doc["project_id"] = project_id
    doc["created_at"] = utcnow()
    doc["ai_generation_log"] = []
    await db.shots.insert_one(doc)
    return clean_doc(doc)

@api_router.get("/projects/{project_id}/shots")
async def list_shots(project_id: str, scene_id: Optional[str] = None):
    query = {"project_id": project_id}
    if scene_id:
        query["scene_id"] = scene_id
    shots = clean_docs(await db.shots.find(query, {"_id": 0}).sort("shot_number", 1).to_list(1000))
    return shots

@api_router.get("/projects/{project_id}/shots/{shot_id}")
async def get_shot(project_id: str, shot_id: str):
    doc = await db.shots.find_one({"id": shot_id, "project_id": project_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Shot not found")
    return doc

@api_router.put("/projects/{project_id}/shots/{shot_id}")
async def update_shot(project_id: str, shot_id: str, data: ShotUpdate):
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(400, "No fields to update")
    result = await db.shots.update_one({"id": shot_id, "project_id": project_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(404, "Shot not found")
    return await get_shot(project_id, shot_id)

@api_router.patch("/projects/{project_id}/shots/{shot_id}/status")
async def update_shot_status(project_id: str, shot_id: str, status: str = Query(...)):
    if status not in PRODUCTION_STAGES:
        raise HTTPException(400, f"Invalid status. Must be one of: {PRODUCTION_STAGES}")
    result = await db.shots.update_one({"id": shot_id, "project_id": project_id}, {"$set": {"production_status": status}})
    if result.matched_count == 0:
        raise HTTPException(404, "Shot not found")
    return {"status": "updated", "new_status": status}

@api_router.delete("/projects/{project_id}/shots/{shot_id}")
async def delete_shot(project_id: str, shot_id: str):
    await db.shots.delete_one({"id": shot_id, "project_id": project_id})
    return {"status": "deleted"}

# ==================== AI SCENE COMPILER ====================

@api_router.post("/projects/{project_id}/compile")
async def compile_scene(project_id: str, data: CompileRequest):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(404, "Project not found")

    world_context = ""
    if data.world_id:
        world = await db.worlds.find_one({"id": data.world_id}, {"_id": 0})
        if world:
            world_context = f"""
WORLD/LOCATION: {world.get('name', '')}
Description: {world.get('description', '')}
Emotional Zone: {world.get('emotional_zone', '')}
Atmosphere: {world.get('atmosphere', '')}
Lighting: {world.get('lighting_notes', '')}
Spatial Character: {world.get('spatial_character', '')}
Marble URL: {world.get('marble_url', '')}"""

    char_context = ""
    if data.character_ids:
        chars = clean_docs(await db.characters.find({"id": {"$in": data.character_ids}, "project_id": project_id}, {"_id": 0}).to_list(20))
        for c in chars:
            char_context += f"""
CHARACTER: {c.get('name', '')} ({c.get('role', '')})
Description: {c.get('description', '')}
Personality: {c.get('personality', '')}
Visual Notes: {c.get('visual_notes', '')}
Voice: {c.get('voice_profile', '')}
"""

    brand_context = f"""
PROJECT: {project.get('name', '')}
Primary Brand: {project.get('brand_primary', '')}
Secondary Brand: {project.get('brand_secondary', '')}
Visual Style: {project.get('visual_style', '')}
Compliance: {', '.join(project.get('compliance_notes', []))}
Forbidden Elements: {', '.join(project.get('forbidden_elements', []))}
Required Elements: {', '.join(project.get('required_elements', []))}"""

    system_prompt = """You are StoryForge Scene Compiler — an expert AI cinematographer and production designer. 
You take natural language scene descriptions and generate structured production prompts.

You MUST output a JSON object with these exact keys:
{
  "image_prompt": "A detailed prompt for image generation (for ArtCraft/Nano Banana Pro/Midjourney). Be specific about composition, lighting, color palette, mood, and subjects.",
  "video_prompt": "A prompt for video generation (for Veo/Kling/Sora). Describe motion, camera movement, timing, and action.",
  "audio_stack": {
    "sound_design": "Primary environmental and foley sound elements",
    "volume_layers": "BACKGROUND: [element] at [level] | MIDGROUND: [element] at [level] | FOREGROUND: [element] at [level]",
    "spatial": "Spatial positioning, movement, and stereo/surround placement",
    "narrative": "Emotional beats and narrative function of the audio",
    "exclude": "Elements to explicitly exclude from audio generation"
  },
  "director_notes": "Brief suggestions for blocking, timing, transitions, and coherence with adjacent shots",
  "coherence_flags": ["Any potential inconsistencies with the established world/character bible"]
}

RULES:
- Honor the brand config and compliance rails — never violate forbidden elements
- Reference the world's established atmosphere and lighting
- Keep characters visually consistent with their identity sheets
- The audio stack follows the Intent → Constraint → Emission architecture
- Output ONLY valid JSON, no markdown wrapping"""

    user_prompt = f"""{brand_context}
{world_context}
{char_context}

SHOT PARAMETERS:
Emotional Zone: {data.emotional_zone}
Framing: {data.framing}
Camera Movement: {data.camera_movement}
Time of Day: {data.time_of_day or project.get('default_time_of_day', 'day')}
Weather: {data.weather or project.get('default_weather', 'clear')}
{f'Additional Context: {data.additional_context}' if data.additional_context else ''}

SCENE DESCRIPTION:
{data.scene_description}

Generate the structured production prompts as JSON."""

    try:
        api_key = os.environ.get("EMERGENT_LLM_KEY", "")
        chat = LlmChat(
            api_key=api_key,
            session_id=f"compile-{new_id()}",
            system_message=system_prompt
        ).with_model("openai", "gpt-5.2")

        response = await chat.send_message(UserMessage(text=user_prompt))

        import json
        response_text = response.strip()
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])

        compiled = json.loads(response_text)

        log_entry = {
            "timestamp": utcnow(),
            "input_description": data.scene_description,
            "output": compiled
        }

        return {
            "status": "compiled",
            "result": compiled,
            "log_entry": log_entry
        }
    except json.JSONDecodeError:
        return {
            "status": "compiled",
            "result": {"raw_response": response_text},
            "log_entry": {"timestamp": utcnow(), "error": "JSON parse failed", "raw": response_text}
        }
    except Exception as e:
        logger.error(f"Compilation error: {e}")
        raise HTTPException(500, f"AI compilation failed: {str(e)}")

# ==================== DASHBOARD STATS ====================

@api_router.get("/dashboard/stats")
async def dashboard_stats():
    project_count = await db.projects.count_documents({})
    total_shots = await db.shots.count_documents({})
    total_worlds = await db.worlds.count_documents({})
    total_characters = await db.characters.count_documents({})
    shots = await db.shots.find({}, {"_id": 0, "production_status": 1, "duration_target_sec": 1}).to_list(10000)
    stage_counts = {}
    for stage in PRODUCTION_STAGES:
        stage_counts[stage] = sum(1 for s in shots if s.get("production_status") == stage)
    total_duration = sum(s.get("duration_target_sec", 0) for s in shots)
    return {
        "project_count": project_count,
        "total_shots": total_shots,
        "total_worlds": total_worlds,
        "total_characters": total_characters,
        "stage_counts": stage_counts,
        "total_duration_sec": total_duration
    }

# ==================== ENUMS ====================

@api_router.get("/enums")
async def get_enums():
    return {
        "production_stages": PRODUCTION_STAGES,
        "emotional_zones": EMOTIONAL_ZONES,
        "framings": FRAMINGS,
        "camera_movements": CAMERA_MOVEMENTS
    }

# ==================== SEED MITO FROM NOTION ====================

@api_router.post("/seed/mito")
async def seed_mito_project():
    existing = await db.projects.find_one({"name": "Mito — The Animated Short"}, {"_id": 0})
    if existing:
        return {"status": "already_seeded", "project_id": existing["id"]}

    pid = new_id()
    project = {
        "id": pid,
        "name": "Mito — The Animated Short",
        "brand_primary": "Everything's Energy",
        "brand_secondary": "EESYS / EESystem",
        "description": "A 5-minute animated short exploring consciousness, scalar energy, and cellular healing through the journey of Mito — a mitochondrial entity awakening to its potential.",
        "compliance_notes": ["Content must respect the EESystem brand", "No medical claims — position as educational/exploratory", "Ethical sound design by construction"],
        "forbidden_elements": ["Cheap emotional manipulation", "Horror tropes without purpose", "Generic stock imagery aesthetics"],
        "required_elements": ["Consistent character identity across all shots", "Declarative media grammar (Intent/Constraint/Emission)", "Zone-aware audio design"],
        "visual_style": "Cinematic, ethereal, bioluminescent. Think cellular landscapes meeting cosmic vistas. Color palette: deep indigos, electric teals, warm ambers for healing moments.",
        "default_time_of_day": "twilight",
        "default_weather": "clear",
        "default_lighting": "bioluminescent",
        "default_aspect_ratio": "16:9",
        "model_preferences": {"image": "Nano Banana Pro", "video": "Veo 3.1", "world": "Marble (WorldLabs)"},
        "tags": ["animated_short", "eesystem", "consciousness", "healing"],
        "created_at": utcnow(),
        "updated_at": utcnow()
    }
    await db.projects.insert_one(project)

    worlds_data = [
        {"name": "The Cellular Interior", "description": "Inside a living cell — mitochondria, organelles, flowing cytoplasm. Bioluminescent structures pulse with energy.", "emotional_zone": "intimate", "atmosphere": "Warm, alive, pulsing with potential", "spatial_character": "intimate/enclosed", "lighting_notes": "Bioluminescent — soft blue-green glow from organelles, warm amber from energy production"},
        {"name": "The Neural Network", "description": "Vast interconnected pathways of neurons firing. Synaptic gaps bridged by light. Scale shifts from microscopic to cosmic.", "emotional_zone": "revelatory", "atmosphere": "Electric, expansive, awe-inspiring", "spatial_character": "vast/infinite", "lighting_notes": "Electric blue synaptic flashes against deep purple void"},
        {"name": "The Wasteland", "description": "A depleted, toxic cellular environment. Damaged structures, dim light, entropy visible.", "emotional_zone": "desolate", "atmosphere": "Decayed, threatening, suffocating", "spatial_character": "vast/barren", "lighting_notes": "Dim, desaturated, occasional sickly yellow-green"},
        {"name": "The Scalar Field", "description": "Abstract energy patterns — standing waves, interference patterns, golden ratio spirals. Where the EE System operates.", "emotional_zone": "transcendent", "atmosphere": "Pure energy, mathematical beauty, transcendence", "spatial_character": "infinite/unbounded", "lighting_notes": "Pure white-gold energy with prismatic refractions"},
        {"name": "The Awakening Chamber", "description": "Where Mito first encounters the scalar field. A threshold space between the damaged cell and regeneration.", "emotional_zone": "liminal", "atmosphere": "Transitional, pregnant with possibility", "spatial_character": "threshold/between", "lighting_notes": "Gradient from cold blue to warm gold — the transformation visible in light"},
    ]
    for w in worlds_data:
        w["id"] = new_id()
        w["project_id"] = pid
        w["created_at"] = utcnow()
        w["marble_url"] = ""
        w["reference_images"] = []
        w["time_of_day"] = ""
        w["weather"] = ""
        w["tags"] = []
    await db.worlds.insert_many(worlds_data)

    chars_data = [
        {"name": "Mito", "role": "Protagonist", "description": "A mitochondrial entity — small, luminous, curious. Begins depleted and dim, gradually brightens as it encounters the scalar field.", "personality": "Curious, resilient, innocent but growing in wisdom", "voice_profile": "Childlike wonder evolving to quiet authority", "visual_notes": "Bioluminescent orb with internal structure visible. Color shifts from dim amber to radiant gold.", "motivation_notes": "Survival → Understanding → Purpose → Service", "arc_summary": "From depleted organelle to awakened energy being"},
        {"name": "The Signal", "role": "Catalyst", "description": "The scalar energy field personified as a presence. Not a character with a face — more a wave, a resonance, a calling.", "personality": "Patient, vast, impersonal but benevolent", "voice_profile": "No voice — expressed through harmonic frequencies and spatial audio", "visual_notes": "Standing wave patterns, golden ratio spirals, interference patterns in light", "motivation_notes": "Exists to activate, not to persuade", "arc_summary": "Constant presence that Mito learns to perceive"},
    ]
    for c in chars_data:
        c["id"] = new_id()
        c["project_id"] = pid
        c["created_at"] = utcnow()
        c["identity_images"] = []
        c["relationships"] = []
        c["tags"] = []
    await db.characters.insert_many(chars_data)

    scenes_data = [
        {"scene_number": 1, "title": "Diminished Light", "synopsis": "Mito exists in a depleted cell. Low energy, damaged environment. We see the cost of toxicity.", "emotional_zone": "desolate", "narrative_purpose": "Establish stakes — what happens when cellular health fails", "dramatic_tension": 3},
        {"scene_number": 2, "title": "The First Pulse", "synopsis": "A faint signal reaches Mito. Something external, something new. The scalar field makes first contact.", "emotional_zone": "liminal", "narrative_purpose": "Inciting incident — hope enters the narrative", "dramatic_tension": 5},
        {"scene_number": 3, "title": "The Awakening", "synopsis": "Mito enters the scalar field. Perception expands. The cell begins to regenerate.", "emotional_zone": "revelatory", "narrative_purpose": "Transformation — the core thesis made visible", "dramatic_tension": 8},
        {"scene_number": 4, "title": "The Network", "synopsis": "Mito discovers it's connected to millions of others. Neural pathways light up. Collective healing begins.", "emotional_zone": "transcendent", "narrative_purpose": "Scale shift — from individual to collective", "dramatic_tension": 9},
        {"scene_number": 5, "title": "Radiance", "synopsis": "The cell is restored. Mito pulses with full energy. A new signal goes out — calling the next cell.", "emotional_zone": "triumphant", "narrative_purpose": "Resolution and continuation — healing propagates", "dramatic_tension": 7},
    ]
    world_list = await db.worlds.find({"project_id": pid}, {"_id": 0, "id": 1, "name": 1}).to_list(10)
    world_map = {w["name"]: w["id"] for w in world_list}
    scene_world_map = {1: "The Wasteland", 2: "The Awakening Chamber", 3: "The Scalar Field", 4: "The Neural Network", 5: "The Cellular Interior"}

    char_list = await db.characters.find({"project_id": pid}, {"_id": 0, "id": 1}).to_list(10)
    char_ids = [c["id"] for c in char_list]

    for s in scenes_data:
        s["id"] = new_id()
        s["project_id"] = pid
        s["created_at"] = utcnow()
        wname = scene_world_map.get(s["scene_number"])
        s["world_id"] = world_map.get(wname, "")
        s["character_ids"] = char_ids
        s["time_of_day"] = ""
        s["weather"] = ""
        s["lighting"] = ""
        s["director_notes"] = ""
    await db.scenes.insert_many(scenes_data)

    shot_num = 1
    shots_to_insert = []
    scene_list = await db.scenes.find({"project_id": pid}, {"_id": 0}).sort("scene_number", 1).to_list(20)
    shots_per_scene = [
        [("extreme_wide", "dolly_in", 8, "Vast depleted landscape. Mito barely visible."), ("close", "static", 5, "Mito's dim glow flickering."), ("medium", "pan_left", 6, "Damaged structures around Mito.")],
        [("medium", "static", 5, "Mito senses something. Slight brightening."), ("wide", "crane_up", 7, "The scalar pulse arrives — visible wave."), ("close", "dolly_in", 6, "Mito turns toward the signal.")],
        [("extreme_wide", "orbit", 8, "Mito enters the scalar field. Explosion of light."), ("close", "static", 5, "Mito's internal structure transforming."), ("medium_wide", "tracking", 7, "Energy flowing through the cell.")],
        [("extreme_wide", "crane_up", 8, "Neural network revealed. Millions of connections."), ("medium", "tracking", 6, "Following the signal along pathways."), ("wide", "orbit", 8, "Collective activation — cells lighting up.")],
        [("medium", "dolly_out", 6, "Mito at full radiance."), ("wide", "crane_up", 7, "The restored cell, vibrant and alive."), ("extreme_wide", "static", 8, "A new signal goes out. The cycle continues.")],
    ]
    for idx, scene in enumerate(scene_list):
        for framing, movement, dur, desc in shots_per_scene[idx]:
            shots_to_insert.append({
                "id": new_id(), "project_id": pid, "scene_id": scene["id"],
                "shot_number": shot_num, "duration_target_sec": dur,
                "framing": framing, "camera_movement": movement, "camera_notes": "",
                "description": desc, "intent": "", "constraint": "", "emission": "",
                "sound_design": "", "volume_layers": "", "spatial": "", "narrative": "", "exclude": "",
                "production_status": "concept", "reference_frame_url": "", "generated_asset_url": "",
                "notes": "", "ai_generation_log": [], "created_at": utcnow()
            })
            shot_num += 1
    if shots_to_insert:
        await db.shots.insert_many(shots_to_insert)

    return {"status": "seeded", "project_id": pid, "worlds": len(worlds_data), "characters": len(chars_data), "scenes": len(scenes_data), "shots": len(shots_to_insert)}

# ==================== APP SETUP ====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
