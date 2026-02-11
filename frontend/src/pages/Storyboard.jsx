import { useState, useEffect, useCallback } from 'react';
import { scenes as scenesApi, shots as shotsApi, worlds as worldsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clapperboard, Clock, Camera, Move, ChevronDown, ChevronRight, Plus, Trash2, Sparkles, Image, ArrowLeftRight } from 'lucide-react';
import ShotDetail from '@/pages/ShotDetail';

const ZONE_COLORS = {
  intimate: 'bg-amber-500/10 text-amber-400', contemplative: 'bg-indigo-500/10 text-indigo-400',
  tense: 'bg-red-500/10 text-red-400', revelatory: 'bg-violet-500/10 text-violet-400',
  chaotic: 'bg-orange-500/10 text-orange-400', transcendent: 'bg-yellow-500/10 text-yellow-300',
  desolate: 'bg-zinc-500/10 text-zinc-400', triumphant: 'bg-emerald-500/10 text-emerald-400',
  liminal: 'bg-cyan-500/10 text-cyan-400',
};
const STAGE_COLORS = {
  concept: 'bg-indigo-500/10 text-indigo-400', world_built: 'bg-violet-500/10 text-violet-400',
  blocked: 'bg-amber-500/10 text-amber-400', generated: 'bg-cyan-500/10 text-cyan-400',
  audio_layered: 'bg-pink-500/10 text-pink-400', mixed: 'bg-orange-500/10 text-orange-400',
  final: 'bg-emerald-500/10 text-emerald-400',
};
const ZONES = ["intimate","contemplative","tense","revelatory","chaotic","transcendent","desolate","triumphant","liminal"];
const formatDur = (s) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

