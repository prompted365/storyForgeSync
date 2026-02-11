import { useState, useEffect } from 'react';
import { projects as projectsApi, secrets as secretsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, Shield, Palette, Clock, Key, Eye, EyeOff, Check, Tag, Sliders } from 'lucide-react';

export default function ProjectSettings({ projectId, project, onUpdate }) {
  const [form, setForm] = useState({
    name: '', brand_primary: '', brand_secondary: '', description: '',
    compliance_notes: [], forbidden_elements: [], required_elements: [],
    visual_style: '', default_time_of_day: 'day', default_weather: 'clear',
    default_lighting: 'natural', default_aspect_ratio: '16:9', model_preferences: {}, tags: [], target_duration_sec: 300
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [complianceInput, setComplianceInput] = useState('');
  const [forbiddenInput, setForbiddenInput] = useState('');
  const [requiredInput, setRequiredInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  // Secrets
  const [secretsList, setSecretsList] = useState([]);
  const [newSecretKey, setNewSecretKey] = useState('EMERGENT_LLM_KEY');
  const [newSecretVal, setNewSecretVal] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  // Model prefs
  const [modelKey, setModelKey] = useState('');
  const [modelVal, setModelVal] = useState('');

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || '', brand_primary: project.brand_primary || '',
        brand_secondary: project.brand_secondary || '', description: project.description || '',
        compliance_notes: project.compliance_notes || [], forbidden_elements: project.forbidden_elements || [],
        required_elements: project.required_elements || [], visual_style: project.visual_style || '',
        default_time_of_day: project.default_time_of_day || 'day', default_weather: project.default_weather || 'clear',
        default_lighting: project.default_lighting || 'natural', default_aspect_ratio: project.default_aspect_ratio || '16:9',
        model_preferences: project.model_preferences || {}, tags: project.tags || [],
        target_duration_sec: project.target_duration_sec || 300,
      });
    }
    loadSecrets();
  }, [project]);

  const loadSecrets = async () => {
    try { setSecretsList(await secretsApi.list()); } catch (e) { /* ignore */ }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await projectsApi.update(projectId, form);
      onUpdate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleSaveSecret = async () => {
    if (!newSecretVal.trim()) return;
    await secretsApi.update(newSecretKey, newSecretVal);
    setNewSecretVal('');
    loadSecrets();
  };

  const addToList = (key, input, setInput) => {
    if (!input.trim()) return;
    setForm(prev => ({ ...prev, [key]: [...prev[key], input.trim()] }));
    setInput('');
  };
  const removeFromList = (key, idx) => {
    setForm(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== idx) }));
  };
  const addModelPref = () => {
    if (!modelKey.trim() || !modelVal.trim()) return;
    setForm(prev => ({ ...prev, model_preferences: { ...prev.model_preferences, [modelKey]: modelVal } }));
    setModelKey(''); setModelVal('');
  };
  const removeModelPref = (k) => {
    const mp = { ...form.model_preferences };
    delete mp[k];
    setForm(prev => ({ ...prev, model_preferences: mp }));
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
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addToList(listKey, input, setInput))}
          placeholder={placeholder} className="bg-black/50 border-zinc-800 font-mono text-sm flex-1" />
        <Button onClick={() => addToList(listKey, input, setInput)} variant="outline" size="sm" className="rounded-sm border-zinc-700 font-mono text-xs">Add</Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <Badge key={i} className="rounded-sm font-mono text-[10px] bg-zinc-900 text-zinc-400 border-zinc-800 cursor-pointer hover:border-red-500/30 hover:text-red-400 transition-colors"
            onClick={() => removeFromList(listKey, i)}>{item} x</Badge>
        ))}
      </div>
    </div>
  );

  return (
    <div data-testid="project-settings" className="max-w-4xl space-y-6">
      {/* Secrets / API Keys */}
      <Section icon={Key} title="API Keys & Secrets" color="text-amber-400">
        <p className="text-xs text-zinc-600 mb-4">Manage API keys used by the AI compiler. Keys are stored securely and never displayed in full.</p>
        <div className="space-y-3">
          {secretsList.map(s => (
            <div key={s.key} className="flex items-center gap-3 bg-zinc-950/50 rounded-sm p-3 border border-zinc-800/50">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-xs text-zinc-400 flex-1">{s.key}</span>
              <span className="font-mono text-[10px] text-zinc-600">{s.set ? s.value : 'Not set'}</span>
              <Badge className={`rounded-sm font-mono text-[8px] ${s.set ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                {s.set ? 'Active' : 'Empty'}
              </Badge>
            </div>
          ))}
          <div className="flex gap-2">
            <select value={newSecretKey} onChange={e => setNewSecretKey(e.target.value)}
              className="bg-black/50 border border-zinc-800 rounded-sm px-3 py-2 font-mono text-sm text-zinc-400 focus:border-indigo-500 outline-none" data-testid="secret-key-select">
              <option value="EMERGENT_LLM_KEY">EMERGENT_LLM_KEY</option>
              <option value="NOTION_API_KEY">NOTION_API_KEY</option>
              <option value="NOTION_DB_ID">NOTION_DB_ID</option>
              <option value="CUSTOM_KEY">Custom Key</option>
            </select>
            <div className="flex-1 relative">
              <Input value={newSecretVal} onChange={e => setNewSecretVal(e.target.value)}
                type={showSecret ? 'text' : 'password'} placeholder="Enter API key value"
                className="bg-black/50 border-zinc-800 font-mono text-sm pr-10" data-testid="secret-value-input" />
              <button onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
                {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <Button onClick={handleSaveSecret} className="rounded-sm font-heading uppercase text-sm bg-amber-600 hover:bg-amber-500" data-testid="save-secret-btn">
              <Key className="w-3.5 h-3.5 mr-1" /> Set
            </Button>
          </div>
        </div>
      </Section>

      {/* Project Identity */}
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
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Target Duration (seconds)</label>
            <Input type="number" value={form.target_duration_sec} onChange={e => setForm({...form, target_duration_sec: parseFloat(e.target.value) || 300})} className="bg-black/50 border-zinc-800 font-mono text-sm w-32" />
          </div>
        </div>
      </Section>

      {/* Tags */}
      <Section icon={Tag} title="Tags" color="text-cyan-400">
        <ListField label="Project Tags" items={form.tags} input={tagInput} setInput={setTagInput} listKey="tags" placeholder="Add tag" />
      </Section>

      {/* Compliance */}
      <Section icon={Shield} title="Compliance & Rails" color="text-red-400">
        <div className="space-y-4">
          <ListField label="Compliance Notes" items={form.compliance_notes} input={complianceInput} setInput={setComplianceInput} listKey="compliance_notes" placeholder="Add compliance note" />
          <ListField label="Forbidden Elements" items={form.forbidden_elements} input={forbiddenInput} setInput={setForbiddenInput} listKey="forbidden_elements" placeholder="Add forbidden element" />
          <ListField label="Required Elements" items={form.required_elements} input={requiredInput} setInput={setRequiredInput} listKey="required_elements" placeholder="Add required element" />
        </div>
      </Section>

      {/* Visual Style */}
      <Section icon={Palette} title="Visual Style" color="text-violet-400">
        <Textarea value={form.visual_style} onChange={e => setForm({...form, visual_style: e.target.value})}
          className="bg-black/50 border-zinc-800 font-mono text-sm" rows={3} placeholder="Describe the visual style..." data-testid="settings-style" />
      </Section>

      {/* Model Preferences */}
      <Section icon={Sliders} title="Model Preferences" color="text-pink-400">
        <p className="text-xs text-zinc-600 mb-3">Set preferred AI models for each generation type (image, video, world, audio).</p>
        <div className="space-y-2 mb-3">
          {Object.entries(form.model_preferences).map(([k, v]) => (
            <div key={k} className="flex items-center gap-3 bg-zinc-950/50 rounded-sm p-2.5 border border-zinc-800/50">
              <span className="font-mono text-xs text-zinc-400 w-20">{k}</span>
              <span className="font-mono text-xs text-zinc-300 flex-1">{v}</span>
              <button onClick={() => removeModelPref(k)} className="text-zinc-600 hover:text-red-400 text-xs">x</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={modelKey} onChange={e => setModelKey(e.target.value)} placeholder="Type (e.g. image)" className="bg-black/50 border-zinc-800 font-mono text-sm w-32" />
          <Input value={modelVal} onChange={e => setModelVal(e.target.value)} placeholder="Model name" className="bg-black/50 border-zinc-800 font-mono text-sm flex-1" />
          <Button onClick={addModelPref} variant="outline" size="sm" className="rounded-sm border-zinc-700 font-mono text-xs">Add</Button>
        </div>
      </Section>

      {/* Defaults */}
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
        {saved ? <Check className="w-4 h-4 mr-2 text-emerald-400" /> : <Save className="w-4 h-4 mr-2" />}
        {saving ? 'Saving...' : saved ? 'Saved' : 'Save Settings'}
      </Button>
    </div>
  );
}
