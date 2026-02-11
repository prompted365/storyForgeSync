import { useState, useEffect, useCallback } from 'react';
import { compiler, worlds as worldsApi, characters as charsApi, enums as enumsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Copy, Check, Loader2, Image, Video, Volume2, StickyNote, History, ArrowLeftRight, AlertTriangle } from 'lucide-react';

export default function Compiler({ projectId, preFill }) {
  const [worldList, setWorldList] = useState([]);
  const [charList, setCharList] = useState([]);
  const [enumData, setEnumData] = useState({});
  const [form, setForm] = useState({
    scene_description: '', world_id: '', character_ids: [],
    emotional_zone: 'contemplative', framing: 'medium',
    camera_movement: 'static', time_of_day: '', weather: '',
    additional_context: '', reference_images: [],
    prev_shot_last_frame: '', next_shot_first_frame: '', shot_id: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [refInput, setRefInput] = useState('');

  const load = useCallback(async () => {
    const [w, c, e] = await Promise.all([worldsApi.list(projectId), charsApi.list(projectId), enumsApi.get()]);
    setWorldList(w); setCharList(c); setEnumData(e);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  // Apply preFill when it changes
  useEffect(() => {
    if (preFill) {
      setForm(prev => ({ ...prev, ...preFill }));
      setResult(null);
    }
  }, [preFill]);

  const loadHistory = async () => {
    try {
      const h = await compiler.history(projectId, form.shot_id || undefined);
      setHistory(h);
      setShowHistory(true);
    } catch (e) { console.error(e); }
  };

  const handleCompile = async () => {
    if (!form.scene_description.trim()) { toast.error('Scene description required'); return; }
    setLoading(true); setResult(null);
    try {
      const res = await compiler.compile(projectId, { ...form, project_id: projectId });
      setResult(res.result);
      toast.success('Scene compiled successfully');
    } catch (e) {
      toast.error('Compilation failed');
      setResult({ error: 'Compilation failed. Check console.' });
    }
    setLoading(false);
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : text);
    setCopied(key); setTimeout(() => setCopied(''), 2000);
    toast.success('Copied to clipboard');
  };

  const toggleChar = (charId) => {
    setForm(prev => ({
      ...prev, character_ids: prev.character_ids.includes(charId) ? prev.character_ids.filter(id => id !== charId) : [...prev.character_ids, charId]
    }));
  };

  const addRef = () => { if (refInput.trim()) { setForm(prev => ({ ...prev, reference_images: [...prev.reference_images, refInput.trim()] })); setRefInput(''); } };
  const removeRef = (idx) => setForm(prev => ({ ...prev, reference_images: prev.reference_images.filter((_, i) => i !== idx) }));

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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="font-heading font-bold text-lg uppercase text-white">Scene Compiler</h3>
              {form.shot_id && <Badge className="rounded-sm font-mono text-[8px] bg-violet-500/10 text-violet-400">From Shot</Badge>}
            </div>
            <Button variant="ghost" size="sm" onClick={loadHistory} className="text-zinc-600 hover:text-indigo-400" data-testid="history-btn">
              <History className="w-3.5 h-3.5 mr-1" /> History
            </Button>
          </div>

          <Textarea value={form.scene_description} onChange={e => setForm({ ...form, scene_description: e.target.value })}
            placeholder="Describe your scene in natural language..." className="bg-black/50 border-zinc-800 font-body text-sm min-h-[100px]" rows={4} data-testid="scene-input" />

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">World</label>
              <Select value={form.world_id || 'none'} onValueChange={v => setForm({ ...form, world_id: v === 'none' ? '' : v })}>
                <SelectTrigger className="bg-black/50 border-zinc-800 font-mono text-sm h-9 rounded-sm" data-testid="world-select"><SelectValue placeholder="Select world" /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="none" className="font-mono text-sm">None</SelectItem>
                  {worldList.map(w => <SelectItem key={w.id} value={w.id} className="font-mono text-sm">{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Zone</label>
              <Select value={form.emotional_zone} onValueChange={v => setForm({ ...form, emotional_zone: v })}>
                <SelectTrigger className="bg-black/50 border-zinc-800 font-mono text-sm h-9 rounded-sm" data-testid="zone-select"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {(enumData.emotional_zones || []).map(z => <SelectItem key={z} value={z} className="font-mono text-sm">{z}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Framing</label>
              <Select value={form.framing} onValueChange={v => setForm({ ...form, framing: v })}>
                <SelectTrigger className="bg-black/50 border-zinc-800 font-mono text-sm h-9 rounded-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {(enumData.framings || []).map(f => <SelectItem key={f} value={f} className="font-mono text-sm">{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Camera</label>
              <Select value={form.camera_movement} onValueChange={v => setForm({ ...form, camera_movement: v })}>
                <SelectTrigger className="bg-black/50 border-zinc-800 font-mono text-sm h-9 rounded-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {(enumData.camera_movements || []).map(c => <SelectItem key={c} value={c} className="font-mono text-sm">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Characters */}
          {charList.length > 0 && (
            <div className="mt-4">
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2 block">Characters</label>
              <div className="flex flex-wrap gap-2">
                {charList.map(c => (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer bg-zinc-900/50 rounded-sm px-3 py-1.5 border border-zinc-800 hover:border-violet-500/30 transition-colors">
                    <Checkbox checked={form.character_ids.includes(c.id)} onCheckedChange={() => toggleChar(c.id)} className="rounded-sm" />
                    <span className="font-mono text-xs text-zinc-400">{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Frame Continuity */}
          {(form.prev_shot_last_frame || form.next_shot_first_frame) && (
            <div className="mt-4 p-3 bg-zinc-950/50 rounded-sm border border-indigo-500/10">
              <div className="flex items-center gap-2 mb-2">
                <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-400">Frame Continuity Active</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {form.prev_shot_last_frame && (
                  <div>
                    <span className="font-mono text-[9px] text-zinc-600 block mb-1">Prev shot last frame</span>
                    <img src={form.prev_shot_last_frame} alt="prev" className="h-16 w-full object-cover rounded-sm border border-zinc-800" onError={e => e.target.style.display='none'} />
                  </div>
                )}
                {form.next_shot_first_frame && (
                  <div>
                    <span className="font-mono text-[9px] text-zinc-600 block mb-1">Next shot first frame</span>
                    <img src={form.next_shot_first_frame} alt="next" className="h-16 w-full object-cover rounded-sm border border-zinc-800" onError={e => e.target.style.display='none'} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reference Images */}
          <div className="mt-4">
            <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Reference Images</label>
            <div className="flex gap-2 mb-2">
              <Input value={refInput} onChange={e => setRefInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRef())}
                placeholder="Paste image URL" className="bg-black/50 border-zinc-800 font-mono text-sm flex-1" />
              <Button onClick={addRef} variant="outline" size="sm" className="rounded-sm border-zinc-700 font-mono text-xs">Add</Button>
            </div>
            {form.reference_images.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {form.reference_images.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="h-12 w-16 object-cover rounded-sm border border-zinc-800" onError={e => e.target.style.display='none'} />
                    <button onClick={() => removeRef(i)} className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 text-white text-[10px] opacity-0 group-hover:opacity-100">x</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Textarea value={form.additional_context} onChange={e => setForm({ ...form, additional_context: e.target.value })}
            placeholder="Additional context (optional)" className="bg-black/50 border-zinc-800 font-mono text-sm mt-3" rows={2} />

          <Button onClick={handleCompile} disabled={loading || !form.scene_description.trim()}
            className="w-full mt-4 rounded-sm font-heading uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50" data-testid="compile-btn">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {loading ? 'Compiling...' : 'Compile Scene'}
          </Button>
        </div>

        {/* History */}
        {showHistory && history.length > 0 && (
          <div className="glass-card rounded-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-500" />
                <span className="font-heading font-bold text-sm uppercase text-white">History</span>
                <span className="font-mono text-[10px] text-zinc-600">{history.length} compilations</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)} className="text-zinc-600 text-xs">Hide</Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {history.slice(0, 10).map(h => (
                <button key={h.id} onClick={() => setResult(h.output)}
                  className="w-full text-left bg-zinc-950/50 rounded-sm p-2 border border-zinc-800/30 hover:border-indigo-500/20 transition-colors">
                  <span className="font-mono text-[9px] text-zinc-600">{new Date(h.timestamp).toLocaleString()}</span>
                  <p className="font-mono text-xs text-zinc-400 line-clamp-1 mt-0.5">{h.input?.scene_description?.slice(0, 80)}...</p>
                </button>
              ))}
            </div>
          </div>
        )}
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

            {result.audio_stack && (
              <div className="glass-card rounded-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-pink-400" />
                    <span className="font-heading font-bold text-sm uppercase text-white">Audio Stack</span>
                  </div>
                  <CopyBtn text={result.audio_stack} label="audio" />
                </div>
                <div className="space-y-2">
                  {Object.entries(result.audio_stack).map(([key, val]) => (
                    <div key={key} className="bg-zinc-950/50 rounded-sm p-2.5">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block mb-1">{key.replace(/_/g, ' ')}</span>
                      <p className="font-mono text-xs text-zinc-400">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.director_notes && (
              <div className="glass-card rounded-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <StickyNote className="w-4 h-4 text-amber-400" />
                  <span className="font-heading font-bold text-sm uppercase text-white">Director Notes</span>
                </div>
                <p className="font-mono text-xs text-zinc-400 leading-relaxed">{result.director_notes}</p>
              </div>
            )}

            {result.continuity_notes && (
              <div className="glass-card rounded-sm p-4 border-indigo-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
                  <span className="font-heading font-bold text-sm uppercase text-indigo-400">Continuity Notes</span>
                </div>
                <p className="font-mono text-xs text-zinc-400 leading-relaxed">{result.continuity_notes}</p>
              </div>
            )}

            {result.coherence_flags && result.coherence_flags.length > 0 && (
              <div className="glass-card rounded-sm p-4 border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="font-heading font-bold text-sm uppercase text-amber-400">Coherence Flags</span>
                </div>
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
