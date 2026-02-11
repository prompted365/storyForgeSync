import { useState, useEffect, useCallback } from 'react';
import { worlds as worldsApi, characters as charsApi, objects as objectsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Users, Box, Plus, ExternalLink, Trash2, MapPin, Sparkles, Image } from 'lucide-react';

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

function WorldCard({ world, onDelete }) {
  return (
    <div className="glass-card rounded-sm p-5 trace-border group" data-testid={`world-card-${world.id}`}>
      {/* Reference Images */}
      {world.reference_images && world.reference_images.length > 0 && (
        <div className="flex gap-1 mb-3 -mt-1">
          {world.reference_images.slice(0, 3).map((url, i) => (
            <img key={i} src={url} alt="" className="h-16 flex-1 object-cover rounded-sm border border-zinc-800" onError={e => e.target.style.display='none'} />
          ))}
        </div>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <h3 className="font-heading font-bold text-lg uppercase tracking-tight text-white">{world.name}</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { if(window.confirm(`Delete world "${world.name}"?`)) onDelete(world.id); }}
          className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 h-7 w-7 p-0" data-testid={`delete-world-${world.id}`}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      <p className="text-sm text-zinc-500 mb-3 line-clamp-3">{world.description}</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Badge className={`rounded-sm font-mono text-[9px] ${ZONE_COLORS[world.emotional_zone] || ZONE_COLORS.contemplative}`}>
          {world.emotional_zone}
        </Badge>
        {world.spatial_character && (
          <Badge variant="secondary" className="rounded-sm font-mono text-[9px] bg-zinc-900 text-zinc-500">
            <MapPin className="w-2.5 h-2.5 mr-1" />{world.spatial_character}
          </Badge>
        )}
      </div>
      {world.lighting_notes && <p className="font-mono text-[10px] text-zinc-600 line-clamp-2"><Sparkles className="w-2.5 h-2.5 inline mr-1" />{world.lighting_notes}</p>}
      {world.marble_url && (
        <a href={world.marble_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 mt-3 text-xs text-indigo-400 hover:text-indigo-300">
          <ExternalLink className="w-3 h-3" /> Open in Marble
        </a>
      )}
    </div>
  );
}

function CharacterCard({ char, onDelete }) {
  return (
    <div className="glass-card rounded-sm p-5 trace-border group" data-testid={`char-card-${char.id}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-heading font-bold text-lg uppercase tracking-tight text-white">{char.name}</h3>
          <p className="font-mono text-[10px] uppercase tracking-widest text-violet-400">{char.role}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onDelete(char.id)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 h-7 w-7 p-0" data-testid={`delete-char-${char.id}`}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      <p className="text-sm text-zinc-500 mb-3 line-clamp-3">{char.description}</p>
      {char.personality && <p className="text-xs text-zinc-600 mb-2"><span className="text-zinc-400 font-medium">Personality:</span> {char.personality}</p>}
      {char.visual_notes && <p className="text-xs text-zinc-600 mb-2"><span className="text-zinc-400 font-medium">Visual:</span> {char.visual_notes}</p>}
      {char.arc_summary && (
        <div className="mt-3 pt-3 border-t border-zinc-800">
          <p className="font-mono text-[10px] text-zinc-600"><span className="text-zinc-500 uppercase">Arc:</span> {char.arc_summary}</p>
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
    setOpen(false);
    setForm({ name: '', description: '', emotional_zone: 'contemplative', spatial_character: '', lighting_notes: '', marble_url: '', atmosphere: '' });
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-sm font-heading uppercase tracking-wider text-sm bg-cyan-600 hover:bg-cyan-500" data-testid="add-world-btn">
          <Plus className="w-4 h-4 mr-2" /> Add World
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0a0a0a] border-zinc-800 max-w-lg">
        <DialogHeader><DialogTitle className="font-heading uppercase text-white">New World</DialogTitle></DialogHeader>
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
    setOpen(false);
    setForm({ name: '', role: '', description: '', personality: '', visual_notes: '', voice_profile: '', arc_summary: '' });
    onCreated();
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
    const [w, c, o] = await Promise.all([
      worldsApi.list(projectId),
      charsApi.list(projectId),
      objectsApi.list(projectId),
    ]);
    setWorldList(w);
    setCharList(c);
    setObjList(o);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleDeleteWorld = async (id) => { await worldsApi.delete(projectId, id); load(); onUpdate(); };
  const handleDeleteChar = async (id) => { await charsApi.delete(projectId, id); load(); onUpdate(); };

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
            {worldList.map(w => <WorldCard key={w.id} world={w} onDelete={handleDeleteWorld} />)}
          </div>
          {worldList.length === 0 && <EmptyState icon={Globe} label="No worlds yet" />}
        </TabsContent>

        <TabsContent value="characters" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {charList.map(c => <CharacterCard key={c.id} char={c} onDelete={handleDeleteChar} />)}
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
