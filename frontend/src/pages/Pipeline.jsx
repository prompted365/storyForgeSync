import { useState, useEffect, useCallback } from 'react';
import { shots as shotsApi, scenes as scenesApi } from '@/lib/api';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Camera, Move, ArrowRight } from 'lucide-react';

const STAGES = [
  { key: 'concept', label: 'Concept', color: 'border-indigo-500/30', dot: 'bg-indigo-500' },
  { key: 'world_built', label: 'World Built', color: 'border-violet-500/30', dot: 'bg-violet-500' },
  { key: 'blocked', label: 'Blocked', color: 'border-amber-500/30', dot: 'bg-amber-500' },
  { key: 'generated', label: 'Generated', color: 'border-cyan-500/30', dot: 'bg-cyan-500' },
  { key: 'audio_layered', label: 'Audio', color: 'border-pink-500/30', dot: 'bg-pink-500' },
  { key: 'mixed', label: 'Mixed', color: 'border-orange-500/30', dot: 'bg-orange-500' },
  { key: 'final', label: 'Final', color: 'border-emerald-500/30', dot: 'bg-emerald-500' },
];

export default function Pipeline({ projectId }) {
  const [allShots, setAllShots] = useState([]);
  const [sceneMap, setSceneMap] = useState({});

  const load = useCallback(async () => {
    const [sh, sc] = await Promise.all([shotsApi.list(projectId), scenesApi.list(projectId)]);
    setAllShots(sh);
    const sm = {};
    sc.forEach(s => { sm[s.id] = s; });
    setSceneMap(sm);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const advanceShot = async (shot) => {
    const idx = STAGES.findIndex(s => s.key === shot.production_status);
    if (idx < STAGES.length - 1) {
      await shotsApi.updateStatus(projectId, shot.id, STAGES[idx + 1].key);
      toast.success(`Shot #${shot.shot_number} → ${STAGES[idx + 1].label}`);
      load();
    }
  };

  const columns = STAGES.map(stage => ({
    ...stage,
    shots: allShots.filter(s => s.production_status === stage.key).sort((a, b) => a.shot_number - b.shot_number),
  }));

  const total = allShots.length;
  const finalCount = allShots.filter(s => s.production_status === 'final').length;

  return (
    <div data-testid="pipeline">
      {/* Summary bar */}
      <div className="glass-card rounded-sm p-4 mb-6 flex items-center gap-6">
        <span className="font-heading font-bold text-lg uppercase text-white">Production Pipeline</span>
        <span className="font-mono text-xs text-zinc-500">{total} shots total</span>
        <span className="font-mono text-xs text-emerald-400">{finalCount} final</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          {STAGES.map(({ key, dot }) => {
            const count = allShots.filter(s => s.production_status === key).length;
            return (
              <div key={key} className="flex items-center gap-1 mx-1">
                <div className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="font-mono text-[10px] text-zinc-500">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex gap-3 overflow-x-auto pb-4" data-testid="kanban-board">
        {columns.map(col => (
          <div key={col.key} className={`kanban-col rounded-sm flex-shrink-0 w-52 ${col.color} border`} data-testid={`kanban-col-${col.key}`}>
            <div className="p-3 border-b border-zinc-800/50 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${col.dot} pulse-dot`} />
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-zinc-300">{col.label}</span>
              <span className="font-mono text-[10px] text-zinc-600 ml-auto">{col.shots.length}</span>
            </div>
            <div className="p-2 space-y-2 min-h-[200px]">
              {col.shots.map(shot => {
                const scene = sceneMap[shot.scene_id];
                return (
                  <div key={shot.id} className="bg-zinc-950/80 rounded-sm p-3 border border-zinc-800/30 hover:border-zinc-700/50 transition-colors group" data-testid={`pipeline-shot-${shot.id}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] text-zinc-500">#{shot.shot_number}</span>
                      <button
                        onClick={() => advanceShot(shot)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Advance to next stage"
                        data-testid={`advance-shot-${shot.id}`}
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-400 hover:text-indigo-300" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2 mb-2">{shot.description}</p>
                    <div className="flex items-center gap-2 text-[9px] text-zinc-600 font-mono">
                      <Camera className="w-2.5 h-2.5" />{shot.framing}
                      <Move className="w-2.5 h-2.5 ml-1" />{shot.camera_movement}
                    </div>
                    {scene && (
                      <Badge variant="secondary" className="rounded-sm font-mono text-[8px] bg-zinc-900 text-zinc-500 mt-2">
                        S{scene.scene_number}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
