import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { projects as projectsApi, dashboard as dashboardApi, seed } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Film, Globe, Users, Crosshair, Plus, Zap, Clock, Layers } from 'lucide-react';

const stageLabelMap = {
  concept: 'Concept', world_built: 'World', blocked: 'Blocked',
  generated: 'Generated', audio_layered: 'Audio', mixed: 'Mixed', final: 'Final'
};

const formatDuration = (sec) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function Dashboard() {
  const [projectList, setProjectList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([projectsApi.list(), dashboardApi.stats()]);
      setProjectList(p);
      setStats(s);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSeedMito = async () => {
    try {
      const result = await seed.mito();
      if (result.project_id) {
        await load();
      }
    } catch (e) { console.error(e); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div className="text-center">
        <Zap className="w-8 h-8 text-indigo-500 mx-auto mb-4 animate-pulse" />
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">Loading StoryForge</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] p-8 lg:p-12" data-testid="dashboard">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-6 h-6 text-indigo-500" />
          <h1 className="font-heading font-extrabold text-4xl lg:text-5xl tracking-tighter uppercase text-white" data-testid="app-title">
            StoryForge
          </h1>
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500 ml-9">
          AI Filmmaking Production Engine
        </p>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { icon: Film, label: 'Projects', value: stats.project_count, color: 'text-indigo-400' },
            { icon: Crosshair, label: 'Total Shots', value: stats.total_shots, color: 'text-violet-400' },
            { icon: Globe, label: 'Worlds', value: stats.total_worlds, color: 'text-cyan-400' },
            { icon: Clock, label: 'Total Duration', value: formatDuration(stats.total_duration_sec), color: 'text-amber-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="glass-card rounded-sm p-6 trace-border" data-testid={`stat-${label.toLowerCase().replace(' ', '-')}`}>
              <Icon className={`w-5 h-5 ${color} mb-3`} />
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1">{label}</p>
              <p className="font-heading font-bold text-2xl text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 mb-8">
        <h2 className="font-heading font-bold text-2xl uppercase tracking-tight text-white flex-1">Projects</h2>
        {projectList.length === 0 && (
          <Button onClick={handleSeedMito} className="rounded-sm font-heading uppercase tracking-wider text-sm bg-indigo-600 hover:bg-indigo-500" data-testid="seed-mito-btn">
            <Zap className="w-4 h-4 mr-2" /> Seed Mito Project
          </Button>
        )}
        <Button onClick={() => navigate('/project/new')} variant="outline" className="rounded-sm font-heading uppercase tracking-wider text-sm border-zinc-700 hover:border-indigo-500" data-testid="new-project-btn">
          <Plus className="w-4 h-4 mr-2" /> New Project
        </Button>
      </div>

      {/* Project Grid */}
      {projectList.length === 0 ? (
        <div className="glass-card rounded-sm p-16 text-center">
          <Layers className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="font-heading text-xl text-zinc-400 uppercase mb-2">No Projects Yet</p>
          <p className="text-sm text-zinc-600 mb-6">Seed the Mito animated short to get started</p>
          <Button onClick={handleSeedMito} className="rounded-sm font-heading uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500" data-testid="seed-mito-empty-btn">
            <Zap className="w-4 h-4 mr-2" /> Seed Mito Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projectList.map(p => (
            <div
              key={p.id}
              onClick={() => navigate(`/project/${p.id}`)}
              className="glass-card rounded-sm p-6 cursor-pointer trace-border transition-all duration-300 hover:-translate-y-0.5 group"
              data-testid={`project-card-${p.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-heading font-bold text-xl text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors">
                    {p.name}
                  </h3>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 mt-1">
                    {p.brand_primary}
                  </p>
                </div>
                <Badge className="rounded-sm font-mono text-[10px] bg-zinc-800 text-zinc-400 border-zinc-700">
                  {p.shot_count} shots
                </Badge>
              </div>

              <p className="text-sm text-zinc-500 mb-4 line-clamp-2">{p.description}</p>

              <div className="flex items-center gap-4 text-xs text-zinc-600 mb-4">
                <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {p.world_count}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {p.character_count}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(p.total_duration || 0)}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-zinc-500">{p.completion_pct}%</span>
                  <span className="font-mono text-zinc-600">{formatDuration(p.total_duration || 0)} / 5:00</span>
                </div>
                <Progress value={p.completion_pct} className="h-1 bg-zinc-800 [&>div]:bg-indigo-500" />
              </div>

              {p.tags && p.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-4">
                  {p.tags.slice(0, 4).map(t => (
                    <Badge key={t} variant="secondary" className="rounded-sm font-mono text-[9px] bg-zinc-900 text-zinc-500 border-zinc-800">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