function AddSceneDialog({ projectId, worldList, nextNumber, onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ scene_number: nextNumber, title: '', synopsis: '', emotional_zone: 'contemplative', world_id: '', dramatic_tension: 5, narrative_purpose: '' });

  useEffect(() => { setForm(f => ({ ...f, scene_number: nextNumber })); }, [nextNumber]);

  const submit = async () => {
    if (!form.title.trim()) { toast.error('Scene title required'); return; }
    await scenesApi.create(projectId, { ...form, character_ids: [], time_of_day: '', weather: '', lighting: '', director_notes: '' });
    toast.success(`Scene "${form.title}" created`);
    setOpen(false);
    setForm({ scene_number: nextNumber + 1, title: '', synopsis: '', emotional_zone: 'contemplative', world_id: '', dramatic_tension: 5, narrative_purpose: '' });
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-sm font-heading uppercase tracking-wider text-sm bg-indigo-600 hover:bg-indigo-500" data-testid="add-scene-btn">
          <Plus className="w-4 h-4 mr-2" /> Add Scene
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0a0a0a] border-zinc-800 max-w-lg">
        <DialogHeader><DialogTitle className="font-heading uppercase text-white">New Scene</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">#</label>
              <Input type="number" value={form.scene_number} onChange={e => setForm({...form, scene_number: parseInt(e.target.value)||1})} className="bg-black/50 border-zinc-800 font-mono text-sm" />
            </div>
            <div className="col-span-3">
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Title *</label>
              <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Scene title" className="bg-black/50 border-zinc-800 font-mono text-sm" data-testid="scene-title-input" />
            </div>
          </div>
          <Textarea value={form.synopsis} onChange={e => setForm({...form, synopsis: e.target.value})} placeholder="Synopsis" className="bg-black/50 border-zinc-800 font-mono text-sm" rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Zone</label>
              <Select value={form.emotional_zone} onValueChange={v => setForm({...form, emotional_zone: v})}>
                <SelectTrigger className="bg-black/50 border-zinc-800 font-mono text-sm h-9 rounded-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">{ZONES.map(z => <SelectItem key={z} value={z} className="font-mono text-sm">{z}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">World</label>
              <Select value={form.world_id || 'none'} onValueChange={v => setForm({...form, world_id: v === 'none' ? '' : v})}>
                <SelectTrigger className="bg-black/50 border-zinc-800 font-mono text-sm h-9 rounded-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="none" className="font-mono text-sm">None</SelectItem>
                  {worldList.map(w => <SelectItem key={w.id} value={w.id} className="font-mono text-sm">{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Tension (1-10): {form.dramatic_tension}</label>
            <input type="range" min={1} max={10} value={form.dramatic_tension} onChange={e => setForm({...form, dramatic_tension: parseInt(e.target.value)})} className="w-full" />
          </div>
          <Button onClick={submit} className="w-full rounded-sm font-heading uppercase bg-indigo-600 hover:bg-indigo-500" data-testid="save-scene-btn">Create Scene</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddShotDialog({ projectId, sceneId, nextNumber, onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ scene_id: sceneId, shot_number: nextNumber, description: '', framing: 'medium', camera_movement: 'static', duration_target_sec: 5 });

  useEffect(() => { setForm(f => ({ ...f, scene_id: sceneId, shot_number: nextNumber })); }, [sceneId, nextNumber]);

  const submit = async () => {
    if (!form.description.trim()) { toast.error('Shot description required'); return; }
    await shotsApi.create(projectId, form);
    toast.success(`Shot #${form.shot_number} created`);
    setOpen(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-sm font-mono text-[10px] text-zinc-600 hover:text-indigo-400 h-7 px-2" data-testid={`add-shot-${sceneId}`}>
          <Plus className="w-3 h-3 mr-1" /> Shot
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0a0a0a] border-zinc-800 max-w-md">
        <DialogHeader><DialogTitle className="font-heading uppercase text-white text-sm">New Shot</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div><label className="font-mono text-[10px] uppercase text-zinc-500 mb-1 block">#</label>
              <Input type="number" value={form.shot_number} onChange={e => setForm({...form, shot_number: parseInt(e.target.value)||1})} className="bg-black/50 border-zinc-800 font-mono text-sm" /></div>
            <div><label className="font-mono text-[10px] uppercase text-zinc-500 mb-1 block">Duration</label>
              <Input type="number" value={form.duration_target_sec} onChange={e => setForm({...form, duration_target_sec: parseFloat(e.target.value)||5})} className="bg-black/50 border-zinc-800 font-mono text-sm" /></div>
            <div><label className="font-mono text-[10px] uppercase text-zinc-500 mb-1 block">Framing</label>
              <Select value={form.framing} onValueChange={v => setForm({...form, framing: v})}>
                <SelectTrigger className="bg-black/50 border-zinc-800 font-mono text-sm h-9 rounded-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {["extreme_wide","wide","medium_wide","medium","medium_close","close","extreme_close"].map(f => <SelectItem key={f} value={f} className="font-mono text-sm">{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Shot description" className="bg-black/50 border-zinc-800 font-mono text-sm" rows={2} data-testid="shot-desc-input" />
          <Button onClick={submit} className="w-full rounded-sm font-heading uppercase bg-indigo-600 hover:bg-indigo-500" data-testid="save-shot-btn">Create Shot</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Storyboard({ projectId, onUpdate, onCompileShot }) {
  const [sceneList, setSceneList] = useState([]);
  const [shotMap, setShotMap] = useState({});
  const [worldMap, setWorldMap] = useState({});
  const [worldList, setWorldList] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [selectedShot, setSelectedShot] = useState(null);

  const load = useCallback(async () => {
    const [sc, sh, wl] = await Promise.all([scenesApi.list(projectId), shotsApi.list(projectId), worldsApi.list(projectId)]);
    setSceneList(sc);
    setWorldList(wl);
    const wm = {}; wl.forEach(w => { wm[w.id] = w; }); setWorldMap(wm);
    const sm = {}; sh.forEach(s => { if (!sm[s.scene_id]) sm[s.scene_id] = []; sm[s.scene_id].push(s); });
    Object.values(sm).forEach(arr => arr.sort((a, b) => a.shot_number - b.shot_number));
    setShotMap(sm);
    const exp = {}; sc.forEach(s => { exp[s.id] = true; });
    setExpanded(prev => Object.keys(prev).length ? prev : exp);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const allShots = Object.values(shotMap).flat();
  const totalDur = allShots.reduce((a, s) => a + (s.duration_target_sec || 0), 0);
  const maxShotNum = allShots.length ? Math.max(...allShots.map(s => s.shot_number)) : 0;

  const deleteScene = async (sceneId, title) => {
    if (!window.confirm(`Delete scene "${title}" and all its shots? This cannot be undone.`)) return;
    await scenesApi.delete(projectId, sceneId);
    toast.success(`Scene "${title}" deleted`);
    load(); onUpdate();
  };

  const handleCompileShot = (shot) => {
    if (onCompileShot) onCompileShot(shot, shotMap, sceneList, worldMap);
  };

  return (
    <div data-testid="storyboard">
      {/* Duration Bar */}
      <div className="glass-card rounded-sm p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Clapperboard className="w-5 h-5 text-indigo-400" />
          <span className="font-heading font-bold text-lg uppercase text-white">{sceneList.length} Scenes</span>
          <span className="font-mono text-xs text-zinc-500">{allShots.length} shots</span>
        </div>
        <div className="flex items-center gap-3">
          <AddSceneDialog projectId={projectId} worldList={worldList} nextNumber={sceneList.length + 1} onCreated={() => { load(); onUpdate(); }} />
          <Clock className="w-4 h-4 text-zinc-500 ml-4" />
          <span className="font-mono text-sm text-white">{formatDur(totalDur)}</span>
          <span className="font-mono text-xs text-zinc-600">/ 5:00 target</span>
          <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className={`h-full transition-all ${totalDur > 300 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min((totalDur / 300) * 100, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Scene List */}
      <div className="space-y-4">
        {sceneList.map(scene => {
          const scenShots = shotMap[scene.id] || [];
          const sceneDur = scenShots.reduce((a, s) => a + (s.duration_target_sec || 0), 0);
          const isOpen = expanded[scene.id];
          const world = worldMap[scene.world_id];
          const maxInScene = scenShots.length ? Math.max(...scenShots.map(s => s.shot_number)) : maxShotNum;

          return (
            <div key={scene.id} className="glass-card rounded-sm overflow-hidden" data-testid={`scene-${scene.id}`}>
              <button onClick={() => toggle(scene.id)} className="w-full flex items-center gap-4 p-4 hover:bg-zinc-900/50 transition-colors text-left" data-testid={`scene-toggle-${scene.id}`}>
                {isOpen ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-zinc-600 uppercase">Scene {scene.scene_number}</span>
                    <h3 className="font-heading font-bold text-lg uppercase tracking-tight text-white">{scene.title}</h3>
                    <Badge className={`rounded-sm font-mono text-[9px] ${ZONE_COLORS[scene.emotional_zone] || ''}`}>{scene.emotional_zone}</Badge>
                    {world && <Badge variant="secondary" className="rounded-sm font-mono text-[9px] bg-zinc-900 text-cyan-400">{world.name}</Badge>}
                  </div>
                  <p className="text-xs text-zinc-600 mt-1 line-clamp-1">{scene.synopsis}</p>
                </div>
                <div className="text-right mr-2">
                  <p className="font-mono text-xs text-zinc-400">{scenShots.length} shots</p>
                  <p className="font-mono text-[10px] text-zinc-600">{formatDur(sceneDur)}</p>
                </div>
                <div className="w-16 flex items-center gap-0.5">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className={`h-3 w-1 rounded-full ${i < scene.dramatic_tension ? 'bg-red-500' : 'bg-zinc-800'}`} />
                  ))}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-zinc-900/50">
                  <div className="flex items-center justify-between px-4 pt-3 pb-1">
                    <AddShotDialog projectId={projectId} sceneId={scene.id} nextNumber={maxInScene + 1} onCreated={() => { load(); onUpdate(); }} />
                    <Button variant="ghost" size="sm" onClick={() => deleteScene(scene.id, scene.title)}
                      className="rounded-sm font-mono text-[10px] text-zinc-700 hover:text-red-400 h-7 px-2" data-testid={`delete-scene-${scene.id}`}>
                      <Trash2 className="w-3 h-3 mr-1" /> Delete Scene
                    </Button>
                  </div>
                  {scenShots.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4 pt-2">
                      {scenShots.map(shot => (
                        <div key={shot.id} onClick={() => setSelectedShot(shot.id)}
                          className="bg-zinc-950/50 rounded-sm p-4 border border-zinc-800/50 hover:border-indigo-500/30 transition-colors cursor-pointer group"
                          data-testid={`shot-card-${shot.id}`}>
                          {/* Thumbnail row */}
                          {(shot.reference_frame_url || shot.first_frame_url || (shot.reference_images && shot.reference_images.length > 0)) && (
                            <div className="flex gap-1 mb-2">
                              {[shot.reference_frame_url, shot.first_frame_url, ...(shot.reference_images || [])].filter(Boolean).slice(0, 3).map((url, i) => (
                                <img key={i} src={url} alt="" className="h-12 w-16 object-cover rounded-sm border border-zinc-800" onError={e => e.target.style.display='none'} />
                              ))}
                            </div>
                          )}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-zinc-600">#{shot.shot_number}</span>
                              <Badge className={`rounded-sm font-mono text-[9px] ${STAGE_COLORS[shot.production_status] || ''}`}>{shot.production_status}</Badge>
                            </div>
                            <span className="font-mono text-[10px] text-zinc-600">{shot.duration_target_sec}s</span>
                          </div>
                          <p className="text-sm text-zinc-400 mb-2 line-clamp-2">{shot.description}</p>
                          <div className="flex items-center gap-3 text-[10px] text-zinc-600 font-mono">
                            <span className="flex items-center gap-1"><Camera className="w-3 h-3" />{shot.framing}</span>
                            <span className="flex items-center gap-1"><Move className="w-3 h-3" />{shot.camera_movement}</span>
                            {shot.transition_in && shot.transition_in !== 'cut' && (
                              <span className="flex items-center gap-1"><ArrowLeftRight className="w-3 h-3" />{shot.transition_in}</span>
                            )}
                          </div>
                          {/* Compile button */}
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleCompileShot(shot); }}
                            className="mt-2 rounded-sm font-mono text-[9px] text-indigo-400/50 hover:text-indigo-400 h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`compile-shot-${shot.id}`}>
                            <Sparkles className="w-3 h-3 mr-1" /> Compile
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {scenShots.length === 0 && (
                    <p className="text-center text-zinc-700 font-mono text-xs py-6">No shots yet</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Shot Detail Sheet */}
      <ShotDetail
        projectId={projectId}
        shotId={selectedShot}
        open={!!selectedShot}
        onClose={() => setSelectedShot(null)}
        onUpdate={() => { load(); onUpdate(); }}
        onCompile={(shot) => handleCompileShot(shot)}
      />
    </div>
  );
}
