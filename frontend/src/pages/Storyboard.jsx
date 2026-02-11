import { useState, useEffect, useCallback } from 'react';
import { scenes as scenesApi, shots as shotsApi, worlds as worldsApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clapperboard, Clock, Camera, Move, ChevronDown, ChevronRight } from 'lucide-react';

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

const formatDur = (s) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

export default function Storyboard({ projectId, onUpdate }) {
  const [sceneList, setSceneList] = useState([]);
  const [shotMap, setShotMap] = useState({});
  const [worldMap, setWorldMap] = useState({});
  const [expanded, setExpanded] = useState({});

  const load = useCallback(async () => {
    const [sc, sh, wl] = await Promise.all([
      scenesApi.list(projectId),
      shotsApi.list(projectId),
      worldsApi.list(projectId),
    ]);
    setSceneList(sc);
    const wm = {};
    wl.forEach(w => { wm[w.id] = w; });
    setWorldMap(wm);
    const sm = {};
    sh.forEach(s => {
      if (!sm[s.scene_id]) sm[s.scene_id] = [];
      sm[s.scene_id].push(s);
    });
    Object.values(sm).forEach(arr => arr.sort((a, b) => a.shot_number - b.shot_number));
    setShotMap(sm);
    const exp = {};
    sc.forEach(s => { exp[s.id] = true; });
    setExpanded(prev => Object.keys(prev).length ? prev : exp);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const allShots = Object.values(shotMap).flat();
  const totalDur = allShots.reduce((a, s) => a + (s.duration_target_sec || 0), 0);

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
          <Clock className="w-4 h-4 text-zinc-500" />
          <span className="font-mono text-sm text-white">{formatDur(totalDur)}</span>
          <span className="font-mono text-xs text-zinc-600">/ 5:00 target</span>
          <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${Math.min((totalDur / 300) * 100, 100)}%` }} />
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

          return (
            <div key={scene.id} className="glass-card rounded-sm overflow-hidden" data-testid={`scene-${scene.id}`}>
              {/* Scene Header */}
              <button
                onClick={() => toggle(scene.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-zinc-900/50 transition-colors text-left"
                data-testid={`scene-toggle-${scene.id}`}
              >
                {isOpen ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-zinc-600 uppercase">Scene {scene.scene_number}</span>
                    <h3 className="font-heading font-bold text-lg uppercase tracking-tight text-white">{scene.title}</h3>
                    <Badge className={`rounded-sm font-mono text-[9px] ${ZONE_COLORS[scene.emotional_zone] || ''}`}>
                      {scene.emotional_zone}
                    </Badge>
                    {world && <Badge variant="secondary" className="rounded-sm font-mono text-[9px] bg-zinc-900 text-cyan-400">{world.name}</Badge>}
                  </div>
                  <p className="text-xs text-zinc-600 mt-1 line-clamp-1">{scene.synopsis}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs text-zinc-400">{scenShots.length} shots</p>
                  <p className="font-mono text-[10px] text-zinc-600">{formatDur(sceneDur)}</p>
                </div>
                {/* Tension meter */}
                <div className="w-16 flex items-center gap-1">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className={`h-3 w-1 rounded-full ${i < scene.dramatic_tension ? 'bg-red-500' : 'bg-zinc-800'}`} />
                  ))}
                </div>
              </button>

              {/* Shots */}
              {isOpen && scenShots.length > 0 && (
                <div className="border-t border-zinc-900/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
                    {scenShots.map(shot => (
                      <div key={shot.id} className="bg-zinc-950/50 rounded-sm p-4 border border-zinc-800/50 hover:border-indigo-500/30 transition-colors" data-testid={`shot-card-${shot.id}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-zinc-600">#{shot.shot_number}</span>
                            <Badge className={`rounded-sm font-mono text-[9px] ${STAGE_COLORS[shot.production_status] || ''}`}>
                              {shot.production_status}
                            </Badge>
                          </div>
                          <span className="font-mono text-[10px] text-zinc-600">{shot.duration_target_sec}s</span>
                        </div>
                        <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{shot.description}</p>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-600 font-mono">
                          <span className="flex items-center gap-1"><Camera className="w-3 h-3" />{shot.framing}</span>
                          <span className="flex items-center gap-1"><Move className="w-3 h-3" />{shot.camera_movement}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
