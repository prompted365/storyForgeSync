import { useState, useEffect } from 'react';
import { projects as projectsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, Shield, Palette, Clock } from 'lucide-react';

export default function ProjectSettings({ projectId, project, onUpdate }) {
  const [form, setForm] = useState({
    name: '', brand_primary: '', brand_secondary: '', description: '',
    compliance_notes: [], forbidden_elements: [], required_elements: [],
    visual_style: '', default_time_of_day: 'day', default_weather: 'clear',
    default_lighting: 'natural', default_aspect_ratio: '16:9', model_preferences: {}, tags: []
  });
  const [saving, setSaving] = useState(false);
  const [complianceInput, setComplianceInput] = useState('');
  const [forbiddenInput, setForbiddenInput] = useState('');
  const [requiredInput, setRequiredInput] = useState('');

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || '',
        brand_primary: project.brand_primary || '',
        brand_secondary: project.brand_secondary || '',
        description: project.description || '',
        compliance_notes: project.compliance_notes || [],
        forbidden_elements: project.forbidden_elements || [],
        required_elements: project.required_elements || [],
        visual_style: project.visual_style || '',
        default_time_of_day: project.default_time_of_day || 'day',
        default_weather: project.default_weather || 'clear',
        default_lighting: project.default_lighting || 'natural',
        default_aspect_ratio: project.default_aspect_ratio || '16:9',
        model_preferences: project.model_preferences || {},
        tags: project.tags || [],
      });
    }
  }, [project]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await projectsApi.update(projectId, form);
      onUpdate();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const addToList = (key, input, setInput) => {
    if (!input.trim()) return;
    setForm(prev => ({ ...prev, [key]: [...prev[key], input.trim()] }));
    setInput('');
  };

  const removeFromList = (key, idx) => {
    setForm(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== idx) }));
  };

  const Section = ({ icon: Icon, title, color, children }) => (
    <div className="glass-card rounded-sm p-6 trace-border">
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-5 h-5 ${color}`} />
        <h3 className="font-heading font-bold text-lg uppercase tracking-tight text-white">{title}</h3>
      </div>
      {children}
    </div>
  );

  const ListField = ({ label, items, input, setInput, listKey, placeholder }) => (
    <div>
      <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2 block">{label}</label>
      <div className="flex gap-2 mb-2">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addToList(listKey, input, setInput)}
          placeholder={placeholder} className="bg-black/50 border-zinc-800 font-mono text-sm flex-1" />
        <Button onClick={() => addToList(listKey, input, setInput)} variant="outline" size="sm" className="rounded-sm border-zinc-700 font-mono text-xs">Add</Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <Badge key={i} className="rounded-sm font-mono text-[10px] bg-zinc-900 text-zinc-400 border-zinc-800 cursor-pointer hover:border-red-500/30 hover:text-red-400"
            onClick={() => removeFromList(listKey, i)}>
            {item} x
          </Badge>
        ))}
      </div>
    </div>
  );

  return (
    <div data-testid="project-settings" className="max-w-4xl space-y-6">
      <Section icon={Settings} title="Project Identity" color="text-indigo-400">
        <div className="space-y-3">
          <div><label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Project Name</label>
            <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-black/50 border-zinc-800 font-mono text-sm" data-testid="settings-name" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Primary Brand</label>
              <Input value={form.brand_primary} onChange={e => setForm({...form, brand_primary: e.target.value})} className="bg-black/50 border-zinc-800 font-mono text-sm" data-testid="settings-brand" /></div>
            <div><label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Secondary Brand</label>
              <Input value={form.brand_secondary} onChange={e => setForm({...form, brand_secondary: e.target.value})} className="bg-black/50 border-zinc-800 font-mono text-sm" /></div>
          </div>
          <div><label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Description</label>
            <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-black/50 border-zinc-800 font-mono text-sm" rows={3} data-testid="settings-desc" /></div>
        </div>
      </Section>

      <Section icon={Shield} title="Compliance & Rails" color="text-red-400">
        <div className="space-y-4">
          <ListField label="Compliance Notes" items={form.compliance_notes} input={complianceInput} setInput={setComplianceInput} listKey="compliance_notes" placeholder="Add compliance note" />
          <ListField label="Forbidden Elements" items={form.forbidden_elements} input={forbiddenInput} setInput={setForbiddenInput} listKey="forbidden_elements" placeholder="Add forbidden element" />
          <ListField label="Required Elements" items={form.required_elements} input={requiredInput} setInput={setRequiredInput} listKey="required_elements" placeholder="Add required element" />
        </div>
      </Section>

      <Section icon={Palette} title="Visual Style" color="text-violet-400">
        <Textarea value={form.visual_style} onChange={e => setForm({...form, visual_style: e.target.value})}
          className="bg-black/50 border-zinc-800 font-mono text-sm" rows={3} placeholder="Describe the visual style guidelines..." data-testid="settings-style" />
      </Section>

      <Section icon={Clock} title="Default Settings" color="text-amber-400">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { key: 'default_time_of_day', label: 'Time of Day' },
            { key: 'default_weather', label: 'Weather' },
            { key: 'default_lighting', label: 'Lighting' },
            { key: 'default_aspect_ratio', label: 'Aspect Ratio' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">{label}</label>
              <Input value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} className="bg-black/50 border-zinc-800 font-mono text-sm" />
            </div>
          ))}
        </div>
      </Section>

      <Button onClick={handleSave} disabled={saving} className="rounded-sm font-heading uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500" data-testid="save-settings-btn">
        <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}
