from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="StoryForge API", description="AI Filmmaking Production Engine", version="1.0.0")
api_router = APIRouter(prefix="/api")

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

PRODUCTION_STAGES = ["concept", "world_built", "blocked", "generated", "audio_layered", "mixed", "final"]
EMOTIONAL_ZONES = ["intimate", "contemplative", "tense", "revelatory", "chaotic", "transcendent", "desolate", "triumphant", "liminal"]
FRAMINGS = ["extreme_wide", "wide", "medium_wide", "medium", "medium_close", "close", "extreme_close"]
CAMERA_MOVEMENTS = ["static", "pan_left", "pan_right", "tilt_up", "tilt_down", "dolly_in", "dolly_out", "crane_up", "crane_down", "orbit", "handheld", "tracking"]
TRANSITION_TYPES = ["cut", "dissolve", "match_cut", "smash_cut", "fade_to_black", "fade_from_black", "wipe", "continuous"]

def utcnow(): return datetime.now(timezone.utc).isoformat()
def new_id(): return str(uuid.uuid4())

async def get_api_key():
    secret = await db.secrets.find_one({"key": "EMERGENT_LLM_KEY"}, {"_id": 0})
    if secret and secret.get("value"):
        return secret["value"]
    return os.environ.get("EMERGENT_LLM_KEY", "")

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
    target_duration_sec: float = 300.0

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
    first_frame_url: str = ""
    last_frame_url: str = ""
    transition_in: str = "cut"
    transition_out: str = "cut"
    reference_images: List[str] = []
    notes: str = ""

class ShotUpdate(BaseModel):
    shot_number: Optional[int] = None
    scene_id: Optional[str] = None
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
    first_frame_url: Optional[str] = None
    last_frame_url: Optional[str] = None
    transition_in: Optional[str] = None
    transition_out: Optional[str] = None
    reference_images: Optional[List[str]] = None
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
    reference_images: List[str] = []
    prev_shot_last_frame: str = ""
    next_shot_first_frame: str = ""
    shot_id: Optional[str] = None

class ImageDescribeRequest(BaseModel):
    image_url: str
    entity_type: str = "world"
    additional_context: str = ""

class SecretUpdate(BaseModel):
    key: str
    value: str

class BatchStatusUpdate(BaseModel):
    shot_ids: List[str]
    status: str

def clean_doc(doc):
    if doc and "_id" in doc:
        del doc["_id"]
    return doc

def clean_docs(docs):
    return [clean_doc(d) for d in docs]

# ==================== HEALTH & STARTUP ====================

@api_router.get("/health")
async def health_check():
    try:
        await db.command("ping")
        return {"status": "healthy", "database": "connected", "version": "1.0.0"}
    except Exception:
        raise HTTPException(503, "Database unavailable")

@app.on_event("startup")
async def create_indexes():
    await db.projects.create_index("id", unique=True)
    await db.worlds.create_index([("project_id", 1), ("id", 1)])
    await db.characters.create_index([("project_id", 1), ("id", 1)])
    await db.objects.create_index([("project_id", 1), ("id", 1)])
    await db.scenes.create_index([("project_id", 1), ("scene_number", 1)])
    await db.shots.create_index([("project_id", 1), ("scene_id", 1), ("shot_number", 1)])
    await db.shots.create_index([("project_id", 1), ("production_status", 1)])
    await db.compilations.create_index([("project_id", 1), ("shot_id", 1)])
    await db.secrets.create_index("key", unique=True)
    logger.info("MongoDB indexes created")

# ==================== SECRETS MANAGEMENT ====================

@api_router.get("/secrets")
async def list_secrets():
    secrets = await db.secrets.find({}, {"_id": 0}).to_list(50)
    return [{"key": s["key"], "value": s["value"][:8] + "..." if len(s.get("value", "")) > 8 else s.get("value", ""), "set": bool(s.get("value"))} for s in secrets]

@api_router.put("/secrets")
async def update_secret(data: SecretUpdate):
    await db.secrets.update_one({"key": data.key}, {"$set": {"key": data.key, "value": data.value, "updated_at": utcnow()}}, upsert=True)
    return {"status": "updated", "key": data.key}

