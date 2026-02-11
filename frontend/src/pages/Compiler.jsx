import { useState, useEffect, useCallback } from 'react';
import { compiler, worlds as worldsApi, characters as charsApi, enums as enumsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Copy, Check, Loader2, Image, Video, Volume2, StickyNote } from 'lucide-react';

export default function Compiler({ projectId }) {
  const [worldList, setWorldList] = useState([]);
  const [charList, setCharList] = useState([]);
  const [enumData, setEnumData] = useState({});
  const [form, setForm] = useState({
    scene_description: '', world_id: '', character_ids: [],
    emotional_zone: 'contemplative', framing: 'medium',
    camera_movement: 'static', time_of_day: '', weather: '', additional_context: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');

  const load = useCallback(async () => {
    const [w, c, e] = await Promise.all([worldsApi.list(projectId), charsApi.list(projectId), enumsApi.get()]);
    setWorldList(w);
    setCharList(c);
    setEnumData(e);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleCompile = async () => {
    if (!form.scene_description.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await compiler.compile(projectId, { ...form, project_id: projectId });
      setResult(res.result);
    } catch (e) {
      console.error(e);
      setResult({ error: 'Compilation failed. Check console.' });
    }
    setLoading(false);
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const toggleChar = (charId) => {
    setForm(prev => ({
      ...prev,
      character_ids: prev.character_ids.includes(charId)
        ? prev.character_ids.filter(id => id !== charId)
        : [...prev.character_ids, charId]
    }));
  };

  const CopyBtn = ({ text, label }) => (
    <button onClick={() => copyToClipboard(text, label)} className="text-zinc-600 hover:text-indigo-400 transition-colors" data-testid={`copy-${label}`}>
      {copied === label ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );

  return (
    <div data-testid="compiler" className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Input Panel */}
      <div className="space-y-4">
        <div className="glass-card rounded-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="font-heading font-bold text-lg uppercase text-white">Scene Compiler</h3>
          </div>

          <Textarea
            placeholder="Describe your scene in natural language...&#10;&#10;e.g., 'Mito drifts through a vast, depleted cellular landscape. Everything is dim and damaged. A faint pulse of light appears in the distance — the first signal from the scalar field.'"
            value={form.scene_description}
            onChange={e => setForm({ ...form, scene_description: e.target.value })}
            className="bg-black/50 border-zinc-800 font-body text-sm min-h-[120px]"
            rows={5}
            data-testid="scene-input"
          />

          {/* Parameters Grid */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">World</label>
              <Select value={form.world_id} onValueChange={v => setForm({ ...form, world_id: v })}>
                <SelectTrigger className="bg-black/50 border-zinc-800 font-mono text-sm h-9 rounded-sm" data-testid="world-select">
                  <SelectValue placeholder="Select world" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {worldList.map(w => <SelectItem key={w.id} value={w.id} className="font-mono text-sm">{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Zone</label>
              <Select value={form.emotional_zone} onValueChange={v => setForm({ ...form, emotional_zone: v })}>
                <SelectTrigger className="bg-black/50 border-zinc-800 font-mono text-sm h-9 rounded-sm" data-testid="zone-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {(enumData.emotional_zones || []).map(z => <SelectItem key={z} value={z} className="font-mono text-sm">{z}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Framing</label>
              <Select value={form.framing} onValueChange={v => setForm({ ...form, framing: v })}>
                <SelectTrigger className="bg-black/50 border-zinc-800 font-mono text-sm h-9 rounded-sm" data-testid="framing-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {(enumData.framings || []).map(f => <SelectItem key={f} value={f} className="font-mono text-sm">{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Camera</label>
              <Select value={form.camera_movement} onValueChange={v => setForm({ ...form, camera_movement: v })}>
                <SelectTrigger className="bg-black/50 border-zinc-800 font-mono text-sm h-9 rounded-sm" data-testid="camera-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {(enumData.camera_movements || []).map(c => <SelectItem key={c} value={c} className="font-mono text-sm">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Characters */}
          {charList.length > 0 && (
            <div className="mt-4">
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2 block">Characters in Scene</label>
              <div className="flex flex-wrap gap-2">
                {charList.map(c => (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer bg-zinc-900/50 rounded-sm px-3 py-1.5 border border-zinc-800 hover:border-violet-500/30 transition-colors">
                    <Checkbox checked={form.character_ids.includes(c.id)} onCheckedChange={() => toggleChar(c.id)} className="rounded-sm" data-testid={`char-check-${c.id}`} />
                    <span className="font-mono text-xs text-zinc-400">{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleCompile}
            disabled={loading || !form.scene_description.trim()}
            className="w-full mt-4 rounded-sm font-heading uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
            data-testid="compile-btn"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {loading ? 'Compiling...' : 'Compile Scene'}
          </Button>
        </div>
      </div>

      {/* Output Panel */}
      <div className="space-y-4">
        {!result && !loading && (
          <div className="glass-card rounded-sm p-12 text-center">
            <Sparkles className="w-10 h-10 text-zinc-800 mx-auto mb-3" />
            <p className="font-heading text-lg text-zinc-600 uppercase">Awaiting Compilation</p>
            <p className="text-sm text-zinc-700 mt-1">Describe a scene and hit compile</p>
          </div>
        )}

        {loading && (
          <div className="glass-card rounded-sm p-12 text-center">
            <Loader2 className="w-8 h-8 text-indigo-500 mx-auto mb-3 animate-spin" />
            <p className="font-heading text-lg text-indigo-400 uppercase">Compiling with GPT-5.2</p>
            <p className="font-mono text-[10px] text-zinc-600 mt-1">Generating image, video, and audio prompts...</p>
          </div>
        )}

        {result && !result.error && (
          <>
            {/* Image Prompt */}
            <div className="glass-card rounded-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-cyan-400" />
                  <span className="font-heading font-bold text-sm uppercase text-white">Image Prompt</span>
                  <Badge className="rounded-sm font-mono text-[8px] bg-cyan-500/10 text-cyan-400">ArtCraft</Badge>
                </div>
                <CopyBtn text={result.image_prompt || ''} label="image" />
              </div>
              <p className="font-mono text-xs text-zinc-400 leading-relaxed">{result.image_prompt}</p>
            </div>

            {/* Video Prompt */}
            <div className="glass-card rounded-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-violet-400" />
                  <span className="font-heading font-bold text-sm uppercase text-white">Video Prompt</span>
                  <Badge className="rounded-sm font-mono text-[8px] bg-violet-500/10 text-violet-400">Veo / Kling</Badge>
                </div>
                <CopyBtn text={result.video_prompt || ''} label="video" />
              </div>
              <p className="font-mono text-xs text-zinc-400 leading-relaxed">{result.video_prompt}</p>
            </div>

            {/* Audio Stack */}
            {result.audio_stack && (
              <div className="glass-card rounded-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-pink-400" />
                    <span className="font-heading font-bold text-sm uppercase text-white">Audio Stack</span>
                  </div>
                  <CopyBtn text={JSON.stringify(result.audio_stack, null, 2)} label="audio" />
                </div>
                <div className="space-y-2">
                  {Object.entries(result.audio_stack).map(([key, val]) => (
                    <div key={key} className="bg-zinc-950/50 rounded-sm p-2.5">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block mb-1">{key.replace('_', ' ')}</span>
                      <p className="font-mono text-xs text-zinc-400">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Director Notes */}
            {result.director_notes && (
              <div className="glass-card rounded-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <StickyNote className="w-4 h-4 text-amber-400" />
                  <span className="font-heading font-bold text-sm uppercase text-white">Director Notes</span>
                </div>
                <p className="font-mono text-xs text-zinc-400 leading-relaxed">{result.director_notes}</p>
              </div>
            )}

            {/* Coherence Flags */}
            {result.coherence_flags && result.coherence_flags.length > 0 && (
              <div className="glass-card rounded-sm p-4 border-amber-500/20">
                <span className="font-heading font-bold text-sm uppercase text-amber-400 block mb-2">Coherence Flags</span>
                {result.coherence_flags.map((flag, i) => (
                  <p key={i} className="font-mono text-xs text-amber-300/70 mb-1">- {flag}</p>
                ))}
              </div>
            )}
          </>
        )}

        {result && result.error && (
          <div className="glass-card rounded-sm p-6 border-red-500/20">
            <p className="font-mono text-sm text-red-400">{result.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
