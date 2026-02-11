import { useState, useEffect, useCallback } from 'react';
import { scenes as scenesApi, shots as shotsApi, worlds as worldsApi, compiler, notion as notionApi } from '@/lib/api';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clapperboard, Clock, Camera, Move, ChevronDown, ChevronRight, Plus, Trash2, Sparkles, ArrowLeftRight, GripVertical, Loader2, Send, CheckSquare } from 'lucide-react';
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
const formatDur = (s) => Math.floor(s / 60) + ':' + Math.floor(s % 60).toString().padStart(2, '0');

function SortableShotCard({ shot, onSelect, onCompile, isSelected, onToggleSelect, selectMode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: shot.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="bg-zinc-950/50 rounded-sm p-4 border border-zinc-800/50 hover:border-indigo-500/30 transition-colors group cursor-pointer" data-testid={'shot-card-' + shot.id} onClick={function() { if (!selectMode) onSelect(shot.id); }}>
      <div className="flex items-start gap-2">
        {selectMode && (
          <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect(shot.id)} className="rounded-sm mt-1" data-testid={'select-shot-' + shot.id} />
        )}
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1 text-zinc-700 hover:text-zinc-400" onClick={function(e) { e.stopPropagation(); }}>
          <GripVertical className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1" onClick={function(e) { e.stopPropagation(); onSelect(shot.id); }}>
          {(shot.reference_frame_url || shot.first_frame_url || (shot.reference_images && shot.reference_images.length > 0)) && (
            <div className="flex gap-1 mb-2">
              {[shot.reference_frame_url, shot.first_frame_url].concat(shot.reference_images || []).filter(Boolean).slice(0, 3).map(function(url, i) {
                return <img key={i} src={url} alt="" className="h-12 w-16 object-cover rounded-sm border border-zinc-800" onError={function(e) { e.target.style.display='none'; }} />;
              })}
            </div>
          )}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-zinc-600">#{shot.shot_number}</span>
              <Badge className={'rounded-sm font-mono text-[9px] ' + (STAGE_COLORS[shot.production_status] || '')}>{shot.production_status}</Badge>
            </div>
            <span className="font-mono text-[10px] text-zinc-600">{shot.duration_target_sec}s</span>
          </div>
          <p className="text-sm text-zinc-400 mb-2 line-clamp-2">{shot.description}</p>
          <div className="flex items-center gap-3 text-[10px] text-zinc-600 font-mono">
            <span className="flex items-center gap-1"><Camera className="w-3 h-3" />{shot.framing}</span>
            <span className="flex items-center gap-1"><Move className="w-3 h-3" />{shot.camera_movement}</span>
            {shot.transition_in && shot.transition_in !== 'cut' && <span className="flex items-center gap-1"><ArrowLeftRight className="w-3 h-3" />{shot.transition_in}</span>}
          </div>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={function(e) { e.stopPropagation(); onCompile(shot); }}
        className="mt-2 rounded-sm font-mono text-[9px] text-indigo-400/50 hover:text-indigo-400 h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity" data-testid={'compile-shot-' + shot.id}>
        <Sparkles className="w-3 h-3 mr-1" /> Compile
      </Button>
    </div>
  );
}

