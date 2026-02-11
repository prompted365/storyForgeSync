import { useState, useEffect, useCallback } from 'react';
import { worlds as worldsApi, characters as charsApi, objects as objectsApi, imageDescribe } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Users, Box, Plus, ExternalLink, Trash2, MapPin, Sparkles, Image, Pencil, X, Check, Loader2, Wand2 } from 'lucide-react';

const ZONE_COLORS = {
  intimate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  contemplative: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  tense: 'bg-red-500/10 text-red-400 border-red-500/20',
  revelatory: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  chaotic: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  transcendent: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
  desolate: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  triumphant: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  liminal: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

function InlineField({ value, onSave, textarea, placeholder, mono }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  useEffect(() => { setVal(value || ''); }, [value]);
  const save = () => { onSave(val); setEditing(false); toast.success('Updated'); };
  const cancel = () => { setVal(value || ''); setEditing(false); };

  if (!editing) {
    return (
      <div className="group/inline cursor-pointer" onClick={() => setEditing(true)}>
        <p className={`text-sm text-zinc-400 ${!value ? 'text-zinc-700 italic' : ''} ${mono ? 'font-mono text-[10px] text-zinc-600' : ''}`}>
          {value || placeholder || 'Click to edit'}
        </p>
        <Pencil className="w-2.5 h-2.5 text-zinc-700 inline ml-1 opacity-0 group-hover/inline:opacity-100 transition-opacity" />
      </div>
    );
  }

  return (
    <div className="flex gap-1 items-start">
      {textarea ? (
        <Textarea value={val} onChange={e => setVal(e.target.value)} className="bg-black/50 border-zinc-800 font-mono text-sm flex-1" rows={2} autoFocus />
      ) : (
        <Input value={val} onChange={e => setVal(e.target.value)} className="bg-black/50 border-zinc-800 font-mono text-sm flex-1 h-7" autoFocus
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }} />
      )}
      <Button variant="ghost" size="sm" onClick={save} className="h-7 w-7 p-0 text-emerald-400"><Check className="w-3 h-3" /></Button>
      <Button variant="ghost" size="sm" onClick={cancel} className="h-7 w-7 p-0 text-zinc-600"><X className="w-3 h-3" /></Button>
    </div>
  );
}