@api_router.delete("/secrets/{key}")
async def delete_secret(key: str):
    await db.secrets.delete_one({"key": key})
    return {"status": "deleted"}

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
        pid = p["id"]
        p["world_count"] = await db.worlds.count_documents({"project_id": pid})
        p["character_count"] = await db.characters.count_documents({"project_id": pid})
        p["shot_count"] = await db.shots.count_documents({"project_id": pid})
        shots = await db.shots.find({"project_id": pid}, {"_id": 0, "production_status": 1, "duration_target_sec": 1}).to_list(1000)
        total = len(shots)
        done = sum(1 for s in shots if s.get("production_status") == "final")
        p["completion_pct"] = round((done / total * 100) if total > 0 else 0, 1)
        p["total_duration"] = sum(s.get("duration_target_sec", 0) for s in shots)
        p["target_duration_sec"] = p.get("target_duration_sec", 300)
    return projects

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str):
    doc = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Project not found")
    pid = project_id
    doc["world_count"] = await db.worlds.count_documents({"project_id": pid})
    doc["character_count"] = await db.characters.count_documents({"project_id": pid})
    doc["shot_count"] = await db.shots.count_documents({"project_id": pid})
    doc["scene_count"] = await db.scenes.count_documents({"project_id": pid})
    doc["object_count"] = await db.objects.count_documents({"project_id": pid})
    shots = await db.shots.find({"project_id": pid}, {"_id": 0, "production_status": 1, "duration_target_sec": 1}).to_list(1000)
    done = sum(1 for s in shots if s.get("production_status") == "final")
    doc["completion_pct"] = round((done / len(shots) * 100) if shots else 0, 1)
    doc["total_duration"] = sum(s.get("duration_target_sec", 0) for s in shots)
    doc["stage_counts"] = {stage: sum(1 for s in shots if s.get("production_status") == stage) for stage in PRODUCTION_STAGES}
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
    for coll in [db.projects, db.worlds, db.characters, db.objects, db.scenes, db.shots, db.compilations]:
        q = {"id": project_id} if coll == db.projects else {"project_id": project_id}
        if coll == db.projects:
            await coll.delete_one(q)
        else:
            await coll.delete_many(q)
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
    if not doc: raise HTTPException(404, "World not found")
    return doc

@api_router.put("/projects/{project_id}/worlds/{world_id}")
async def update_world(project_id: str, world_id: str, data: WorldCreate):
    result = await db.worlds.update_one({"id": world_id, "project_id": project_id}, {"$set": data.model_dump()})
    if result.matched_count == 0: raise HTTPException(404, "World not found")
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

@api_router.get("/projects/{project_id}/characters/{char_id}")
async def get_character(project_id: str, char_id: str):
    doc = await db.characters.find_one({"id": char_id, "project_id": project_id}, {"_id": 0})
    if not doc: raise HTTPException(404, "Character not found")
    return doc

@api_router.put("/projects/{project_id}/characters/{char_id}")
async def update_character(project_id: str, char_id: str, data: CharacterCreate):
    result = await db.characters.update_one({"id": char_id, "project_id": project_id}, {"$set": data.model_dump()})
    if result.matched_count == 0: raise HTTPException(404, "Character not found")
    return await get_character(project_id, char_id)

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

@api_router.get("/projects/{project_id}/objects/{obj_id}")
async def get_object(project_id: str, obj_id: str):
    doc = await db.objects.find_one({"id": obj_id, "project_id": project_id}, {"_id": 0})
    if not doc: raise HTTPException(404, "Object not found")
    return doc

@api_router.put("/projects/{project_id}/objects/{obj_id}")
async def update_object(project_id: str, obj_id: str, data: ObjectCreate):
    result = await db.objects.update_one({"id": obj_id, "project_id": project_id}, {"$set": data.model_dump()})
    if result.matched_count == 0: raise HTTPException(404, "Object not found")
    return await get_object(project_id, obj_id)

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

@api_router.get("/projects/{project_id}/scenes/{scene_id}")
async def get_scene(project_id: str, scene_id: str):
    doc = await db.scenes.find_one({"id": scene_id, "project_id": project_id}, {"_id": 0})
    if not doc: raise HTTPException(404, "Scene not found")
    return doc

@api_router.put("/projects/{project_id}/scenes/{scene_id}")
async def update_scene(project_id: str, scene_id: str, data: SceneCreate):
    result = await db.scenes.update_one({"id": scene_id, "project_id": project_id}, {"$set": data.model_dump()})
    if result.matched_count == 0: raise HTTPException(404, "Scene not found")
    return await get_scene(project_id, scene_id)

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
async def list_shots(project_id: str, scene_id: Optional[str] = None, status: Optional[str] = None):
    query = {"project_id": project_id}
    if scene_id: query["scene_id"] = scene_id
    if status: query["production_status"] = status
    return clean_docs(await db.shots.find(query, {"_id": 0}).sort("shot_number", 1).to_list(1000))

@api_router.get("/projects/{project_id}/shots/{shot_id}")
async def get_shot(project_id: str, shot_id: str):
    doc = await db.shots.find_one({"id": shot_id, "project_id": project_id}, {"_id": 0})
    if not doc: raise HTTPException(404, "Shot not found")
    return doc

