import React from 'react';
import { Dialog, Combobox, Transition } from '@headlessui/react';
import {
  X,
  Plus,
  Trash2,
  Check,
  ChevronsUpDown,
  List,
  Hash,
  Type,
  Droplet,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

/* ===================== Types ===================== */

export interface CategoryOption {
  id: string;
  name: string;
  parentId?: string | null;
}

type ValueKind =
  | 'single_string'
  | 'single_number'
  | 'multi_string'
  | 'multi_number'
  | 'multi_color';

const valueTypeEnum = z.enum([
  'string',
  'number',
  'boolean',
  'enum',
  'multi_enum',
  'object',
  'array_number',
  'array_string',
]);

const schema = z
  .object({
    // assignment
    mainCategoryIds: z
      .array(z.string().min(1))
      .min(1, 'Select at least one main category'),
    applyAllSubs: z.boolean().default(true),
    subCategoryIds: z.array(z.string().min(1)).optional(),

    // definition
    key: z
      .string()
      .min(1, 'Key is required')
      .regex(/^[a-z0-9_]+(?:-[a-z0-9_]+)*$/, 'Use lowercase, digits, _ or -'),
    label: z.string().min(1, 'Label is required'),
    description: z.string().optional(),
    valueType: valueTypeEnum,
    min: z.preprocess(
      (v) => (v === '' || v == null ? undefined : Number(v)),
      z.number().optional()
    ),
    max: z.preprocess(
      (v) => (v === '' || v == null ? undefined : Number(v)),
      z.number().optional()
    ),
    regex: z.string().optional(),
    options: z
      .array(
        z.object({
          value: z.string().min(1), // for colors: hex code; for lists: value
          label: z.string().optional(), // display label (e.g., color name)
        })
      )
      .optional(),
    status: z.enum(['active', 'archived']).default('active'),
  })
  .refine(
    (d) =>
      !(d.valueType === 'enum' || d.valueType === 'multi_enum') ||
      (d.options?.some((o) => (o.value || '').trim()) ?? false),
    { path: ['options'], message: 'Add at least one option' }
  );

export type AttributeFormData = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPayload: (payload: any) => Promise<void | unknown>;
  categories: CategoryOption[];
  mode?: 'create';
  initial?: Partial<AttributeFormData>;
};

/* ===================== Color helpers ===================== */

const CANVAS =
  typeof document !== 'undefined' ? document.createElement('canvas') : null;
const CTX = CANVAS ? CANVAS.getContext('2d') : null;

const COMMON_CSS_COLORS: { name: string; hex: string }[] = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Green', hex: '#008000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Cyan', hex: '#00FFFF' },
  { name: 'Magenta', hex: '#FF00FF' },
  { name: 'Brown', hex: '#8B4513' },
];

