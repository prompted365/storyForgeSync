import { useState, useEffect, useCallback } from 'react';
import { shots as shotsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Sparkles, Camera, Move, Clock, ArrowLeftRight, Trash2 } from 'lucide-react';

const STAGES = ["concept", "world_built", "blocked", "generated", "audio_layered", "mixed", "final"];
const FRAMINGS = ["extreme_wide", "wide", "medium_wide", "medium", "medium_close", "close", "extreme_close"];
const MOVEMENTS = ["static", "pan_left", "pan_right", "tilt_up", "tilt_down", "dolly_in", "dolly_out", "crane_up", "crane_down", "orbit", "handheld", "tracking"];
const TRANSITIONS = ["cut", "dissolve", "match_cut", "smash_cut", "fade_to_black", "fade_from_black", "wipe", "continuous"];
const STAGE_COLORS = {
  concept: 'bg-indigo-500/20 text-indigo-400', world_built: 'bg-violet-500/20 text-violet-400',
  blocked: 'bg-amber-500/20 text-amber-400', generated: 'bg-cyan-500/20 text-cyan-400',
  audio_layered: 'bg-pink-500/20 text-pink-400', mixed: 'bg-orange-500/20 text-orange-400',
  final: 'bg-emerald-500/20 text-emerald-400',
};