@api_router.put("/projects/{project_id}/shots/{shot_id}")
async def update_shot(project_id: str, shot_id: str, data: ShotUpdate):
    update = {k: v for k, v in data.model_dump(exclude_unset=True).items()}
    if not update: raise HTTPException(400, "No fields to update")
    result = await db.shots.update_one({"id": shot_id, "project_id": project_id}, {"$set": update})
    if result.matched_count == 0: raise HTTPException(404, "Shot not found")
    return await get_shot(project_id, shot_id)

@api_router.patch("/projects/{project_id}/shots/{shot_id}/status")
async def update_shot_status(project_id: str, shot_id: str, status: str = Query(...)):
    if status not in PRODUCTION_STAGES:
        raise HTTPException(400, f"Invalid status. Must be one of: {PRODUCTION_STAGES}")
    result = await db.shots.update_one({"id": shot_id, "project_id": project_id}, {"$set": {"production_status": status}})
    if result.matched_count == 0: raise HTTPException(404, "Shot not found")
    return {"status": "updated", "new_status": status}

@api_router.post("/projects/{project_id}/shots/batch-status")
async def batch_update_status(project_id: str, data: BatchStatusUpdate):
    if data.status not in PRODUCTION_STAGES:
        raise HTTPException(400, f"Invalid status")
    result = await db.shots.update_many(
        {"id": {"$in": data.shot_ids}, "project_id": project_id},
        {"$set": {"production_status": data.status}}
    )
    return {"status": "updated", "modified": result.modified_count}

@api_router.delete("/projects/{project_id}/shots/{shot_id}")
async def delete_shot(project_id: str, shot_id: str):
    await db.shots.delete_one({"id": shot_id, "project_id": project_id})
    return {"status": "deleted"}

# ==================== SHOT REORDER ====================

class ShotReorder(BaseModel):
    shot_ids: List[str]

@api_router.post("/projects/{project_id}/shots/reorder")
async def reorder_shots(project_id: str, data: ShotReorder):
    """Reorder shots - shot_ids list defines the new order (index+1 = shot_number)."""
    for i, sid in enumerate(data.shot_ids):
        await db.shots.update_one({"id": sid, "project_id": project_id}, {"$set": {"shot_number": i + 1}})
    return {"status": "reordered", "count": len(data.shot_ids)}

# ==================== BATCH COMPILE ====================

class BatchCompileRequest(BaseModel):
    shot_ids: List[str]

@api_router.post("/projects/{project_id}/batch-compile")
async def batch_compile(project_id: str, data: BatchCompileRequest):
    """Compile multiple shots at once. Returns list of results."""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project: raise HTTPException(404, "Project not found")

    all_shots = clean_docs(await db.shots.find({"project_id": project_id}, {"_id": 0}).sort("shot_number", 1).to_list(1000))
    shot_index = {s["id"]: (i, s) for i, s in enumerate(all_shots)}
    scenes_map = {}
    for sc in clean_docs(await db.scenes.find({"project_id": project_id}, {"_id": 0}).to_list(100)):
        scenes_map[sc["id"]] = sc
    worlds_map = {}
    for w in clean_docs(await db.worlds.find({"project_id": project_id}, {"_id": 0}).to_list(100)):
        worlds_map[w["id"]] = w
    chars = clean_docs(await db.characters.find({"project_id": project_id}, {"_id": 0}).to_list(100))

    results = []
    api_key = await get_api_key()
    if not api_key:
        raise HTTPException(400, "No API key configured")

    for sid in data.shot_ids:
        if sid not in shot_index:
            results.append({"shot_id": sid, "error": "Shot not found"})
            continue

        idx, shot = shot_index[sid]
        scene = scenes_map.get(shot.get("scene_id", ""), {})
        world = worlds_map.get(scene.get("world_id", ""), {})
        prev_frame = all_shots[idx-1].get("last_frame_url", "") if idx > 0 else ""
        next_frame = all_shots[idx+1].get("first_frame_url", "") if idx < len(all_shots)-1 else ""

        compile_data = CompileRequest(
            project_id=project_id,
            scene_description=shot.get("description", ""),
            world_id=scene.get("world_id", ""),
            character_ids=scene.get("character_ids", []),
            emotional_zone=scene.get("emotional_zone", "contemplative"),
            framing=shot.get("framing", "medium"),
            camera_movement=shot.get("camera_movement", "static"),
            reference_images=shot.get("reference_images", []),
            prev_shot_last_frame=prev_frame,
            next_shot_first_frame=next_frame,
            shot_id=sid,
        )

        try:
            result = await compile_scene(project_id, compile_data)
            results.append({"shot_id": sid, "shot_number": shot["shot_number"], **result})
        except Exception as e:
            results.append({"shot_id": sid, "shot_number": shot["shot_number"], "error": str(e)})

    return {"status": "batch_compiled", "results": results, "total": len(results)}