function AIDescribeButton({ projectId, entityType, onResult }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const describe = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await imageDescribe.describe(projectId, { image_url: url, entity_type: entityType });
      onResult(res.result, url);
      toast.success('AI description generated');
      setOpen(false);
      setUrl('');
    } catch (e) { toast.error('Description failed — check API key in Settings'); }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-sm font-mono text-[10px] text-indigo-400/60 hover:text-indigo-400 h-6 px-2" data-testid={`ai-describe-${entityType}-btn`}>
          <Wand2 className="w-3 h-3 mr-1" /> AI Describe from Image
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0a0a0a] border-zinc-800 max-w-md">
        <DialogHeader><DialogTitle className="font-heading uppercase text-white text-sm">AI Image Description</DialogTitle></DialogHeader>
        <p className="text-xs text-zinc-600 mb-3">Paste an image URL and AI will generate a structured {entityType} description.</p>
        <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="bg-black/50 border-zinc-800 font-mono text-sm" data-testid="ai-describe-url" />
        {url && <img src={url} alt="preview" className="w-full h-32 object-cover rounded-sm border border-zinc-800 mt-2" onError={e => { e.target.style.display = 'none'; }} />}
        <Button onClick={describe} disabled={loading || !url.trim()} className="w-full rounded-sm font-heading uppercase bg-indigo-600 hover:bg-indigo-500 mt-2" data-testid="ai-describe-go">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
          {loading ? 'Analyzing...' : 'Describe Image'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function WorldCard({ world, projectId, onDelete, onUpdate }) {
  const saveField = async (field, value) => {
    var data = { ...world }; data[field] = value; delete data.id; delete data.project_id; delete data.created_at;
    await worldsApi.update(projectId, world.id, data);
    onUpdate();
  };

  return (
    <div className="glass-card rounded-sm p-5 trace-border group" data-testid={`world-card-${world.id}`}>
      {world.reference_images && world.reference_images.length > 0 && (
        <div className="flex gap-1 mb-3 -mt-1">
          {world.reference_images.slice(0, 3).map((url, i) => (
            <img key={i} src={url} alt="" className="h-16 flex-1 object-cover rounded-sm border border-zinc-800" onError={e => { e.target.style.display='none'; }} />
          ))}
        </div>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <Globe className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <InlineField value={world.name} onSave={v => saveField('name', v)} placeholder="World name" />
        </div>
        <Button variant="ghost" size="sm" onClick={() => { if(window.confirm('Delete "' + world.name + '"?')) onDelete(world.id); }}
          className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 h-7 w-7 p-0 flex-shrink-0" data-testid={`delete-world-${world.id}`}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      <InlineField value={world.description} onSave={v => saveField('description', v)} placeholder="Add description..." textarea />
      <div className="flex flex-wrap gap-1.5 my-3">
        <Badge className={`rounded-sm font-mono text-[9px] ${ZONE_COLORS[world.emotional_zone] || ZONE_COLORS.contemplative}`}>{world.emotional_zone}</Badge>
        {world.spatial_character && <Badge variant="secondary" className="rounded-sm font-mono text-[9px] bg-zinc-900 text-zinc-500"><MapPin className="w-2.5 h-2.5 mr-1" />{world.spatial_character}</Badge>}
      </div>
      {world.lighting_notes && <p className="font-mono text-[10px] text-zinc-600 line-clamp-2 mb-2"><Sparkles className="w-2.5 h-2.5 inline mr-1" />{world.lighting_notes}</p>}
      {world.marble_url && (
        <a href={world.marble_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
          <ExternalLink className="w-3 h-3" /> Open in Marble
        </a>
      )}
    </div>
  );
}

function CharacterCard({ char, projectId, onDelete, onUpdate }) {
  const saveField = async (field, value) => {
    var data = { ...char }; data[field] = value; delete data.id; delete data.project_id; delete data.created_at;
    await charsApi.update(projectId, char.id, data);
    onUpdate();
  };

  return (
    <div className="glass-card rounded-sm p-5 trace-border group" data-testid={`char-card-${char.id}`}>
      {char.identity_images && char.identity_images.length > 0 && (
        <div className="flex gap-1 mb-3 -mt-1">
          {char.identity_images.slice(0, 3).map((url, i) => (
            <img key={i} src={url} alt="" className="h-16 flex-1 object-cover rounded-sm border border-zinc-800" onError={e => { e.target.style.display='none'; }} />
          ))}
        </div>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <InlineField value={char.name} onSave={v => saveField('name', v)} placeholder="Character name" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-violet-400">{char.role}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { if(window.confirm('Delete "' + char.name + '"?')) onDelete(char.id); }}
          className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 h-7 w-7 p-0 flex-shrink-0" data-testid={`delete-char-${char.id}`}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      <InlineField value={char.description} onSave={v => saveField('description', v)} placeholder="Add description..." textarea />
      {char.personality && <div className="mt-2"><InlineField value={char.personality} onSave={v => saveField('personality', v)} placeholder="Personality" mono /></div>}
      {char.visual_notes && <div className="mt-1"><InlineField value={char.visual_notes} onSave={v => saveField('visual_notes', v)} placeholder="Visual notes" mono /></div>}
      {char.arc_summary && (
        <div className="mt-3 pt-3 border-t border-zinc-800">
          <InlineField value={char.arc_summary} onSave={v => saveField('arc_summary', v)} placeholder="Character arc" mono />
        </div>
      )}
    </div>
  );
}

function AddWorldDialog({ projectId, onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', emotional_zone: 'contemplative', spatial_character: '', lighting_notes: '', marble_url: '', atmosphere: '' });

  const handleSubmit = async () => {
    if (!form.name) return;
    await worldsApi.create(projectId, form);
    toast.success('World "' + form.name + '" created');
    setOpen(false);
    setForm({ name: '', description: '', emotional_zone: 'contemplative', spatial_character: '', lighting_notes: '', marble_url: '', atmosphere: '' });
    onCreated();
  };

  const handleAIResult = (result, imageUrl) => {
    setForm(prev => ({
      ...prev, name: result.name || prev.name, description: result.description || prev.description,
      emotional_zone: result.emotional_zone || prev.emotional_zone, lighting_notes: result.lighting_notes || prev.lighting_notes,
      spatial_character: result.spatial_character || prev.spatial_character, atmosphere: result.atmosphere || prev.atmosphere,
      reference_images: [imageUrl],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-sm font-heading uppercase tracking-wider text-sm bg-cyan-600 hover:bg-cyan-500" data-testid="add-world-btn">
          <Plus className="w-4 h-4 mr-2" /> Add World
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0a0a0a] border-zinc-800 max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading uppercase text-white">New World</DialogTitle>
        </DialogHeader>
        <AIDescribeButton projectId={projectId} entityType="world" onResult={handleAIResult} />
        <div className="space-y-3">
          <Input placeholder="World Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-black/50 border-zinc-800 font-mono text-sm" data-testid="world-name-input" />
          <Textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-black/50 border-zinc-800 font-mono text-sm" rows={3} data-testid="world-desc-input" />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Emotional Zone" value={form.emotional_zone} onChange={e => setForm({...form, emotional_zone: e.target.value})} className="bg-black/50 border-zinc-800 font-mono text-sm" />
            <Input placeholder="Spatial Character" value={form.spatial_character} onChange={e => setForm({...form, spatial_character: e.target.value})} className="bg-black/50 border-zinc-800 font-mono text-sm" />
          </div>
          <Input placeholder="Lighting Notes" value={form.lighting_notes} onChange={e => setForm({...form, lighting_notes: e.target.value})} className="bg-black/50 border-zinc-800 font-mono text-sm" />
          <Input placeholder="Marble URL" value={form.marble_url} onChange={e => setForm({...form, marble_url: e.target.value})} className="bg-black/50 border-zinc-800 font-mono text-sm" />
          <Button onClick={handleSubmit} className="w-full rounded-sm font-heading uppercase bg-cyan-600 hover:bg-cyan-500" data-testid="save-world-btn">Create World</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddCharacterDialog({ projectId, onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', description: '', personality: '', visual_notes: '', voice_profile: '', arc_summary: '' });

  const handleSubmit = async () => {
    if (!form.name) return;
    await charsApi.create(projectId, form);
    toast.success('Character "' + form.name + '" created');
    setOpen(false);
    setForm({ name: '', role: '', description: '', personality: '', visual_notes: '', voice_profile: '', arc_summary: '' });
    onCreated();
  };

  const handleAIResult = (result, imageUrl) => {
    setForm(prev => ({
      ...prev, name: result.name || prev.name, description: result.description || prev.description,
      personality: result.personality || prev.personality, visual_notes: result.visual_notes || prev.visual_notes,
      voice_profile: result.voice_profile || prev.voice_profile, role: result.role || prev.role,
      identity_images: [imageUrl],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-sm font-heading uppercase tracking-wider text-sm bg-violet-600 hover:bg-violet-500" data-testid="add-char-btn">
          <Plus className="w-4 h-4 mr-2" /> Add Character
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0a0a0a] border-zinc-800 max-w-lg">
        <DialogHeader><DialogTitle className="font-heading uppercase text-white">New Character</DialogTitle></DialogHeader>
        <AIDescribeButton projectId={projectId} entityType="character" onResult={handleAIResult} />
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-black/50 border-zinc-800 font-mono text-sm" data-testid="char-name-input" />
            <Input placeholder="Role" value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="bg-black/50 border-zinc-800 font-mono text-sm" />
          </div>
          <Textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-black/50 border-zinc-800 font-mono text-sm" rows={2} data-testid="char-desc-input" />
          <Input placeholder="Personality" value={form.personality} onChange={e => setForm({...form, personality: e.target.value})} className="bg-black/50 border-zinc-800 font-mono text-sm" />
          <Input placeholder="Visual Notes" value={form.visual_notes} onChange={e => setForm({...form, visual_notes: e.target.value})} className="bg-black/50 border-zinc-800 font-mono text-sm" />
          <Input placeholder="Arc Summary" value={form.arc_summary} onChange={e => setForm({...form, arc_summary: e.target.value})} className="bg-black/50 border-zinc-800 font-mono text-sm" />
          <Button onClick={handleSubmit} className="w-full rounded-sm font-heading uppercase bg-violet-600 hover:bg-violet-500" data-testid="save-char-btn">Create Character</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function WorldBible({ projectId, onUpdate }) {
  const [worldList, setWorldList] = useState([]);
  const [charList, setCharList] = useState([]);
  const [objList, setObjList] = useState([]);
  const [subTab, setSubTab] = useState('worlds');

  const load = useCallback(async () => {
    const [w, c, o] = await Promise.all([worldsApi.list(projectId), charsApi.list(projectId), objectsApi.list(projectId)]);
    setWorldList(w); setCharList(c); setObjList(o);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleDeleteWorld = async (id) => { await worldsApi.delete(projectId, id); toast.success('World deleted'); load(); onUpdate(); };
  const handleDeleteChar = async (id) => { await charsApi.delete(projectId, id); toast.success('Character deleted'); load(); onUpdate(); };

  return (
    <div data-testid="world-bible">
      <Tabs value={subTab} onValueChange={setSubTab}>
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-zinc-900/50 rounded-sm">
            <TabsTrigger value="worlds" className="rounded-sm font-heading uppercase text-xs data-[state=active]:bg-zinc-800" data-testid="subtab-worlds">
              <Globe className="w-3.5 h-3.5 mr-1.5" /> Worlds ({worldList.length})
            </TabsTrigger>
            <TabsTrigger value="characters" className="rounded-sm font-heading uppercase text-xs data-[state=active]:bg-zinc-800" data-testid="subtab-characters">
              <Users className="w-3.5 h-3.5 mr-1.5" /> Characters ({charList.length})
            </TabsTrigger>
            <TabsTrigger value="objects" className="rounded-sm font-heading uppercase text-xs data-[state=active]:bg-zinc-800" data-testid="subtab-objects">
              <Box className="w-3.5 h-3.5 mr-1.5" /> Props ({objList.length})
            </TabsTrigger>
          </TabsList>
          <div>
            {subTab === 'worlds' && <AddWorldDialog projectId={projectId} onCreated={() => { load(); onUpdate(); }} />}
            {subTab === 'characters' && <AddCharacterDialog projectId={projectId} onCreated={() => { load(); onUpdate(); }} />}
          </div>
        </div>

        <TabsContent value="worlds" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {worldList.map(w => <WorldCard key={w.id} world={w} projectId={projectId} onDelete={handleDeleteWorld} onUpdate={() => { load(); onUpdate(); }} />)}
          </div>
          {worldList.length === 0 && <EmptyState icon={Globe} label="No worlds yet" />}
        </TabsContent>

        <TabsContent value="characters" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {charList.map(c => <CharacterCard key={c.id} char={c} projectId={projectId} onDelete={handleDeleteChar} onUpdate={() => { load(); onUpdate(); }} />)}
          </div>
          {charList.length === 0 && <EmptyState icon={Users} label="No characters yet" />}
        </TabsContent>

        <TabsContent value="objects" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {objList.map(o => (
              <div key={o.id} className="glass-card rounded-sm p-5 trace-border" data-testid={`obj-card-${o.id}`}>
                <h3 className="font-heading font-bold text-lg uppercase text-white">{o.name}</h3>
                <p className="font-mono text-[10px] text-zinc-500 uppercase mb-2">{o.category}</p>
                <p className="text-sm text-zinc-500">{o.description}</p>
              </div>
            ))}
          </div>
          {objList.length === 0 && <EmptyState icon={Box} label="No props yet" />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ icon: Icon, label }) {
  return (
    <div className="glass-card rounded-sm p-12 text-center">
      <Icon className="w-10 h-10 text-zinc-800 mx-auto mb-3" />
      <p className="font-heading text-lg text-zinc-600 uppercase">{label}</p>
    </div>
  );
}