export default function ShotDetail({ projectId, shotId, open, onClose, onUpdate, onCompile }) {
  const [shot, setShot] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [refImageInput, setRefImageInput] = useState('');

  const loadShot = useCallback(async () => {
    if (!shotId) return;
    try {
      const s = await shotsApi.get(projectId, shotId);
      setShot(s);
      setForm({ ...s });
    } catch (e) { console.error(e); }
  }, [projectId, shotId]);

  useEffect(() => {
    if (shotId && open) { loadShot(); }
  }, [shotId, open, loadShot]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await shotsApi.update(projectId, shotId, form);
      toast.success('Shot #' + form.shot_number + ' saved');
      if (onUpdate) onUpdate();
      loadShot();
    } catch (e) { toast.error('Failed to save shot'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete shot #' + (shot ? shot.shot_number : '') + '? This cannot be undone.')) return;
    try {
      await shotsApi.delete(projectId, shotId);
      toast.success('Shot deleted');
      onClose();
      if (onUpdate) onUpdate();
    } catch (e) { toast.error('Failed to delete'); }
  };

  const addRefImage = () => {
    if (!refImageInput.trim()) return;
    var imgs = form.reference_images || [];
    setForm({ ...form, reference_images: imgs.concat([refImageInput.trim()]) });
    setRefImageInput('');
  };

  const removeRefImage = (idx) => {
    var imgs = (form.reference_images || []).filter(function(_, i) { return i !== idx; });
    setForm({ ...form, reference_images: imgs });
  };

  if (!shot) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0a] border-zinc-800 max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <div className="flex items-center gap-3">
            <DialogTitle className="font-heading text-xl uppercase text-white">Shot #{shot.shot_number}</DialogTitle>
            <Badge className={'rounded-sm font-mono text-[9px] ' + (STAGE_COLORS[form.production_status] || '')}>{form.production_status}</Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="px-6 pb-6 max-h-[70vh]">
          <div className="space-y-5 pr-4">
            {/* Shot Setup */}
            <div>
              <h4 className="font-heading text-xs uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1"><Camera className="w-3 h-3" /> Shot Setup</h4>
              <div className="space-y-3">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Description</label>
                  <Textarea value={form.description || ''} onChange={function(e) { setForm({ ...form, description: e.target.value }); }}
                    className="bg-black/50 border-zinc-800 font-mono text-sm" rows={3} data-testid="shot-field-description" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-mono text-[10px] uppercase text-zinc-500 mb-1 block">Duration</label>
                    <Input type="number" value={form.duration_target_sec || 0} onChange={function(e) { setForm({ ...form, duration_target_sec: parseFloat(e.target.value) || 0 }); }}
                      className="bg-black/50 border-zinc-800 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-zinc-500 mb-1 block">Framing</label>
                    <Select value={form.framing || 'medium'} onValueChange={function(v) { setForm({ ...form, framing: v }); }}>
                      <SelectTrigger className="bg-black/50 border-zinc-800 font-mono text-sm h-9 rounded-sm"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">{FRAMINGS.map(function(f) { return <SelectItem key={f} value={f} className="font-mono text-sm">{f}</SelectItem>; })}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-zinc-500 mb-1 block">Camera</label>
                    <Select value={form.camera_movement || 'static'} onValueChange={function(v) { setForm({ ...form, camera_movement: v }); }}>
                      <SelectTrigger className="bg-black/50 border-zinc-800 font-mono text-sm h-9 rounded-sm"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">{MOVEMENTS.map(function(m) { return <SelectItem key={m} value={m} className="font-mono text-sm">{m}</SelectItem>; })}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-zinc-500 mb-1 block">Status</label>
                  <Select value={form.production_status || 'concept'} onValueChange={function(v) { setForm({ ...form, production_status: v }); }}>
                    <SelectTrigger className="bg-black/50 border-zinc-800 font-mono text-sm h-9 rounded-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">{STAGES.map(function(s) { return <SelectItem key={s} value={s} className="font-mono text-sm">{s}</SelectItem>; })}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Prompt Stack */}
            <div>
              <h4 className="font-heading text-xs uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Prompt Stack</h4>
              <div className="space-y-3">
                <div>
                  <label className="font-mono text-[10px] uppercase text-zinc-500 mb-1 block">Intent</label>
                  <Textarea value={form.intent || ''} onChange={function(e) { setForm({ ...form, intent: e.target.value }); }} className="bg-black/50 border-zinc-800 font-mono text-sm" rows={2} />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-zinc-500 mb-1 block">Constraint</label>
                  <Textarea value={form.constraint || ''} onChange={function(e) { setForm({ ...form, constraint: e.target.value }); }} className="bg-black/50 border-zinc-800 font-mono text-sm" rows={2} />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-zinc-500 mb-1 block">Emission</label>
                  <Textarea value={form.emission || ''} onChange={function(e) { setForm({ ...form, emission: e.target.value }); }} className="bg-black/50 border-zinc-800 font-mono text-sm" rows={3} />
                </div>
              </div>
            </div>

            {/* Audio Stack */}
            <div>
              <h4 className="font-heading text-xs uppercase tracking-widest text-zinc-500 mb-2">Audio Stack</h4>
              <div className="space-y-3">
                {['sound_design', 'volume_layers', 'spatial', 'narrative', 'exclude'].map(function(field) {
                  return (
                    <div key={field}>
                      <label className="font-mono text-[10px] uppercase text-zinc-500 mb-1 block">{field.replace('_', ' ')}</label>
                      <Textarea value={form[field] || ''} onChange={function(e) { var u = {}; u[field] = e.target.value; setForm(Object.assign({}, form, u)); }} className="bg-black/50 border-zinc-800 font-mono text-sm" rows={2} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Frame Continuity */}
            <div>
              <h4 className="font-heading text-xs uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1"><ArrowLeftRight className="w-3 h-3" /> Frame Continuity</h4>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="font-mono text-[10px] uppercase text-zinc-500 mb-1 block">Transition In</label>
                  <Select value={form.transition_in || 'cut'} onValueChange={function(v) { setForm({ ...form, transition_in: v }); }}>
                    <SelectTrigger className="bg-black/50 border-zinc-800 font-mono text-sm h-9 rounded-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">{TRANSITIONS.map(function(t) { return <SelectItem key={t} value={t} className="font-mono text-sm">{t}</SelectItem>; })}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-zinc-500 mb-1 block">Transition Out</label>
                  <Select value={form.transition_out || 'cut'} onValueChange={function(v) { setForm({ ...form, transition_out: v }); }}>
                    <SelectTrigger className="bg-black/50 border-zinc-800 font-mono text-sm h-9 rounded-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">{TRANSITIONS.map(function(t) { return <SelectItem key={t} value={t} className="font-mono text-sm">{t}</SelectItem>; })}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase text-zinc-500 mb-1 block">First Frame URL</label>
                <Input value={form.first_frame_url || ''} onChange={function(e) { setForm({ ...form, first_frame_url: e.target.value }); }} className="bg-black/50 border-zinc-800 font-mono text-sm" />
              </div>
              <div className="mt-2">
                <label className="font-mono text-[10px] uppercase text-zinc-500 mb-1 block">Last Frame URL</label>
                <Input value={form.last_frame_url || ''} onChange={function(e) { setForm({ ...form, last_frame_url: e.target.value }); }} className="bg-black/50 border-zinc-800 font-mono text-sm" />
              </div>
            </div>

            {/* Reference Images */}
            <div>
              <h4 className="font-heading text-xs uppercase tracking-widest text-zinc-500 mb-2">Reference Images</h4>
              <div className="flex gap-2 mb-2">
                <Input value={refImageInput} onChange={function(e) { setRefImageInput(e.target.value); }}
                  onKeyDown={function(e) { if (e.key === 'Enter') { e.preventDefault(); addRefImage(); } }}
                  placeholder="Paste image URL" className="bg-black/50 border-zinc-800 font-mono text-sm flex-1" />
                <Button onClick={addRefImage} variant="outline" size="sm" className="rounded-sm border-zinc-700 font-mono text-xs">Add</Button>
              </div>
              {(form.reference_images || []).length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {(form.reference_images || []).map(function(url, i) {
                    return (
                      <div key={i} className="relative group">
                        <img src={url} alt={'Ref ' + (i+1)} className="w-full h-16 object-cover rounded-sm border border-zinc-800" />
                        <button onClick={function() { removeRefImage(i); }}
                          className="absolute top-1 right-1 bg-black/80 rounded-sm p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="font-mono text-[10px] uppercase text-zinc-500 mb-1 block">Notes</label>
              <Textarea value={form.notes || ''} onChange={function(e) { setForm({ ...form, notes: e.target.value }); }} className="bg-black/50 border-zinc-800 font-mono text-sm" rows={2} />
            </div>
          </div>
        </ScrollArea>

        {/* Bottom Actions */}
        <div className="px-6 py-4 border-t border-zinc-800 flex gap-2">
          {onCompile && (
            <Button onClick={function() { onClose(); onCompile(shot); }} variant="outline" className="rounded-sm font-heading uppercase text-xs border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 flex-1" data-testid="compile-from-shot-btn">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Compile
            </Button>
          )}
          <Button onClick={handleDelete} variant="outline" className="rounded-sm border-red-500/30 text-red-400 hover:bg-red-500/10" data-testid="delete-shot-btn">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-sm font-heading uppercase text-xs bg-indigo-600 hover:bg-indigo-500 flex-1" data-testid="save-shot-btn">
            <Save className="w-3.5 h-3.5 mr-1" /> {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
