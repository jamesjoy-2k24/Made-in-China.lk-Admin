import { z } from 'zod';
import type { AttributeDefinition } from '../types/attributes';

export function buildZodFromDefs(defs: AttributeDefinition[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const d of defs) {
    let t: z.ZodTypeAny;

    switch (d.valueType) {
      case 'string': {
        let str = z.string();
        if (d.regex) str = str.regex(new RegExp(d.regex));
        t = str;
        break;
      }
      case 'number': {
        let num = z.coerce.number();
        if (typeof d.min === 'number') num = num.min(d.min);
        if (typeof d.max === 'number') num = num.max(d.max);
        t = num;
        break;
      }
      case 'boolean':
        t = z.coerce.boolean();
        break;
      case 'enum': {
        const opts = (d.options || []).map((o) => String(o.value));
        t = opts.length ? z.enum([opts[0], ...opts.slice(1)]) : z.string();
        break;
      }
      case 'multi_enum': {
        const opts = (d.options || []).map((o) => String(o.value));
        const inner = opts.length
          ? z.enum([opts[0], ...opts.slice(1)])
          : z.string();
        t = z.array(inner);
        break;
      }
      case 'array_number':
        t = z.array(z.coerce.number());
        break;
      case 'array_string':
        t = z.array(z.string());
        break;
      case 'object':
        t = z.record(z.any());
        break;
      default:
        t = z.any();
    }

    shape[d.key] = t.optional();
  }

  return z.object(shape);
}
