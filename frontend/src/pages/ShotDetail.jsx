import { useState, useEffect } from 'react';
import { shots as shotsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Sparkles, Camera, Move, Clock, Image, ArrowLeftRight, Trash2 } from 'lucide-react';

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

  useEffect(() => {
    if (shotId && open) loadShot();
  }, [shotId, open]);

  const loadShot = async () => {
    try {
      const s = await shotsApi.get(projectId, shotId);
      setShot(s);
      setForm({ ...s });
    } catch (e) { console.error(e); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await shotsApi.update(projectId, shotId, form);
      toast.success(`Shot #${form.shot_number} saved`);
      onUpdate();
      loadShot();
    } catch (e) { toast.error('Failed to save shot'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete shot #${shot?.shot_number}? This cannot be undone.`)) return;
    try {
      await shotsApi.delete(projectId, shotId);
      toast.success('Shot deleted');
      onClose();
      onUpdate();
    } catch (e) { toast.error('Failed to delete'); }
  };

  const addRefImage = () => {
    if (!refImageInput.trim()) return;
    setForm(prev => ({ ...prev, reference_images: [...(prev.reference_images || []), refImageInput.trim()] }));
    setRefImageInput('');
  };

  const removeRefImage = (idx) => {
    setForm(prev => ({ ...prev, reference_images: prev.reference_images.filter((_, i) => i !== idx) }));
  };

  if (!shot) return null;

  const Field = ({ label, field, type = 'text', textarea = false, rows = 2 }) => (
    <div>
      <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">{label}</label>
      {textarea ? (
        <Textarea value={form[field] || ''} onChange={e => setForm({ ...form, [field]: e.target.value })}
          className="bg-black/50 border-zinc-800 font-mono text-sm" rows={rows} data-testid={`shot-field-${field}`} />
      ) : (
        <Input type={type} value={form[field] || ''} onChange={e => setForm({ ...form, [field]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })}
          className="bg-black/50 border-zinc-800 font-mono text-sm" data-testid={`shot-field-${field}`} />
      )}
    </div>
  );

  const SelectField = ({ label, field, options }) => (
    <div>
      <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">{label}</label>
      <Select value={form[field] || ''} onValueChange={v => setForm({ ...form, [field]: v })}>
        <SelectTrigger className="bg-black/50 border-zinc-800 font-mono text-sm h-9 rounded-sm" data-testid={`shot-select-${field}`}><SelectValue /></SelectTrigger>
        <SelectContent className="bg-zinc-900 border-zinc-800">
          {options.map(o => <SelectItem key={o} value={o} className="font-mono text-sm">{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-[#0a0a0a] border-zinc-800 w-[520px] sm:max-w-[520px] overflow-y-auto" side="right">
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-heading text-xl uppercase text-white flex items-center gap-2">
              Shot #{shot.shot_number}
              <Badge className={`rounded-sm font-mono text-[9px] ${STAGE_COLORS[form.production_status] || ''}`}>{form.production_status}</Badge>
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="space-y-4 pb-20">
          {/* Core */}
          <section>
            <h4 className="font-heading text-xs uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1"><Camera className="w-3 h-3" /> Shot Setup</h4>
            <div className="space-y-3">
              <Field label="Description" field="description" textarea rows={3} />
              <div className="grid grid-cols-3 gap-2">
                <Field label="Duration (sec)" field="duration_target_sec" type="number" />
                <SelectField label="Framing" field="framing" options={FRAMINGS} />
                <SelectField label="Camera" field="camera_movement" options={MOVEMENTS} />
              </div>
              <SelectField label="Status" field="production_status" options={STAGES} />
              <Field label="Camera Notes" field="camera_notes" textarea rows={2} />
            </div>
          </section>

          {/* Prompt Stack */}
          <section>
            <h4 className="font-heading text-xs uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Prompt Stack (Intent / Constraint / Emission)</h4>
            <div className="space-y-3">
              <Field label="Intent — WHY this moment exists" field="intent" textarea rows={2} />
              <Field label="Constraint — Boundaries applied" field="constraint" textarea rows={2} />
              <Field label="Emission — The actual prompt signal" field="emission" textarea rows={3} />
            </div>
          </section>

          {/* Audio Stack */}
          <section>
            <h4 className="font-heading text-xs uppercase tracking-widest text-zinc-500 mb-2">Audio Stack</h4>
            <div className="space-y-3">
              <Field label="Sound Design" field="sound_design" textarea rows={2} />
              <Field label="Volume Layers (BG | MID | FG)" field="volume_layers" textarea rows={2} />
              <Field label="Spatial" field="spatial" textarea rows={2} />
              <Field label="Narrative" field="narrative" textarea rows={2} />
              <Field label="Exclude" field="exclude" textarea rows={2} />
            </div>
          </section>

          {/* Frame Continuity */}
          <section>
            <h4 className="font-heading text-xs uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1"><ArrowLeftRight className="w-3 h-3" /> Frame Continuity</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <SelectField label="Transition In" field="transition_in" options={TRANSITIONS} />
                <SelectField label="Transition Out" field="transition_out" options={TRANSITIONS} />
              </div>
              <Field label="First Frame URL" field="first_frame_url" />
              <Field label="Last Frame URL" field="last_frame_url" />
              {(form.first_frame_url || form.last_frame_url) && (
                <div className="grid grid-cols-2 gap-2">
                  {form.first_frame_url && <img src={form.first_frame_url} alt="First frame" className="w-full h-24 object-cover rounded-sm border border-zinc-800" />}
                  {form.last_frame_url && <img src={form.last_frame_url} alt="Last frame" className="w-full h-24 object-cover rounded-sm border border-zinc-800" />}
                </div>
              )}
            </div>
          </section>

          {/* Reference Images */}
          <section>
            <h4 className="font-heading text-xs uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1"><Image className="w-3 h-3" /> Reference Images</h4>
            <div className="flex gap-2 mb-2">
              <Input value={refImageInput} onChange={e => setRefImageInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRefImage())}
                placeholder="Paste image URL" className="bg-black/50 border-zinc-800 font-mono text-sm flex-1" data-testid="ref-image-input" />
              <Button onClick={addRefImage} variant="outline" size="sm" className="rounded-sm border-zinc-700 font-mono text-xs">Add</Button>
            </div>
            {(form.reference_images || []).length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {form.reference_images.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt={`Ref ${i+1}`} className="w-full h-20 object-cover rounded-sm border border-zinc-800" onError={e => e.target.style.display = 'none'} />
                    <button onClick={() => removeRefImage(i)}
                      className="absolute top-1 right-1 bg-black/80 rounded-sm p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Asset URLs */}
          <section>
            <h4 className="font-heading text-xs uppercase tracking-widest text-zinc-500 mb-2">Generated Assets</h4>
            <div className="space-y-3">
              <Field label="Reference Frame URL" field="reference_frame_url" />
              <Field label="Generated Asset URL" field="generated_asset_url" />
            </div>
          </section>

          <Field label="Notes" field="notes" textarea rows={3} />
        </div>

        {/* Fixed Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#0a0a0a] border-t border-zinc-800 flex gap-2">
          {onCompile && (
            <Button onClick={() => { onClose(); onCompile(shot); }} variant="outline" className="rounded-sm font-heading uppercase text-xs border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 flex-1" data-testid="compile-from-shot-btn">
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
      </SheetContent>
    </Sheet>
  );
}
