import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projects as projectsApi } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Zap, Globe, Users, Crosshair, Clock, Box, Clapperboard, Sparkles, Settings, Film } from 'lucide-react';
import WorldBible from '@/pages/WorldBible';
import Storyboard from '@/pages/Storyboard';
import Pipeline from '@/pages/Pipeline';
import Compiler from '@/pages/Compiler';
import ProjectSettings from '@/pages/ProjectSettings';

const formatDuration = (sec) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function ProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('worlds');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const p = await projectsApi.get(id);
      setProject(p);
    } catch (e) {
      console.error(e);
      navigate('/');
    }
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  if (loading || !project) return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <Zap className="w-8 h-8 text-indigo-500 animate-pulse" />
    </div>
  );

  const statItems = [
    { icon: Globe, label: 'Worlds', value: project.world_count, color: 'text-cyan-400' },
    { icon: Users, label: 'Characters', value: project.character_count, color: 'text-violet-400' },
    { icon: Box, label: 'Objects', value: project.object_count, color: 'text-amber-400' },
    { icon: Clapperboard, label: 'Scenes', value: project.scene_count, color: 'text-pink-400' },
    { icon: Crosshair, label: 'Shots', value: project.shot_count, color: 'text-indigo-400' },
    { icon: Clock, label: 'Duration', value: formatDuration(project.total_duration || 0), color: 'text-emerald-400' },
  ];

  return (
    <div className="min-h-screen bg-[#050505]" data-testid="project-view">
      {/* Top Bar */}
      <div className="border-b border-zinc-900 px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-zinc-500 hover:text-white" data-testid="back-btn">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Film className="w-5 h-5 text-indigo-500" />
              <h1 className="font-heading font-bold text-2xl uppercase tracking-tight text-white" data-testid="project-title">
                {project.name}
              </h1>
              <Badge className="rounded-sm font-mono text-[9px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                {project.brand_primary}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-mono text-xs text-zinc-500">{project.completion_pct}% complete</p>
              <p className="font-mono text-[10px] text-zinc-600">{formatDuration(project.total_duration || 0)} / 5:00 target</p>
            </div>
            <div className="w-24">
              <Progress value={project.completion_pct} className="h-1.5 bg-zinc-800 [&>div]:bg-indigo-500" />
            </div>
          </div>
        </div>

        {/* Mini stats */}
        <div className="flex items-center gap-6 mt-3 ml-12">
          {statItems.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <span className="font-mono text-[10px] text-zinc-500 uppercase">{label}</span>
              <span className="font-mono text-xs text-zinc-300 font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <div className="border-b border-zinc-900 px-6">
          <TabsList className="bg-transparent h-12 gap-1" data-testid="project-tabs">
            {[
              { value: 'worlds', icon: Globe, label: 'World Bible' },
              { value: 'storyboard', icon: Clapperboard, label: 'Storyboard' },
              { value: 'pipeline', icon: Crosshair, label: 'Pipeline' },
              { value: 'compiler', icon: Sparkles, label: 'AI Compiler' },
              { value: 'settings', icon: Settings, label: 'Settings' },
            ].map(({ value, icon: Icon, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-sm font-heading uppercase tracking-wider text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 hover:text-zinc-300 px-4"
                data-testid={`tab-${value}`}
              >
                <Icon className="w-3.5 h-3.5 mr-2" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="p-6 lg:p-8">
          <TabsContent value="worlds" className="mt-0"><WorldBible projectId={id} onUpdate={load} /></TabsContent>
          <TabsContent value="storyboard" className="mt-0"><Storyboard projectId={id} onUpdate={load} /></TabsContent>
          <TabsContent value="pipeline" className="mt-0"><Pipeline projectId={id} /></TabsContent>
          <TabsContent value="compiler" className="mt-0"><Compiler projectId={id} /></TabsContent>
          <TabsContent value="settings" className="mt-0"><ProjectSettings projectId={id} project={project} onUpdate={load} /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