# ==================== NOTION SYNC ====================

CAMERA_NOTION_MAP = {"static":"Static","dolly_in":"Dolly in","dolly_out":"Dolly out","orbit":"Orbit","pan_left":"Pan","pan_right":"Pan","crane_up":"Crane","crane_down":"Crane","tracking":"Handheld","tilt_up":"Tilt","tilt_down":"Tilt","handheld":"Handheld"}
FRAMING_NOTION_MAP = {"extreme_wide":"Extreme wide","wide":"Wide","medium_wide":"Medium","medium":"Medium","medium_close":"Close","close":"Close","extreme_close":"Extreme close"}
STATUS_NOTION_MAP = {"concept":"Not Started","world_built":"Not Started","blocked":"Not Started","generated":"In Progress","audio_layered":"In Progress","mixed":"Complete","final":"Complete"}

async def get_notion_creds():
    token_doc = await db.secrets.find_one({"key": "NOTION_API_KEY"}, {"_id": 0})
    db_doc = await db.secrets.find_one({"key": "NOTION_DB_ID"}, {"_id": 0})
    token = token_doc["value"] if token_doc else ""
    db_id = db_doc["value"] if db_doc else ""
    return token, db_id

@api_router.post("/projects/{project_id}/notion/push")
async def notion_push_status(project_id: str):
    """Push all shot statuses directly to the Notion database."""
    import httpx

    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project: raise HTTPException(404, "Project not found")

    notion_token, notion_db_id = await get_notion_creds()
    if not notion_token or not notion_db_id:
        raise HTTPException(400, "Notion credentials not set. Go to Settings > Secrets and set NOTION_API_KEY and NOTION_DB_ID.")

    scenes = {s["id"]: s for s in clean_docs(await db.scenes.find({"project_id": project_id}, {"_id": 0}).to_list(100))}
    shots = clean_docs(await db.shots.find({"project_id": project_id}, {"_id": 0}).sort("shot_number", 1).to_list(1000))

    headers = {"Authorization": f"Bearer {notion_token}", "Notion-Version": "2022-06-28", "Content-Type": "application/json"}

    # First, query existing pages to check for updates vs creates
    existing = {}
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"https://api.notion.com/v1/databases/{notion_db_id}/query", headers=headers, json={"page_size": 100})
        if resp.status_code == 200:
            for page in resp.json().get("results", []):
                sf_id_prop = page.get("properties", {}).get("StoryForge ID", {}).get("rich_text", [])
                if sf_id_prop:
                    sf_id = sf_id_prop[0].get("text", {}).get("content", "")
                    if sf_id:
                        existing[sf_id] = page["id"]

    created = 0
    updated = 0
    errors = 0

    async with httpx.AsyncClient() as client:
        for shot in shots:
            scene = scenes.get(shot.get("scene_id", ""), {})
            props = {
                "Name": {"title": [{"text": {"content": shot.get("description", "")[:100]}}]},
                "Shot Number": {"number": shot["shot_number"]},
                "Scene": {"select": {"name": scene.get("title", "Unknown")}},
                "Status": {"status": {"name": STATUS_NOTION_MAP.get(shot.get("production_status", "concept"), "Not Started")}},
                "Framing": {"select": {"name": FRAMING_NOTION_MAP.get(shot.get("framing", ""), "Medium")}},
                "Camera": {"select": {"name": CAMERA_NOTION_MAP.get(shot.get("camera_movement", ""), "Static")}},
                "Duration": {"number": shot.get("duration_target_sec", 0)},
                "Zone": {"select": {"name": scene.get("emotional_zone", "contemplative")}},
                "StoryForge ID": {"rich_text": [{"text": {"content": shot["id"]}}]},
                "Project": {"select": {"name": project.get("name", "")[:100]}},
            }

            if shot["id"] in existing:
                # Update existing page
                resp = await client.patch(f"https://api.notion.com/v1/pages/{existing[shot['id']]}", headers=headers, json={"properties": props})
                if resp.status_code == 200:
                    updated += 1
                else:
                    errors += 1
                    logger.error(f"Notion update failed for shot #{shot['shot_number']}: {resp.text[:200]}")
            else:
                # Create new page
                resp = await client.post("https://api.notion.com/v1/pages", headers=headers, json={"parent": {"database_id": notion_db_id}, "properties": props})
                if resp.status_code == 200:
                    created += 1
                else:
                    errors += 1
                    logger.error(f"Notion create failed for shot #{shot['shot_number']}: {resp.text[:200]}")

    await db.notion_sync_log.insert_one({"id": new_id(), "project_id": project_id, "timestamp": utcnow(), "action": "push", "created": created, "updated": updated, "errors": errors})

    return {"status": "pushed", "created": created, "updated": updated, "errors": errors, "total": len(shots)}