function normalizeHex(input: string): string | null {
  if (!input) return null;
  let v = input.trim();

  // rgb(...) → hex
  const rgbMatch = v.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    const [r, g, b] = rgbMatch
      .slice(1, 4)
      .map((n) => Math.max(0, Math.min(255, Number(n))));
    return (
      '#' +
      [r, g, b]
        .map((n) => n.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()
    );
  }

  // hex normalization
  if (/^#([0-9a-f]{3})$/i.test(v)) {
    const [, s] = v.match(/^#([0-9a-f]{3})$/i)!;
    return (
      '#' +
      s
        .split('')
        .map((c) => c + c)
        .join('')
        .toUpperCase()
    );
  }
  if (/^#([0-9a-f]{6})$/i.test(v)) return v.toUpperCase();
  if (/^[0-9a-f]{3}$/i.test(v))
    return (
      '#' +
      v
        .split('')
        .map((c) => c + c)
        .join('')
        .toUpperCase()
    );
  if (/^[0-9a-f]{6}$/i.test(v)) return '#' + v.toUpperCase();

  return null;
}

function nameToHex(name: string): string | null {
  if (!name || !CTX) return null;
  const before = CTX.fillStyle;
  try {
    CTX.fillStyle = '#000000';
    const prev = CTX.fillStyle;
    CTX.fillStyle = name;
    const parsed = CTX.fillStyle;
    if (parsed === prev) return null;
    return normalizeHex(parsed);
  } catch {
    return null;
  } finally {
    if (CTX) CTX.fillStyle = before!;
  }
}

function hexToRgb(hex: string): [number, number, number] | null {
  const n = normalizeHex(hex);
  if (!n) return null;
  const m = n.match(/^#([0-9A-F]{6})$/i);
  if (!m) return null;
  const int = parseInt(m[1], 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function rgbDist(a: [number, number, number], b: [number, number, number]) {
  const dr = a[0] - b[0],
    dg = a[1] - b[1],
    db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

function findClosestNameForHex(hex: string): string | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  let bestName: string | null = null;
  let best = Infinity;
  for (const c of COMMON_CSS_COLORS) {
    const r2 = hexToRgb(c.hex)!;
    const d = rgbDist(rgb, r2);
    if (d === 0) return c.name;
    if (d < best) {
      best = d;
      bestName = c.name;
    }
  }
  return bestName;
}

/* ===================== Select (pretty) ===================== */

type SelectOption = { id: string; label: string };

function MultiSelect({
  options,
  valueIds,
  onChange,
  placeholder,
  disabled,
  includeSelectAll = true,
  selectAllLabel = 'Select all',
}: {
  options: SelectOption[];
  valueIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  includeSelectAll?: boolean;
  selectAllLabel?: string;
}) {
  const [query, setQuery] = React.useState('');
  const ALL_ID = '__ALL__';
  const isAllSelected =
    options.length > 0 && valueIds.length === options.length;
  const isIndeterminate =
    valueIds.length > 0 && valueIds.length < options.length;

  const valueObjs = React.useMemo(
    () => options.filter((o) => valueIds.includes(o.id)),
    [options, valueIds]
  );
  const filtered =
    query.trim().length === 0
      ? options
      : options.filter((o) =>
          o.label.toLowerCase().includes(query.toLowerCase())
        );

  const handleChange = (newVals: SelectOption[]) => {
    const clickedAll = newVals.some((v) => v.id === ALL_ID);
    if (clickedAll)
      return onChange(isAllSelected ? [] : options.map((o) => o.id));
    onChange(newVals.map((v) => v.id));
  };

  const displayText =
    valueObjs.length === 0
      ? ''
      : valueObjs.length <= 3
      ? valueObjs.map((v) => v.label).join(', ')
      : `${valueObjs.length} selected`;

  return (
    <Combobox
      value={valueObjs}
      onChange={handleChange}
      multiple
      disabled={disabled}
    >
      <div className={`relative ${disabled ? 'opacity-60' : ''}`}>
        <div className='relative w-full cursor-default rounded-lg border border-neutral-300 bg-white pl-3 pr-10 py-2.5 text-left focus-within:ring-2 focus-within:ring-primary-400 focus-within:border-primary-400 text-sm shadow-soft transition-all'>
          <Combobox.Input
            className='w-full border-none p-0 focus:ring-0 text-neutral-700 placeholder:text-neutral-300 text-sm'
            displayValue={() => displayText}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder || 'Select…'}
          />
          <Combobox.Button className='absolute inset-y-0 right-0 flex items-center pr-3'>
            <ChevronsUpDown className='h-4 w-4 text-neutral-400' />
          </Combobox.Button>
        </div>
        <Transition
          leave='transition ease-in duration-150'
          leaveFrom='opacity-100 scale-100'
          leaveTo='opacity-0 scale-95'
          afterLeave={() => setQuery('')}
        >
          <Combobox.Options className='absolute z-30 mt-1.5 max-h-72 w-full overflow-auto rounded-lg bg-white py-1.5 text-sm shadow-modal ring-1 ring-neutral-200/50 focus:outline-none'>
            {includeSelectAll && options.length > 0 && (
              <Combobox.Option
                value={{ id: ALL_ID, label: selectAllLabel }}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 pl-9 pr-3 ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-700'
                  }`
                }
              >
                <div className='flex items-center gap-2'>
                  <input
                    readOnly
                    type='checkbox'
                    className='h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-400'
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                  />
                  <span className='block truncate font-medium'>
                    {selectAllLabel}
                  </span>
                </div>
              </Combobox.Option>
            )}
            {filtered.length === 0 ? (
              <div className='px-3 py-2 text-neutral-500'>No results</div>
            ) : (
              filtered.map((opt) => {
                const selected = valueIds.includes(opt.id);
                return (
                  <Combobox.Option
                    key={opt.id}
                    value={opt}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 pl-9 pr-3 ${
                        active
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-neutral-700'
                      }`
                    }
                  >
                    {({ active }) => (
                      <div className='flex items-center gap-2'>
                        <input
                          readOnly
                          type='checkbox'
                          className='h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-400'
                          checked={selected}
                        />
                        <span
                          className={`block truncate ${
                            selected ? 'font-medium' : 'font-normal'
                          }`}
                        >
                          {opt.label}
                        </span>
                        {selected && (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? 'text-primary-700' : 'text-primary-500'
                            }`}
                          >
                            <Check className='h-4 w-4' />
                          </span>
                        )}
                      </div>
                    )}
                  </Combobox.Option>
                );
              })
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  );
}

/* ===================== Inline builders ===================== */

function MultiStringBuilder({
  listStr,
  add,
  upd,
  rem,
}: {
  listStr: string[];
  add: () => void;
  upd: (i: number, v: string) => void;
  rem: (i: number) => void;
}) {
  return (
    <div>
      <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
        Allowed values (text)
      </label>
      <div className='space-y-2.5'>
        {listStr.map((v, i) => (
          <div
            key={i}
            className='flex items-center gap-2'
          >
            <input
              value={v}
              onChange={(e) => upd(i, e.target.value)}
              className='w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 shadow-soft transition-all'
              placeholder={`Value ${i + 1}`}
            />
            <button
              type='button'
              onClick={() => rem(i)}
              className='p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors'
              title='Remove'
            >
              <Trash2 className='h-4 w-4' />
            </button>
          </div>
        ))}
        <button
          type='button'
          onClick={add}
          className='inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-colors'
        >
          <Plus className='h-4 w-4 mr-2' /> Add value
        </button>
      </div>
    </div>
  );
}

function MultiNumberBuilder({
  listNum,
  add,
  upd,
  rem,
}: {
  listNum: (number | '')[];
  add: () => void;
  upd: (i: number, v: string) => void;
  rem: (i: number) => void;
}) {
  return (
    <div>
      <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
        Allowed values (numbers)
      </label>
      <div className='space-y-2.5'>
        {listNum.map((v, i) => (
          <div
            key={i}
            className='flex items-center gap-2'
          >
            <input
              type='number'
              value={v}
              onChange={(e) => upd(i, e.target.value)}
              className='w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 shadow-soft transition-all'
              placeholder={`Value ${i + 1}`}
            />
            <button
              type='button'
              onClick={() => rem(i)}
              className='p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors'
              title='Remove'
            >
              <Trash2 className='h-4 w-4' />
            </button>
          </div>
        ))}
        <button
          type='button'
          onClick={add}
          className='inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-colors'
        >
          <Plus className='h-4 w-4 mr-2' /> Add number
        </button>
      </div>
    </div>
  );
}

function MultiColorBuilder({
  colors,
  add,
  upd,
  rem,
}: {
  colors: { name: string; code: string }[];
  add: () => void;
  upd: (i: number, patch: Partial<{ name: string; code: string }>) => void;
  rem: (i: number) => void;
}) {
  const handleNameChange = (i: number, name: string) => {
    const hex = nameToHex(name);
    if (hex) {
      // set name + normalized hex
      upd(i, { name, code: normalizeHex(hex) || hex });
    } else {
      upd(i, { name });
    }
  };

  const handleCodeChange = (i: number, code: string) => {
    const norm = normalizeHex(code);
    if (!norm) {
      upd(i, { code });
      return;
    }
    const closest = findClosestNameForHex(norm);
    upd(i, { code: norm, name: closest || '' });
  };

  return (
    <div>
      <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
        Colors
      </label>
      <div className='space-y-2.5'>
        {colors.map((c, i) => (
          <div
            key={i}
            className='grid grid-cols-12 gap-2 items-center'
          >
            <input
              value={c.name}
              onChange={(e) => handleNameChange(i, e.target.value)}
              className='col-span-5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 shadow-soft transition-all'
              placeholder='Color name (e.g., Red)'
            />
            <input
              value={c.code}
              onChange={(e) => handleCodeChange(i, e.target.value)}
              className='col-span-4 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 shadow-soft transition-all'
              placeholder='#FF0000'
            />
            <input
              type='color'
              value={normalizeHex(c.code) || '#ffffff'}
              onChange={(e) => handleCodeChange(i, e.target.value)}
              className='col-span-1 h-9 w-full rounded-lg cursor-pointer border border-neutral-300 p-0 shadow-soft'
              title={c.code}
            />
            <div className='col-span-2 flex items-center justify-end gap-2'>
              <div
                className='h-9 w-9 rounded-lg border border-neutral-200'
                style={{ background: normalizeHex(c.code) || 'transparent' }}
                title={c.code}
              />
              <button
                type='button'
                onClick={() => rem(i)}
                className='p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors'
                title='Remove'
              >
                <Trash2 className='h-4 w-4' />
              </button>
            </div>
          </div>
        ))}
        <button
          type='button'
          onClick={add}
          className='inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-colors'
        >
          <Plus className='h-4 w-4 mr-2' /> Add color
        </button>
      </div>
    </div>
  );
}

/* ===================== Main Component ===================== */

export default function CreateAttributeModal({
  isOpen,
  onClose,
  onSubmitPayload,
  categories,
  mode = 'create',
  initial,
}: Props) {
  const topLevel = React.useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories]
  );
  const byParent = React.useMemo(() => {
    const map = new Map<string, CategoryOption[]>();
    categories.forEach((c) => {
      if (!c.parentId) return;
      if (!map.has(c.parentId)) map.set(c.parentId, []);
      map.get(c.parentId)!.push(c);
    });
    return map;
  }, [categories]);

  const blankDefaults: AttributeFormData = {
    mainCategoryIds: [],
    applyAllSubs: true,
    subCategoryIds: [],
    key: '',
    label: '',
    description: '',
    valueType: 'string',
    min: undefined,
    max: undefined,
    regex: '',
    options: [],
    status: 'active',
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AttributeFormData>({
    resolver: zodResolver(schema),
    defaultValues: { ...blankDefaults, ...initial },
  });

  // categories
  const selectedMains = watch('mainCategoryIds');
  const applyAllSubs = watch('applyAllSubs');
  const subChoices = React.useMemo(() => {
    const out: CategoryOption[] = [];
    for (const mainId of selectedMains)
      out.push(...(byParent.get(mainId) ?? []));
    const seen = new Set<string>();
    return out.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
  }, [selectedMains, byParent]);

  React.useEffect(() => {
    reset({
      ...blankDefaults,
      ...initial,
      applyAllSubs: initial?.subCategoryIds?.includes(null as any) ?? true,
      subCategoryIds:
        initial?.subCategoryIds?.filter((s): s is string => !!s) ?? [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  // simplified UX: value kind → valueType
  const [valueKind, setValueKind] = React.useState<ValueKind>('single_string');
  const [listStr, setListStr] = React.useState<string[]>([]);
  const [listNum, setListNum] = React.useState<(number | '')[]>([]);
  const [colors, setColors] = React.useState<{ name: string; code: string }[]>(
    []
  );

  React.useEffect(() => {
    const vt: AttributeFormData['valueType'] =
      valueKind === 'single_string'
        ? 'string'
        : valueKind === 'single_number'
        ? 'number'
        : 'multi_enum';
    setValue('valueType', vt as any, { shouldDirty: true });
  }, [valueKind, setValue]);

  // keep options in RHF for zod refine (map to API: {value,label})
  React.useEffect(() => {
    if (valueKind === 'multi_string') {
      const opts = listStr
        .map((s) => ({ value: (s || '').trim() }))
        .filter((o) => o.value);
      setValue('options', opts as any, { shouldDirty: true });
    } else if (valueKind === 'multi_number') {
      const opts = listNum
        .map((n) => (n === '' ? '' : String(Number(n))))
        .map((v) => ({ value: v.trim() }))
        .filter((o) => o.value);
      setValue('options', opts as any, { shouldDirty: true });
    } else if (valueKind === 'multi_color') {
      const opts = colors
        .map((c) => ({
          value: normalizeHex(c.code || '') || '',
          label: (c.name || '').trim(),
        }))
        .filter((o) => o.value);
      setValue('options', opts as any, { shouldDirty: true });
    } else {
      setValue('options', undefined as any, { shouldDirty: true });
    }
  }, [valueKind, listStr, listNum, colors, setValue]);

  // clean unrelated helpers when switching kind
  React.useEffect(() => {
    if (valueKind !== 'single_number') {
      setValue('min', undefined as any);
      setValue('max', undefined as any);
    }
    if (valueKind !== 'single_string') {
      setValue('regex', undefined as any);
    }
  }, [valueKind, setValue]);

  // value kind options UI
  const kindOptions: Array<{
    id: ValueKind;
    title: string;
    desc: string;
    icon: React.ComponentType<any>;
    storedAs: string;
    example?: string;
  }> = [
    {
      id: 'single_string',
      title: 'Single value (Text)',
      desc: 'One free text value',
      icon: Type,
      storedAs: 'string',
      example: 'e.g., “material: Cotton”',
    },
    {
      id: 'single_number',
      title: 'Single value (Number)',
      desc: 'One numeric value (set optional range)',
      icon: Hash,
      storedAs: 'number',
      example: 'e.g., “weight_kg: 1.2”',
    },
    {
      id: 'multi_string',
      title: 'Multiple values (Text list)',
      desc: 'Allowed text options',
      icon: List,
      storedAs: 'multi_enum',
      example: 'e.g., S, M, L',
    },
    {
      id: 'multi_number',
      title: 'Multiple values (Number list)',
      desc: 'Allowed numeric options',
      icon: Hash,
      storedAs: 'multi_enum',
      example: 'e.g., 32, 34',
    },
    {
      id: 'multi_color',
      title: 'Multiple colors',
      desc: 'Each has name + color code',
      icon: Droplet,
      storedAs: 'multi_enum',
      example: 'e.g., Red (#FF0000)',
    },
  ];

  const mainOptions: SelectOption[] = React.useMemo(
    () => topLevel.map((m) => ({ id: m.id, label: m.name })),
    [topLevel]
  );
  const subOptions: SelectOption[] = React.useMemo(
    () => subChoices.map((s) => ({ id: s.id, label: s.name })),
    [subChoices]
  );

  const onSubmit = async (data: AttributeFormData) => {
    const payload = {
      mainCategoryIds: data.mainCategoryIds,
      subCategoryIds: data.applyAllSubs ? [null] : data.subCategoryIds ?? [],

      key: data.key,
      label: data.label,
      description: data.description?.trim() || undefined,
      valueType: data.valueType,

      min: data.valueType === 'number' ? data.min ?? undefined : undefined,
      max: data.valueType === 'number' ? data.max ?? undefined : undefined,
      regex:
        data.valueType === 'string'
          ? data.regex?.trim() || undefined
          : undefined,

      options:
        data.valueType === 'multi_enum' || data.valueType === 'enum'
          ? (data.options as any)
          : undefined,

      status: data.status,
    };

    await onSubmitPayload(payload);

    // Clear form on success
    reset(blankDefaults);
    setValueKind('single_string');
    setListStr([]);
    setListNum([]);
    setColors([]);

    onClose();
  };

  // list handlers
  const addStr = () => setListStr((a) => [...a, '']);
  const updStr = (i: number, v: string) =>
    setListStr((a) => a.map((x, idx) => (idx === i ? v : x)));
  const remStr = (i: number) =>
    setListStr((a) => a.filter((_, idx) => idx !== i));

  const addNum = () => setListNum((a) => [...a, '']);
  const updNum = (i: number, v: string) =>
    setListNum((a) =>
      a.map((x, idx) => (idx === i ? (v === '' ? '' : Number(v)) : x))
    );
  const remNum = (i: number) =>
    setListNum((a) => a.filter((_, idx) => idx !== i));

  const addColor = () => setColors((a) => [...a, { name: '', code: '' }]);
  const updColor = (
    i: number,
    patch: Partial<{ name: string; code: string }>
  ) =>
    setColors((a) => a.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const remColor = (i: number) =>
    setColors((a) => a.filter((_, idx) => idx !== i));

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className='relative z-[9999]'
    >
      <div
        className='fixed inset-0 bg-black/30 backdrop-blur-sm'
        aria-hidden='true'
      />
      <div className='fixed inset-0 flex items-center justify-center p-4 sm:p-6'>
        <Dialog.Panel className='w-full max-w-2xl rounded-xl bg-white p-6 shadow-modal max-h-[90vh] overflow-y-auto'>
          <div className='flex items-center justify-between border-b border-neutral-200 pb-3'>
            <Dialog.Title className='text-lg font-semibold text-neutral-900'>
              Create Attribute
            </Dialog.Title>
            <button
              onClick={onClose}
              className='p-1 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100 transition-colors'
              aria-label='Close'
            >
              <X className='h-5 w-5' />
            </button>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className='mt-5 space-y-6'
          >
            {/* Assignment */}
            <section>
              <h4 className='text-sm font-semibold text-neutral-900'>
                Assign to categories
              </h4>
              <p className='text-xs text-neutral-500 mt-1 mb-3'>
                Pick one or more main categories and subcategories.
              </p>

              <div className='mb-4'>
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  Main Categories
                </label>
                <Controller
                  name='mainCategoryIds'
                  control={control}
                  render={({ field }) => (
                    <MultiSelect
                      options={mainOptions}
                      valueIds={field.value}
                      onChange={field.onChange}
                      placeholder='Select main categories…'
                      includeSelectAll
                      selectAllLabel='Select all main categories'
                    />
                  )}
                />
                {errors.mainCategoryIds && (
                  <p className='text-sm text-red-500 mt-1.5'>
                    {String(errors.mainCategoryIds.message)}
                  </p>
                )}
              </div>

              <label className='flex items-center gap-2 text-sm text-neutral-700 mb-3'>
                <input
                  type='checkbox'
                  checked={applyAllSubs}
                  onChange={(e) =>
                    setValue('applyAllSubs', e.target.checked, {
                      shouldDirty: true,
                    })
                  }
                  className='h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-400'
                />
                Apply to all subcategories of the selected main categories
              </label>

              {!applyAllSubs && (
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                    Subcategories
                  </label>
                  <Controller
                    name='subCategoryIds'
                    control={control}
                    render={({ field }) => (
                      <MultiSelect
                        options={subOptions}
                        valueIds={field.value || []}
                        onChange={field.onChange}
                        placeholder={
                          selectedMains.length === 0
                            ? 'Select a main category first'
                            : 'Select subcategories…'
                        }
                        disabled={selectedMains.length === 0}
                        includeSelectAll
                        selectAllLabel='Select all subcategories'
                      />
                    )}
                  />
                </div>
              )}
            </section>

            {/* Definition */}
            <section className='space-y-5'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                    Key
                  </label>
                  <input
                    {...register('key')}
                    className='w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 shadow-soft transition-all'
                    placeholder='e.g., color, size'
                  />
                  {errors.key && (
                    <p className='text-sm text-red-500 mt-1.5'>
                      {errors.key.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                    Label
                  </label>
                  <input
                    {...register('label')}
                    className='w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 shadow-soft transition-all'
                    placeholder='e.g., Color'
                  />
                  {errors.label && (
                    <p className='text-sm text-red-500 mt-1.5'>
                      {errors.label.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Value Kind */}
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  Value type
                </label>
                <Combobox
                  value={valueKind}
                  onChange={(vk: ValueKind) => setValueKind(vk)}
                >
                  <div className='relative'>
                    <div className='relative w-full cursor-default rounded-lg border border-neutral-300 bg-white pl-3 pr-10 py-2.5 text-left focus-within:ring-2 focus-within:ring-primary-400 focus-within:border-primary-400 text-sm shadow-soft transition-all'>
                      <Combobox.Input
                        className='w-full border-none p-0 focus:ring-0 text-neutral-700 placeholder:text-neutral-300 text-sm'
                        displayValue={() =>
                          kindOptions.find((o) => o.id === valueKind)?.title ??
                          ''
                        }
                        onChange={() => {}}
                        placeholder='Choose how this value is stored…'
                      />
                      <Combobox.Button className='absolute inset-y-0 right-0 flex items-center pr-3'>
                        <ChevronsUpDown className='h-4 w-4 text-neutral-400' />
                      </Combobox.Button>
                    </div>
                    <Transition
                      leave='transition ease-in duration-150'
                      leaveFrom='opacity-100 scale-100'
                      leaveTo='opacity-0 scale-95'
                    >
                      <Combobox.Options className='absolute z-30 mt-1.5 max-h-80 w-full overflow-auto rounded-lg bg-white py-2 text-sm shadow-modal ring-1 ring-neutral-200/50 focus:outline-none'>
                        {kindOptions.map(
                          ({
                            id,
                            title,
                            desc,
                            icon: Icon,
                            storedAs,
                            example,
                          }) => (
                            <Combobox.Option
                              key={id}
                              value={id}
                              className={({ active }) =>
                                `cursor-pointer select-none px-3 py-2.5 ${
                                  active
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'text-neutral-700'
                                }`
                              }
                            >
                              {({ selected }) => (
                                <div className='flex items-start gap-3'>
                                  <Icon className='h-4 w-4 mt-0.5 text-neutral-500' />
                                  <div className='min-w-0'>
                                    <div
                                      className={`truncate ${
                                        selected
                                          ? 'font-semibold'
                                          : 'font-medium'
                                      }`}
                                    >
                                      {title}
                                      <span className='ml-2 inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600'>
                                        stored as: {storedAs}
                                      </span>
                                    </div>
                                    <div className='text-xs text-neutral-500'>
                                      {desc}
                                      {example ? ` — ${example}` : ''}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Combobox.Option>
                          )
                        )}
                      </Combobox.Options>
                    </Transition>
                  </div>
                </Combobox>
              </div>

              {/* Builders based on kind */}
              {valueKind === 'single_string' && (
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                    Regex (optional)
                  </label>
                  <input
                    {...register('regex')}
                    className='w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 shadow-soft transition-all'
                    placeholder='e.g. ^[A-Z0-9-]+$'
                  />
                </div>
              )}

              {valueKind === 'single_number' && (
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                      Min
                    </label>
                    <input
                      type='number'
                      step='any'
                      {...register('min')}
                      className='w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 shadow-soft transition-all'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                      Max
                    </label>
                    <input
                      type='number'
                      step='any'
                      {...register('max')}
                      className='w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 shadow-soft transition-all'
                    />
                  </div>
                </div>
              )}

              {valueKind === 'multi_string' && (
                <MultiStringBuilder
                  listStr={listStr}
                  add={addStr}
                  upd={updStr}
                  rem={remStr}
                />
              )}

              {valueKind === 'multi_number' && (
                <MultiNumberBuilder
                  listNum={listNum}
                  add={addNum}
                  upd={updNum}
                  rem={remNum}
                />
              )}

              {valueKind === 'multi_color' && (
                <MultiColorBuilder
                  colors={colors}
                  add={addColor}
                  upd={updColor}
                  rem={remColor}
                />
              )}

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className='w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 shadow-soft transition-all'
                  placeholder='(Optional) short description…'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  Status
                </label>
                <select
                  {...register('status')}
                  className='w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 shadow-soft transition-all'
                >
                  <option value='active'>Active</option>
                  <option value='archived'>Archived</option>
                </select>
              </div>
            </section>

            <div className='flex justify-end gap-3 pt-4 border-t border-neutral-200'>
              <button
                type='button'
                onClick={onClose}
                className='px-4 py-2 text-sm font-medium rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-colors'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={isSubmitting}
                className='px-4 py-2 text-sm font-medium rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-60 transition-colors'
              >
                Create Attribute
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