function AddSceneDialog({ projectId, worldList, nextNumber, onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ scene_number: nextNumber, title: '', synopsis: '', emotional_zone: 'contemplative', world_id: '', dramatic_tension: 5, narrative_purpose: '' });
  useEffect(function() { setForm(function(f) { return { ...f, scene_number: nextNumber }; }); }, [nextNumber]);

  var submit = async function() {
    if (!form.title.trim()) { toast.error('Scene title required'); return; }
    await scenesApi.create(projectId, { ...form, character_ids: [], time_of_day: '', weather: '', lighting: '', director_notes: '' });
    toast.success('Scene "' + form.title + '" created');
    setOpen(false); onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="rounded-sm font-heading uppercase tracking-wider text-sm bg-indigo-600 hover:bg-indigo-500" data-testid="add-scene-btn"><Plus className="w-4 h-4 mr-2" /> Add Scene</Button></DialogTrigger>
      <DialogContent className="bg-[#0a0a0a] border-zinc-800 max-w-lg">
        <DialogHeader><DialogTitle className="font-heading uppercase text-white">New Scene</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <div><label className="font-mono text-[10px] uppercase text-zinc-500 mb-1 block">#</label>
              <Input type="number" value={form.scene_number} onChange={function(e) { setForm({...form, scene_number: parseInt(e.target.value)||1}); }} className="bg-black/50 border-zinc-800 font-mono text-sm" /></div>
            <div className="col-span-3"><label className="font-mono text-[10px] uppercase text-zinc-500 mb-1 block">Title *</label>
              <Input value={form.title} onChange={function(e) { setForm({...form, title: e.target.value}); }} placeholder="Scene title" className="bg-black/50 border-zinc-800 font-mono text-sm" data-testid="scene-title-input" /></div>
          </div>
          <Textarea value={form.synopsis} onChange={function(e) { setForm({...form, synopsis: e.target.value}); }} placeholder="Synopsis" className="bg-black/50 border-zinc-800 font-mono text-sm" rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <Select value={form.emotional_zone} onValueChange={function(v) { setForm({...form, emotional_zone: v}); }}>
              <SelectTrigger className="bg-black/50 border-zinc-800 font-mono text-sm h-9 rounded-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">{ZONES.map(function(z) { return <SelectItem key={z} value={z} className="font-mono text-sm">{z}</SelectItem>; })}</SelectContent>
            </Select>
            <Select value={form.world_id || 'none'} onValueChange={function(v) { setForm({...form, world_id: v === 'none' ? '' : v}); }}>
              <SelectTrigger className="bg-black/50 border-zinc-800 font-mono text-sm h-9 rounded-sm"><SelectValue placeholder="World" /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="none" className="font-mono text-sm">None</SelectItem>
                {worldList.map(function(w) { return <SelectItem key={w.id} value={w.id} className="font-mono text-sm">{w.name}</SelectItem>; })}
              </SelectContent>
            </Select>
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
  useEffect(function() { setForm(function(f) { return { ...f, scene_id: sceneId, shot_number: nextNumber }; }); }, [sceneId, nextNumber]);

  var submit = async function() {
    if (!form.description.trim()) { toast.error('Description required'); return; }
    await shotsApi.create(projectId, form);
    toast.success('Shot #' + form.shot_number + ' created');
    setOpen(false); onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="sm" className="rounded-sm font-mono text-[10px] text-zinc-600 hover:text-indigo-400 h-7 px-2" data-testid={'add-shot-' + sceneId}><Plus className="w-3 h-3 mr-1" /> Shot</Button></DialogTrigger>
      <DialogContent className="bg-[#0a0a0a] border-zinc-800 max-w-md">
        <DialogHeader><DialogTitle className="font-heading uppercase text-white text-sm">New Shot</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Input type="number" value={form.shot_number} onChange={function(e) { setForm({...form, shot_number: parseInt(e.target.value)||1}); }} placeholder="#" className="bg-black/50 border-zinc-800 font-mono text-sm" />
            <Input type="number" value={form.duration_target_sec} onChange={function(e) { setForm({...form, duration_target_sec: parseFloat(e.target.value)||5}); }} placeholder="Duration" className="bg-black/50 border-zinc-800 font-mono text-sm" />
            <Select value={form.framing} onValueChange={function(v) { setForm({...form, framing: v}); }}>
              <SelectTrigger className="bg-black/50 border-zinc-800 font-mono text-sm h-9 rounded-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {["extreme_wide","wide","medium_wide","medium","medium_close","close","extreme_close"].map(function(f) { return <SelectItem key={f} value={f} className="font-mono text-sm">{f}</SelectItem>; })}
              </SelectContent>
            </Select>
          </div>
          <Textarea value={form.description} onChange={function(e) { setForm({...form, description: e.target.value}); }} placeholder="Shot description" className="bg-black/50 border-zinc-800 font-mono text-sm" rows={2} data-testid="shot-desc-input" />
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
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchCompiling, setBatchCompiling] = useState(false);
  const [pushingNotion, setPushingNotion] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = useCallback(async function() {
    var results = await Promise.all([scenesApi.list(projectId), shotsApi.list(projectId), worldsApi.list(projectId)]);
    var sc = results[0], sh = results[1], wl = results[2];
    setSceneList(sc); setWorldList(wl);
    var wm = {}; wl.forEach(function(w) { wm[w.id] = w; }); setWorldMap(wm);
    var sm = {}; sh.forEach(function(s) { if (!sm[s.scene_id]) sm[s.scene_id] = []; sm[s.scene_id].push(s); });
    Object.values(sm).forEach(function(arr) { arr.sort(function(a, b) { return a.shot_number - b.shot_number; }); });
    setShotMap(sm);
    var exp = {}; sc.forEach(function(s) { exp[s.id] = true; });
    setExpanded(function(prev) { return Object.keys(prev).length ? prev : exp; });
  }, [projectId]);

  useEffect(function() { load(); }, [load]);

  var toggle = function(id) { setExpanded(function(prev) { var n = {...prev}; n[id] = !n[id]; return n; }); };
  var allShots = Object.values(shotMap).flat();
  var totalDur = allShots.reduce(function(a, s) { return a + (s.duration_target_sec || 0); }, 0);
  var maxShotNum = allShots.length ? Math.max.apply(null, allShots.map(function(s) { return s.shot_number; })) : 0;

  var toggleSelectShot = function(id) {
    setSelectedIds(function(prev) { return prev.includes(id) ? prev.filter(function(x) { return x !== id; }) : prev.concat([id]); });
  };

  var handleDragEnd = async function(event) {
    var active = event.active, over = event.over;
    if (!over || active.id === over.id) return;
    // Find which scene contains these shots
    for (var sceneId in shotMap) {
      var shots = shotMap[sceneId];
      var oldIdx = shots.findIndex(function(s) { return s.id === active.id; });
      var newIdx = shots.findIndex(function(s) { return s.id === over.id; });
      if (oldIdx !== -1 && newIdx !== -1) {
        var reordered = arrayMove(shots, oldIdx, newIdx);
        var ids = reordered.map(function(s) { return s.id; });
        await shotsApi.reorder(projectId, ids);
        toast.success('Shots reordered');
        load();
        break;
      }
    }
  };

  var handleBatchCompile = async function() {
    if (selectedIds.length === 0) { toast.error('Select shots first'); return; }
    setBatchCompiling(true);
    try {
      var result = await compiler.batchCompile(projectId, selectedIds);
      var success = result.results.filter(function(r) { return !r.error; }).length;
      toast.success(success + '/' + result.total + ' shots compiled');
      setSelectMode(false); setSelectedIds([]);
    } catch (e) { toast.error('Batch compile failed'); }
    setBatchCompiling(false);
  };

  var handleNotionPush = async function() {
    setPushingNotion(true);
    try {
      var result = await notionApi.push(projectId);
      toast.success(result.count + ' shots pushed to Notion format');
    } catch (e) { toast.error('Notion push failed'); }
    setPushingNotion(false);
  };

  var deleteScene = async function(sceneId, title) {
    if (!window.confirm('Delete scene "' + title + '" and all its shots?')) return;
    await scenesApi.delete(projectId, sceneId);
    toast.success('Scene "' + title + '" deleted');
    load(); onUpdate();
  };

  var handleCompileShot = function(shot) { if (onCompileShot) onCompileShot(shot, shotMap, sceneList, worldMap); };

  return (
    <div data-testid="storyboard">
      <div className="glass-card rounded-sm p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Clapperboard className="w-5 h-5 text-indigo-400" />
          <span className="font-heading font-bold text-lg uppercase text-white">{sceneList.length} Scenes</span>
          <span className="font-mono text-xs text-zinc-500">{allShots.length} shots</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={selectMode ? "default" : "outline"} size="sm" onClick={function() { setSelectMode(!selectMode); setSelectedIds([]); }}
            className={'rounded-sm font-mono text-[10px] h-7 ' + (selectMode ? 'bg-indigo-600' : 'border-zinc-700 text-zinc-500')} data-testid="toggle-select-mode">
            <CheckSquare className="w-3 h-3 mr-1" /> {selectMode ? selectedIds.length + ' selected' : 'Select'}
          </Button>
          {selectMode && selectedIds.length > 0 && (
            <Button size="sm" onClick={handleBatchCompile} disabled={batchCompiling}
              className="rounded-sm font-mono text-[10px] h-7 bg-violet-600 hover:bg-violet-500" data-testid="batch-compile-btn">
              {batchCompiling ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
              Batch Compile ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleNotionPush} disabled={pushingNotion}
            className="rounded-sm font-mono text-[10px] h-7 border-zinc-700 text-zinc-500 hover:text-cyan-400 hover:border-cyan-500/30" data-testid="notion-push-btn">
            {pushingNotion ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
            Push to Notion
          </Button>
          <AddSceneDialog projectId={projectId} worldList={worldList} nextNumber={sceneList.length + 1} onCreated={function() { load(); onUpdate(); }} />
          <div className="flex items-center gap-2 ml-4">
            <Clock className="w-4 h-4 text-zinc-500" />
            <span className="font-mono text-sm text-white">{formatDur(totalDur)}</span>
            <span className="font-mono text-xs text-zinc-600">/ 5:00</span>
            <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className={'h-full transition-all ' + (totalDur > 300 ? 'bg-red-500' : 'bg-indigo-500')} style={{ width: Math.min((totalDur / 300) * 100, 100) + '%' }} />
            </div>
          </div>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="space-y-4">
          {sceneList.map(function(scene) {
            var scenShots = shotMap[scene.id] || [];
            var sceneDur = scenShots.reduce(function(a, s) { return a + (s.duration_target_sec || 0); }, 0);
            var isOpen = expanded[scene.id];
            var world = worldMap[scene.world_id];
            var maxInScene = scenShots.length ? Math.max.apply(null, scenShots.map(function(s) { return s.shot_number; })) : maxShotNum;

            return (
              <div key={scene.id} className="glass-card rounded-sm overflow-hidden" data-testid={'scene-' + scene.id}>
                <button onClick={function() { toggle(scene.id); }} className="w-full flex items-center gap-4 p-4 hover:bg-zinc-900/50 transition-colors text-left" data-testid={'scene-toggle-' + scene.id}>
                  {isOpen ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-zinc-600 uppercase">Scene {scene.scene_number}</span>
                      <h3 className="font-heading font-bold text-lg uppercase tracking-tight text-white">{scene.title}</h3>
                      <Badge className={'rounded-sm font-mono text-[9px] ' + (ZONE_COLORS[scene.emotional_zone] || '')}>{scene.emotional_zone}</Badge>
                      {world && <Badge variant="secondary" className="rounded-sm font-mono text-[9px] bg-zinc-900 text-cyan-400">{world.name}</Badge>}
                    </div>
                    <p className="text-xs text-zinc-600 mt-1 line-clamp-1">{scene.synopsis}</p>
                  </div>
                  <div className="text-right mr-2">
                    <p className="font-mono text-xs text-zinc-400">{scenShots.length} shots</p>
                    <p className="font-mono text-[10px] text-zinc-600">{formatDur(sceneDur)}</p>
                  </div>
                  <div className="w-16 flex items-center gap-0.5">
                    {Array.from({length: 10}).map(function(_, i) {
                      return <div key={i} className={'h-3 w-1 rounded-full ' + (i < scene.dramatic_tension ? 'bg-red-500' : 'bg-zinc-800')} />;
                    })}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-zinc-900/50">
                    <div className="flex items-center justify-between px-4 pt-3 pb-1">
                      <AddShotDialog projectId={projectId} sceneId={scene.id} nextNumber={maxInScene + 1} onCreated={function() { load(); onUpdate(); }} />
                      <Button variant="ghost" size="sm" onClick={function() { deleteScene(scene.id, scene.title); }}
                        className="rounded-sm font-mono text-[10px] text-zinc-700 hover:text-red-400 h-7 px-2" data-testid={'delete-scene-' + scene.id}>
                        <Trash2 className="w-3 h-3 mr-1" /> Delete Scene
                      </Button>
                    </div>
                    {scenShots.length > 0 ? (
                      <SortableContext items={scenShots.map(function(s) { return s.id; })} strategy={verticalListSortingStrategy}>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4 pt-2">
                          {scenShots.map(function(shot) {
                            return <SortableShotCard key={shot.id} shot={shot} onSelect={setSelectedShot} onCompile={handleCompileShot}
                              selectMode={selectMode} isSelected={selectedIds.includes(shot.id)} onToggleSelect={toggleSelectShot} />;
                          })}
                        </div>
                      </SortableContext>
                    ) : (
                      <p className="text-center text-zinc-700 font-mono text-xs py-6">No shots yet</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DndContext>

      <ShotDetail projectId={projectId} shotId={selectedShot} open={!!selectedShot}
        onClose={function() { setSelectedShot(null); }} onUpdate={function() { load(); onUpdate(); }}
        onCompile={function(shot) { handleCompileShot(shot); }} />
    </div>
  );
}