# ==================== FRAME CONTINUITY ====================

@api_router.get("/projects/{project_id}/continuity")
async def get_continuity_chain(project_id: str):
    """Returns all shots in order with frame continuity data for the entire project."""
    shots = clean_docs(await db.shots.find({"project_id": project_id}, {"_id": 0}).sort("shot_number", 1).to_list(1000))
    chain = []
    for i, shot in enumerate(shots):
        entry = {
            "shot_id": shot["id"],
            "shot_number": shot["shot_number"],
            "description": shot.get("description", ""),
            "first_frame_url": shot.get("first_frame_url", ""),
            "last_frame_url": shot.get("last_frame_url", ""),
            "transition_in": shot.get("transition_in", "cut"),
            "transition_out": shot.get("transition_out", "cut"),
            "prev_shot_last_frame": shots[i - 1].get("last_frame_url", "") if i > 0 else "",
            "next_shot_first_frame": shots[i + 1].get("first_frame_url", "") if i < len(shots) - 1 else "",
        }
        chain.append(entry)
    return chain

# ==================== AI IMAGE DESCRIPTION ====================

@api_router.post("/projects/{project_id}/describe-image")
async def describe_image(project_id: str, data: ImageDescribeRequest):
    """AI describes an image URL and generates structured entity description."""
    api_key = await get_api_key()
    if not api_key:
        raise HTTPException(400, "No API key configured. Set EMERGENT_LLM_KEY in Settings > Secrets.")

    prompts_by_type = {
        "world": "Describe this image as a WORLD/LOCATION for an animated production. Output JSON: {\"name\": \"\", \"description\": \"\", \"emotional_zone\": \"\", \"atmosphere\": \"\", \"lighting_notes\": \"\", \"spatial_character\": \"\", \"time_of_day\": \"\", \"weather\": \"\"}",
        "character": "Describe this image as a CHARACTER for an animated production. Output JSON: {\"name\": \"\", \"role\": \"\", \"description\": \"\", \"personality\": \"\", \"visual_notes\": \"\", \"voice_profile\": \"\"}",
        "prop": "Describe this image as a PROP/OBJECT for an animated production. Output JSON: {\"name\": \"\", \"category\": \"\", \"description\": \"\", \"narrative_significance\": \"\", \"usage_notes\": \"\"}",
    }

    system_msg = f"""You are a production designer analyzing reference images for an AI-generated animated short.
{prompts_by_type.get(data.entity_type, prompts_by_type['world'])}
{f'Additional context: {data.additional_context}' if data.additional_context else ''}
Output ONLY valid JSON. Be cinematic, specific, and production-ready in your descriptions."""

    try:
        chat = LlmChat(api_key=api_key, session_id=f"describe-{new_id()}", system_message=system_msg).with_model("openai", "gpt-5.2")
        response = await chat.send_message(UserMessage(text=f"Analyze this image for production use: {data.image_url}"))
        text = response.strip()
        if text.startswith("```"): text = "\n".join(text.split("\n")[1:-1])
        result = json.loads(text)
        return {"status": "described", "entity_type": data.entity_type, "result": result, "source_image": data.image_url}
    except json.JSONDecodeError:
        return {"status": "described", "entity_type": data.entity_type, "result": {"raw_response": text}, "source_image": data.image_url}
    except Exception as e:
        raise HTTPException(500, f"Image description failed: {str(e)}")

# ==================== AI SCENE COMPILER ====================

