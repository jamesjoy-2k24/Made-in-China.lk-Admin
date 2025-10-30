import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Plus, Trash2, Hash, Type, Droplet } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { AttributeDefinition } from './attributes.api';

/** === Schema just for editing the definition (no category assignment here) === */
const schema = z.object({
  key: z.string().min(1).regex(/^[a-z0-9_]+(?:-[a-z0-9_]+)*$/),
  label: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['active', 'archived']),
  // keep the stored type as-is; we don’t allow changing storage kind in edit (safer)
  valueType: z.enum([
    'string','number','boolean','enum','multi_enum','object','array_number','array_string'
  ]),
  // scalar constraints
  min: z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().optional()),
  max: z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().optional()),
  regex: z.string().optional(),
  // collection (enum/multi_enum)
  options: z.array(z.object({
    value: z.string().min(1),
    code: z.string().optional(),   // allow color hex if you support it
    label: z.string().optional(),  // keep forward compatibility with your API type
  })).optional(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  attribute: AttributeDefinition | null;
  /** called with a patch that matches your update API: updateAttribute({ id, patch }) */
  onSave: (patch: Partial<AttributeDefinition>) => Promise<void>;
};

/** ---- color utils (same behavior as your create modal) ---- */
const COMMON_CSS_COLORS: { name: string; hex: string }[] = [
  { name: 'Black', hex: '#000000' }, { name: 'White', hex: '#FFFFFF' }, { name: 'Gray', hex: '#808080' },
  { name: 'Red', hex: '#FF0000' }, { name: 'Orange', hex: '#FFA500' }, { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Green', hex: '#008000' }, { name: 'Blue', hex: '#0000FF' }, { name: 'Purple', hex: '#800080' },
];

const looksLikeHex = (s?: string) => !!s && /^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(s);
const normalizeHex = (input: string): string | null => {
  if (!input) return null;
  let v = input.trim();
  const short = v.match(/^#([0-9a-f]{3})$/i);
  if (short) return '#' + short[1].split('').map((c) => c + c).join('').toUpperCase();
  const long = v.match(/^#([0-9a-f]{6})$/i);
  if (long) return '#' + long[1].toUpperCase();
  if (/^[0-9a-f]{6}$/i.test(v)) return '#' + v.toUpperCase();
  if (/^[0-9a-f]{3}$/i.test(v)) return '#' + v.split('').map((c) => c + c).join('').toUpperCase();
  return null;
};
const withHash = (s: string) => (s.startsWith('#') ? s : `#${s}`);

export default function EditAttributeModal({ isOpen, onClose, attribute, onSave }: Props) {
  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      key: '',
      label: '',
      description: '',
      status: 'active',
      valueType: 'string',
      min: undefined,
      max: undefined,
      regex: '',
      options: [],
    },
  });

  /** local editors for enum/multi_enum */
  const [listMode, setListMode] = React.useState<'text' | 'number' | 'color'>('text');
  const [textValues, setTextValues] = React.useState<string[]>([]);
  const [numValues, setNumValues] = React.useState<(number | '')[]>([]);
  const [colors, setColors] = React.useState<{ name: string; code: string }[]>([]);

  /** hydrate when attribute changes */
  React.useEffect(() => {
    if (!attribute) return;

    // base fields
    reset({
      key: attribute.key,
      label: attribute.label,
      description: attribute.description ?? '',
      status: attribute.status,
      valueType: attribute.valueType,
      min: attribute.min ?? undefined,
      max: attribute.max ?? undefined,
      regex: attribute.regex ?? '',
      options: attribute.options ?? [],
    });

    // detect and seed list editors
    if (attribute.valueType === 'enum' || attribute.valueType === 'multi_enum') {
      const opts = attribute.options ?? [];

      const asColor = opts.some(o => (o as any).code || looksLikeHex(o.value) || looksLikeHex((o as any).label));
      const allNumeric = opts.length > 0 && opts.every(o => o.value !== '' && !isNaN(Number(o.value)));

      if (asColor) {
        setListMode('color');
        setColors(
          opts.map((o) => {
            const code = (o as any).code || (looksLikeHex(o.value) ? withHash(o.value) : '');
            const name = (o as any).label || (!looksLikeHex(o.value) ? o.value : '');
            return { name, code: normalizeHex(code || '') || '' };
          })
        );
        setTextValues([]);
        setNumValues([]);
      } else if (allNumeric) {
        setListMode('number');
        setNumValues(opts.map(o => (o.value === '' ? '' : Number(o.value))));
        setTextValues([]);
        setColors([]);
      } else {
        setListMode('text');
        setTextValues(opts.map(o => o.value));
        setNumValues([]);
        setColors([]);
      }
    } else {
      // clear lists for scalar types
      setTextValues([]);
      setNumValues([]);
      setColors([]);
    }
  }, [attribute, reset]);

  /** builders */
  const addText = () => setTextValues(a => [...a, '']);
  const updText = (i: number, v: string) => setTextValues(a => a.map((x, idx) => (idx === i ? v : x)));
  const remText = (i: number) => setTextValues(a => a.filter((_, idx) => idx !== i));

  const addNum = () => setNumValues(a => [...a, '']);
  const updNum = (i: number, v: string) => setNumValues(a => a.map((x, idx) => (idx === i ? (v === '' ? '' : Number(v)) : x)));
  const remNum = (i: number) => setNumValues(a => a.filter((_, idx) => idx !== i));

  const addColor = () => setColors(a => [...a, { name: '', code: '' }]);
  const updColor = (i: number, patch: Partial<{ name: string; code: string }>) =>
    setColors(a => a.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const remColor = (i: number) => setColors(a => a.filter((_, idx) => idx !== i));

  const handleColorName = (i: number, name: string) => {
    // best-effort: if name is hex-like, treat as code
    if (looksLikeHex(name)) {
      const norm = normalizeHex(withHash(name)) || '';
      updColor(i, { name: '', code: norm });
    } else {
      updColor(i, { name });
    }
  };
  const handleColorCode = (i: number, code: string) => {
    const norm = normalizeHex(code) || code;
    updColor(i, { code: norm });
  };

  /** assemble patch & save */
  const onSubmit = handleSubmit(async (form) => {
    if (!attribute) return;

    let patch: Partial<AttributeDefinition> = {
      key: form.key,
      label: form.label,
      description: form.description ?? '',
      status: form.status,
      // keep storage type as-is; we don't migrate types here
      valueType: attribute.valueType,
      min: attribute.valueType === 'number' ? (form.min ?? undefined) : undefined,
      max: attribute.valueType === 'number' ? (form.max ?? undefined) : undefined,
      regex: attribute.valueType === 'string' ? (form.regex?.trim() || undefined) : undefined,
    };

    if (attribute.valueType === 'enum' || attribute.valueType === 'multi_enum') {
      if (listMode === 'text') {
        patch.options = textValues
          .map(v => (v || '').trim())
          .filter(Boolean)
          .map(v => ({ value: v }));
      } else if (listMode === 'number') {
        patch.options = numValues
          .map(n => (n === '' ? '' : String(Number(n))))
          .map(v => v.trim())
          .filter(Boolean)
          .map(v => ({ value: v }));
      } else {
        // colors
        patch.options = colors
          .map(c => ({ value: (c.name || '').trim(), code: normalizeHex(c.code || '') || '' }))
          .filter(o => o.value && o.code);
      }
    }

    await onSave(patch);
    onClose();
  });

  if (!attribute) return null;

  const storedBadge =
    attribute.valueType === 'enum' || attribute.valueType === 'multi_enum'
      ? 'enumerated'
      : attribute.valueType;

  return (
    <Transition appear show={isOpen}>
      <Dialog onClose={onClose} className="relative z-[9999]">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6">
          <Dialog.Panel className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-modal max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <Dialog.Title className="text-lg font-semibold text-neutral-900">Edit Attribute</Dialog.Title>
              <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="mt-5 space-y-6">
              {/* Key / Label */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Key</label>
                  <input
                    {...register('key')}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Label</label>
                  <input
                    {...register('label')}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                  />
                </div>
              </div>

              {/* Stored as badge */}
              <div className="text-xs text-neutral-600">
                Stored as:&nbsp;
                <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 font-medium">
                  {storedBadge}
                </span>
              </div>

              {/* Editors based on stored type */}
              {attribute.valueType === 'string' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Regex (optional)</label>
                  <input
                    {...register('regex')}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                    placeholder="e.g. ^[A-Z0-9-]+$"
                  />
                </div>
              )}

              {attribute.valueType === 'number' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Min</label>
                    <input type="number" step="any" {...register('min')}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Max</label>
                    <input type="number" step="any" {...register('max')}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400" />
                  </div>
                </div>
              )}

              {(attribute.valueType === 'enum' || attribute.valueType === 'multi_enum') && (
                <div className="space-y-3">
                  {/* Simple segmented switcher for list mode */}
                  <div className="inline-flex rounded-lg border border-neutral-200 overflow-hidden">
                    <button type="button"
                      className={`px-3 py-1.5 text-sm flex items-center gap-1 ${listMode === 'text' ? 'bg-primary-50 text-primary-700' : 'bg-white text-neutral-700'}`}
                      onClick={() => setListMode('text')}>
                      <Type className="h-4 w-4" /> Text
                    </button>
                    <button type="button"
                      className={`px-3 py-1.5 text-sm flex items-center gap-1 border-l border-neutral-200 ${listMode === 'number' ? 'bg-primary-50 text-primary-700' : 'bg-white text-neutral-700'}`}
                      onClick={() => setListMode('number')}>
                      <Hash className="h-4 w-4" /> Number
                    </button>
                    <button type="button"
                      className={`px-3 py-1.5 text-sm flex items-center gap-1 border-l border-neutral-200 ${listMode === 'color' ? 'bg-primary-50 text-primary-700' : 'bg-white text-neutral-700'}`}
                      onClick={() => setListMode('color')}>
                      <Droplet className="h-4 w-4" /> Colors
                    </button>
                  </div>

                  {listMode === 'text' && (
                    <div className="space-y-2.5">
                      {textValues.map((v, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            value={v}
                            onChange={(e) => updText(i, e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                            placeholder={`Value ${i + 1}`}
                          />
                          <button type="button" onClick={() => remText(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={addText} className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg border border-neutral-300 hover:bg-neutral-100">
                        <Plus className="h-4 w-4 mr-2" /> Add value
                      </button>
                    </div>
                  )}

                  {listMode === 'number' && (
                    <div className="space-y-2.5">
                      {numValues.map((v, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="number"
                            value={v}
                            onChange={(e) => updNum(i, e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                            placeholder={`Value ${i + 1}`}
                          />
                          <button type="button" onClick={() => remNum(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={addNum} className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg border border-neutral-300 hover:bg-neutral-100">
                        <Plus className="h-4 w-4 mr-2" /> Add number
                      </button>
                    </div>
                  )}

                  {listMode === 'color' && (
                    <div className="space-y-2.5">
                      {colors.map((c, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-center">
                          <input
                            value={c.name}
                            onChange={(e) => handleColorName(i, e.target.value)}
                            className="col-span-5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                            placeholder="Color name (e.g., Red)"
                          />
                          <input
                            value={c.code}
                            onChange={(e) => handleColorCode(i, e.target.value)}
                            className="col-span-4 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                            placeholder="#FF0000"
                          />
                          <input
                            type="color"
                            value={normalizeHex(c.code) || '#ffffff'}
                            onChange={(e) => handleColorCode(i, e.target.value)}
                            className="col-span-1 h-9 w-full rounded-lg cursor-pointer border border-neutral-300 p-0"
                            title={c.code}
                          />
                          <div className="col-span-2 flex items-center justify-end gap-2">
                            <div className="h-9 w-9 rounded-lg border border-neutral-200" style={{ background: normalizeHex(c.code) || 'transparent' }} />
                            <button type="button" onClick={() => remColor(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={addColor} className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg border border-neutral-300 hover:bg-neutral-100">
                        <Plus className="h-4 w-4 mr-2" /> Add color
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Description + Status */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                  placeholder="(Optional) short description…"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Status</label>
                <select
                  {...register('status')}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-neutral-300 hover:bg-neutral-100">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-60">
                  Save Changes
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
}
