import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projects as projectsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Zap, Film } from 'lucide-react';

export default function NewProject() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', brand_primary: '', brand_secondary: '', description: '',
    visual_style: '', default_time_of_day: 'day', default_weather: 'clear',
    default_lighting: 'natural', default_aspect_ratio: '16:9', target_duration_sec: 300,
    compliance_notes: [], forbidden_elements: [], required_elements: [],
    model_preferences: {}, tags: []
  });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error('Project name is required'); return; }
    setSaving(true);
    try {
      const project = await projectsApi.create(form);
      toast.success(`Project "${form.name}" created`);
      navigate(`/project/${project.id}`);
    } catch (e) {
      toast.error('Failed to create project');
    }
    setSaving(false);
  };

  const f = (key) => ({ value: form[key], onChange: e => setForm({ ...form, [key]: e.target.value }) });

  return (
    <div className="min-h-screen bg-[#050505] p-8 lg:p-12" data-testid="new-project">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/')} className="text-zinc-500 hover:text-white mb-8" data-testid="back-btn">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <Film className="w-6 h-6 text-indigo-500" />
          <h1 className="font-heading font-extrabold text-3xl uppercase tracking-tighter text-white" data-testid="page-title">New Project</h1>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-sm p-6 trace-border space-y-4">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Project Name *</label>
              <Input {...f('name')} placeholder="e.g., Mito — The Animated Short" className="bg-black/50 border-zinc-800 font-mono text-sm" data-testid="project-name-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Primary Brand</label>
                <Input {...f('brand_primary')} placeholder="e.g., Everything's Energy" className="bg-black/50 border-zinc-800 font-mono text-sm" />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Secondary Brand</label>
                <Input {...f('brand_secondary')} placeholder="Optional" className="bg-black/50 border-zinc-800 font-mono text-sm" />
              </div>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Description</label>
              <Textarea {...f('description')} placeholder="What is this project about?" className="bg-black/50 border-zinc-800 font-mono text-sm" rows={3} data-testid="project-desc-input" />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Visual Style</label>
              <Textarea {...f('visual_style')} placeholder="Describe the visual aesthetic..." className="bg-black/50 border-zinc-800 font-mono text-sm" rows={2} />
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Time of Day</label>
                <Input {...f('default_time_of_day')} className="bg-black/50 border-zinc-800 font-mono text-sm" />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Weather</label>
                <Input {...f('default_weather')} className="bg-black/50 border-zinc-800 font-mono text-sm" />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Lighting</label>
                <Input {...f('default_lighting')} className="bg-black/50 border-zinc-800 font-mono text-sm" />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Target (sec)</label>
                <Input type="number" value={form.target_duration_sec} onChange={e => setForm({...form, target_duration_sec: parseFloat(e.target.value) || 300})} className="bg-black/50 border-zinc-800 font-mono text-sm" />
              </div>
            </div>
          </div>

          <Button onClick={handleCreate} disabled={saving} className="w-full rounded-sm font-heading uppercase tracking-wider text-lg py-6 bg-indigo-600 hover:bg-indigo-500" data-testid="create-project-btn">
            <Zap className="w-5 h-5 mr-2" /> {saving ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </div>
    </div>
  );
}