@api_router.post("/projects/{project_id}/compile")
async def compile_scene(project_id: str, data: CompileRequest):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project: raise HTTPException(404, "Project not found")

    world_context = ""
    if data.world_id:
        world = await db.worlds.find_one({"id": data.world_id}, {"_id": 0})
        if world:
            world_context = f"\nWORLD: {world.get('name','')}\nDescription: {world.get('description','')}\nZone: {world.get('emotional_zone','')}\nAtmosphere: {world.get('atmosphere','')}\nLighting: {world.get('lighting_notes','')}\nSpatial: {world.get('spatial_character','')}"
            if world.get("reference_images"):
                world_context += f"\nWorld Reference Images: {', '.join(world['reference_images'][:3])}"

    char_context = ""
    if data.character_ids:
        chars = clean_docs(await db.characters.find({"id": {"$in": data.character_ids}, "project_id": project_id}, {"_id": 0}).to_list(20))
        for c in chars:
            char_context += f"\nCHARACTER: {c.get('name','')} ({c.get('role','')})\nDescription: {c.get('description','')}\nVisual: {c.get('visual_notes','')}\nPersonality: {c.get('personality','')}"
            if c.get("identity_images"):
                char_context += f"\nIdentity Reference: {', '.join(c['identity_images'][:2])}"

    frame_context = ""
    if data.prev_shot_last_frame:
        frame_context += f"\nFRAME CONTINUITY — Previous shot ends with this frame: {data.prev_shot_last_frame}"
        frame_context += "\nIMPORTANT: The opening of this shot must visually match/continue from the previous shot's last frame."
    if data.next_shot_first_frame:
        frame_context += f"\nFRAME CONTINUITY — Next shot begins with this frame: {data.next_shot_first_frame}"
        frame_context += "\nIMPORTANT: The ending of this shot must set up a visual bridge to the next shot's first frame."

    ref_images_context = ""
    if data.reference_images:
        ref_images_context = f"\nSHOT REFERENCE IMAGES (use as visual guidance): {', '.join(data.reference_images[:5])}"

    brand = f"\nPROJECT: {project.get('name','')}\nBrand: {project.get('brand_primary','')}\nStyle: {project.get('visual_style','')}\nCompliance: {', '.join(project.get('compliance_notes',[]))}\nForbidden: {', '.join(project.get('forbidden_elements',[]))}"

    system_prompt = """You are StoryForge Scene Compiler — expert AI cinematographer and production designer.
Generate structured prompts from natural language scene descriptions.

Output ONLY a JSON object:
{
  "image_prompt": "Detailed image generation prompt for ArtCraft/Nano Banana Pro/Midjourney. Include composition, lighting, color, mood, subjects. If reference images or frame continuity URLs are provided, reference them as visual anchors.",
  "video_prompt": "Video generation prompt for Veo/Kling/Sora. Describe motion, camera, timing, action. If frame continuity is specified, describe how this shot bridges from/to adjacent shots.",
  "audio_stack": {
    "sound_design": "Primary environmental and foley elements",
    "volume_layers": "BACKGROUND: [element] at [level] | MIDGROUND: [element] at [level] | FOREGROUND: [element] at [level]",
    "spatial": "Spatial positioning, movement, stereo/surround",
    "narrative": "Emotional beats and narrative function",
    "exclude": "Elements to exclude from audio generation"
  },
  "director_notes": "Blocking, timing, transitions, coherence notes",
  "coherence_flags": ["Any inconsistencies with world/character bible"],
  "continuity_notes": "How this shot connects visually to previous/next shots"
}

RULES:
- Honor brand config and compliance rails
- Reference established world atmosphere and lighting
- Keep characters visually consistent with identity sheets
- If frame continuity URLs are provided, explicitly describe visual matching
- Audio follows Intent → Constraint → Emission architecture
- Output ONLY valid JSON"""

    user_prompt = f"""{brand}{world_context}{char_context}{frame_context}{ref_images_context}

SHOT PARAMETERS:
Zone: {data.emotional_zone} | Framing: {data.framing} | Camera: {data.camera_movement}
Time: {data.time_of_day or project.get('default_time_of_day', 'day')}
Weather: {data.weather or project.get('default_weather', 'clear')}
{f'Context: {data.additional_context}' if data.additional_context else ''}

SCENE: {data.scene_description}

Generate production prompts as JSON."""

    try:
        api_key = await get_api_key()
        chat = LlmChat(api_key=api_key, session_id=f"compile-{new_id()}", system_message=system_prompt).with_model("openai", "gpt-5.2")
        response = await chat.send_message(UserMessage(text=user_prompt))
        text = response.strip()
        if text.startswith("```"): text = "\n".join(text.split("\n")[1:-1])
        compiled = json.loads(text)

        log_entry = {"id": new_id(), "project_id": project_id, "shot_id": data.shot_id or "", "timestamp": utcnow(), "input": data.model_dump(), "output": compiled}
        await db.compilations.insert_one(log_entry)
        del log_entry["_id"]

        return {"status": "compiled", "result": compiled, "compilation_id": log_entry["id"]}
    except json.JSONDecodeError:
        return {"status": "compiled", "result": {"raw_response": text}, "parse_error": True}
    except Exception as e:
        logger.error(f"Compilation error: {e}")
        raise HTTPException(500, f"AI compilation failed: {str(e)}")

# ==================== COMPILATION HISTORY ====================

@api_router.get("/projects/{project_id}/compilations")
async def list_compilations(project_id: str, shot_id: Optional[str] = None):
    query = {"project_id": project_id}
    if shot_id: query["shot_id"] = shot_id
    comps = clean_docs(await db.compilations.find(query, {"_id": 0}).sort("timestamp", -1).to_list(100))
    return comps

# ==================== EXPORT ====================

@api_router.get("/projects/{project_id}/export")
async def export_project(project_id: str):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project: raise HTTPException(404, "Project not found")
    project["worlds"] = clean_docs(await db.worlds.find({"project_id": project_id}, {"_id": 0}).to_list(500))
    project["characters"] = clean_docs(await db.characters.find({"project_id": project_id}, {"_id": 0}).to_list(500))
    project["objects"] = clean_docs(await db.objects.find({"project_id": project_id}, {"_id": 0}).to_list(500))
    project["scenes"] = clean_docs(await db.scenes.find({"project_id": project_id}, {"_id": 0}).sort("scene_number", 1).to_list(500))
    project["shots"] = clean_docs(await db.shots.find({"project_id": project_id}, {"_id": 0}).sort("shot_number", 1).to_list(1000))
    return project

# ==================== DASHBOARD STATS ====================

@api_router.get("/dashboard/stats")
async def dashboard_stats():
    project_count = await db.projects.count_documents({})
    total_shots = await db.shots.count_documents({})
    total_worlds = await db.worlds.count_documents({})
    total_characters = await db.characters.count_documents({})
    shots = await db.shots.find({}, {"_id": 0, "production_status": 1, "duration_target_sec": 1}).to_list(10000)
    stage_counts = {stage: sum(1 for s in shots if s.get("production_status") == stage) for stage in PRODUCTION_STAGES}
    total_duration = sum(s.get("duration_target_sec", 0) for s in shots)
    return {"project_count": project_count, "total_shots": total_shots, "total_worlds": total_worlds, "total_characters": total_characters, "stage_counts": stage_counts, "total_duration_sec": total_duration}

# ==================== ENUMS ====================

@api_router.get("/enums")
async def get_enums():
    return {"production_stages": PRODUCTION_STAGES, "emotional_zones": EMOTIONAL_ZONES, "framings": FRAMINGS, "camera_movements": CAMERA_MOVEMENTS, "transition_types": TRANSITION_TYPES}

# ==================== SEED EXAMPLE ====================

@api_router.post("/seed/example")
async def seed_example_project():
    existing = await db.projects.find_one({"name": "Example Short Film"}, {"_id": 0})
    if existing:
        return {"status": "already_seeded", "project_id": existing["id"]}

    pid = new_id()
    project = {
        "id": pid, "name": "Example Short Film",
        "brand_primary": "", "brand_secondary": "",
        "description": "A sample short film project demonstrating the StoryForgeSync workflow with multiple worlds, characters, scenes, and shots.",
        "compliance_notes": [],
        "forbidden_elements": [],
        "required_elements": ["Consistent visual style", "Clear narrative progression"],
        "visual_style": "Cinematic and visually compelling. Modern aesthetic with attention to lighting and composition.",
        "default_time_of_day": "day", "default_weather": "clear", "default_lighting": "natural",
        "default_aspect_ratio": "16:9", "target_duration_sec": 180.0,
        "model_preferences": {"image": "", "video": "", "world": ""},
        "tags": ["example", "demo", "short_film"],
        "created_at": utcnow(), "updated_at": utcnow()
    }
    await db.projects.insert_one(project)

    worlds_data = [
        {"name": "The Urban Street", "description": "A bustling city street with modern architecture, pedestrians, and vibrant storefronts.", "emotional_zone": "energetic", "atmosphere": "Busy, dynamic, full of life", "spatial_character": "urban/street-level", "lighting_notes": "Natural daylight with shadows from buildings"},
        {"name": "The Quiet Park", "description": "A peaceful park with trees, benches, and a small pond reflecting the sky.", "emotional_zone": "calm", "atmosphere": "Serene, contemplative, relaxing", "spatial_character": "open/natural", "lighting_notes": "Soft natural light filtered through leaves"},
        {"name": "The Coffee Shop", "description": "A cozy interior space with warm lighting, wooden tables, and the aroma of fresh coffee.", "emotional_zone": "intimate", "atmosphere": "Warm, inviting, comfortable", "spatial_character": "intimate/interior", "lighting_notes": "Warm ambient lighting with pendant lamps"},
    ]
    for w in worlds_data:
        w.update({"id": new_id(), "project_id": pid, "created_at": utcnow(), "marble_url": "", "reference_images": [], "time_of_day": "", "weather": "", "tags": []})
    await db.worlds.insert_many(worlds_data)

    chars_data = [
        {"name": "Alex", "role": "Protagonist", "description": "A young professional navigating life in the city, searching for meaning and connection.", "personality": "Thoughtful, introspective, hopeful", "voice_profile": "Natural, conversational, genuine", "visual_notes": "Casual modern attire, relatable appearance", "motivation_notes": "Seeking purpose and authentic human connection", "arc_summary": "From isolated to connected"},
        {"name": "Sam", "role": "Supporting", "description": "A friendly acquaintance who becomes a catalyst for change.", "personality": "Warm, open, encouraging", "voice_profile": "Friendly and approachable", "visual_notes": "Comfortable, welcoming appearance", "motivation_notes": "Naturally connects with others", "arc_summary": "The bridge to new possibilities"},
    ]
    for c in chars_data:
        c.update({"id": new_id(), "project_id": pid, "created_at": utcnow(), "identity_images": [], "relationships": [], "tags": []})
    await db.characters.insert_many(chars_data)

    scenes_data = [
        {"scene_number": 1, "title": "Morning Rush", "synopsis": "Alex navigates the busy city street, disconnected from the world around.", "emotional_zone": "energetic", "narrative_purpose": "Establish character and setting", "dramatic_tension": 4},
        {"scene_number": 2, "title": "The Encounter", "synopsis": "Alex meets Sam at the coffee shop. A moment of genuine connection.", "emotional_zone": "intimate", "narrative_purpose": "Catalyst for change", "dramatic_tension": 6},
        {"scene_number": 3, "title": "Reflection", "synopsis": "Alex sits alone in the park, contemplating the encounter and life's possibilities.", "emotional_zone": "calm", "narrative_purpose": "Internal transformation", "dramatic_tension": 5},
    ]
    wlist = await db.worlds.find({"project_id": pid}, {"_id": 0, "id": 1, "name": 1}).to_list(10)
    wmap = {w["name"]: w["id"] for w in wlist}
    swmap = {1: "The Urban Street", 2: "The Coffee Shop", 3: "The Quiet Park"}
    cids = [c["id"] for c in await db.characters.find({"project_id": pid}, {"_id": 0, "id": 1}).to_list(10)]

    for s in scenes_data:
        s.update({"id": new_id(), "project_id": pid, "created_at": utcnow(), "world_id": wmap.get(swmap.get(s["scene_number"]), ""), "character_ids": cids, "time_of_day": "", "weather": "", "lighting": "", "director_notes": ""})
    await db.scenes.insert_many(scenes_data)

    slist = await db.scenes.find({"project_id": pid}, {"_id": 0}).sort("scene_number", 1).to_list(20)
    shots_per = [
        [("wide","tracking",6,"Alex walks through crowded street, isolated among many."),("medium","dolly_in",5,"Close-up on Alex's detached expression."),("wide","pan_right",5,"The busy street continues around them.")],
        [("medium","static",5,"Alex and Sam sitting at coffee shop table."),("close","dolly_in",6,"Sam's warm smile and genuine interest."),("medium_wide","static",5,"A moment of authentic connection.")],
        [("wide","crane_up",7,"Alex sits on park bench, trees surrounding."),("close","static",5,"Alex's contemplative face, hint of a smile."),("extreme_wide","static",6,"The peaceful park, a new perspective.")],
    ]
    snum = 1
    inserts = []
    for idx, sc in enumerate(slist):
        for fr, mv, dur, desc in shots_per[idx]:
            t_in = "fade_from_black" if snum == 1 else "cut"
            t_out = "fade_to_black" if snum == 9 else ("dissolve" if idx < len(slist)-1 and shots_per[idx].index((fr,mv,dur,desc)) == len(shots_per[idx])-1 else "cut")
            inserts.append({
                "id": new_id(), "project_id": pid, "scene_id": sc["id"], "shot_number": snum,
                "duration_target_sec": dur, "framing": fr, "camera_movement": mv, "camera_notes": "",
                "description": desc, "intent": "", "constraint": "", "emission": "",
                "sound_design": "", "volume_layers": "", "spatial": "", "narrative": "", "exclude": "",
                "production_status": "concept", "reference_frame_url": "", "generated_asset_url": "",
                "first_frame_url": "", "last_frame_url": "", "transition_in": t_in, "transition_out": t_out,
                "reference_images": [], "notes": "", "ai_generation_log": [], "created_at": utcnow()
            })
            snum += 1
    if inserts: await db.shots.insert_many(inserts)

    return {"status": "seeded", "project_id": pid, "worlds": len(worlds_data), "characters": len(chars_data), "scenes": len(scenes_data), "shots": len(inserts)}

# ==================== APP ====================

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','), allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
