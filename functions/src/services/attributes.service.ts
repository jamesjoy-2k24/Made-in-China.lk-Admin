import {
  zAttributeCreate,
  zAttributeUpdate,
  zResolveQuery,
  zAttributeCreateWithAssign,
} from '../schemas/attributes.schema';
import { attributesRepo } from '../repositories/attributes.repo';
import type {
  AttributeDefinition,
  AttributeOption,
  AttributeUnit,
  ResolvedAttributes,
} from '../types/attributes';
import { buildZodFromDefs } from '../lib/attributes.zod-builder';

const now = () => Date.now();

export const attributesService = {
  // ----- AttributeDefinition CRUD -----
  async createAttribute(payload: unknown): Promise<AttributeDefinition> {
    const dto = zAttributeCreate.parse(payload);
    const exists = await attributesRepo.getByKey(dto.key);
    if (exists) throw new Error('Attribute key already exists');

    const normalizeOptions = (
      opts?: Partial<AttributeOption>[]
    ): AttributeOption[] =>
      (opts ?? []).map((o) => ({
        value: String(o.value ?? ''),
        label: o.label ?? '',
      }));

    const normalizeUnits = (
      units?: Partial<AttributeUnit>[]
    ): AttributeUnit[] =>
      (units ?? []).map((u) => ({
        code: String(u.code ?? ''),
        label: u.label ?? '',
      }));

    const base: Omit<AttributeDefinition, 'id'> = {
      key: dto.key,
      label: dto.label,
      description: dto.description ?? null,

      valueType: dto.valueType,
      min: dto.min ?? null,
      max: dto.max ?? null,
      regex: dto.regex ?? null,

      options: normalizeOptions(dto.options),
      units: normalizeUnits(dto.units),
      defaultUnit: dto.defaultUnit ?? null,

      groupKey: dto.groupKey ?? null,
      isFilterable: dto.isFilterable ?? true,
      isSearchable: dto.isSearchable ?? false,
      isVariantDimension: dto.isVariantDimension ?? false,

      aliases: dto.aliases ?? [],

      mainCategoryIds: [],
      subCategoryIds: [],

      status: dto.status ?? 'active',
      createdAt: now(),
      updatedAt: now(),
    };
    return attributesRepo.create(base);
  },

  async updateAttribute(
    id: string,
    payload: unknown
  ): Promise<AttributeDefinition> {
    const dto = zAttributeUpdate.parse(payload);
    const existing = await attributesRepo.getById(id);
    if (!existing) throw new Error('Attribute not found');

    if (dto.key && dto.key !== existing.key) {
      const conflict = await attributesRepo.getByKey(dto.key);
      if (conflict) throw new Error('Attribute key already exists');
    }

    const normalizeOptions = (
      opts?: Partial<AttributeOption>[]
    ): AttributeOption[] =>
      (opts ?? []).map((o) => ({
        value: String(o.value ?? ''),
        label: o.label ?? '',
      }));

    const normalizeUnits = (
      units?: Partial<AttributeUnit>[]
    ): AttributeUnit[] =>
      (units ?? []).map((u) => ({
        code: String(u.code ?? ''),
        label: u.label ?? '',
      }));

    const patch: Partial<AttributeDefinition> = {
      ...(dto.key !== undefined ? { key: dto.key } : {}),
      ...(dto.label !== undefined ? { label: dto.label } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description ?? null }
        : {}),
      ...(dto.valueType !== undefined ? { valueType: dto.valueType } : {}),
      ...(dto.min !== undefined ? { min: dto.min ?? null } : {}),
      ...(dto.max !== undefined ? { max: dto.max ?? null } : {}),
      ...(dto.regex !== undefined ? { regex: dto.regex ?? null } : {}),
      ...(dto.options !== undefined
        ? { options: normalizeOptions(dto.options) }
        : {}),
      ...(dto.units !== undefined ? { units: normalizeUnits(dto.units) } : {}),
      ...(dto.defaultUnit !== undefined
        ? { defaultUnit: dto.defaultUnit ?? null }
        : {}),
      ...(dto.groupKey !== undefined ? { groupKey: dto.groupKey ?? null } : {}),
      ...(dto.isFilterable !== undefined
        ? { isFilterable: dto.isFilterable }
        : {}),
      ...(dto.isSearchable !== undefined
        ? { isSearchable: dto.isSearchable }
        : {}),
      ...(dto.isVariantDimension !== undefined
        ? { isVariantDimension: dto.isVariantDimension }
        : {}),
      ...(dto.aliases !== undefined ? { aliases: dto.aliases ?? [] } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      updatedAt: now(),
    };

    return attributesRepo.update(id, patch);
  },

  async getAttribute(id: string) {
    const a = await attributesRepo.getById(id);
    if (!a) throw new Error('Attribute not found');
    return a;
  },

  async listAttributes(status?: 'active' | 'archived') {
    return attributesRepo.listAll(status);
  },

  async deleteAttribute(id: string) {
    await attributesRepo.remove(id);
    return { removed: 1 };
  },

  // ----- Resolve for product form -----
  async resolveAttributes(query: unknown): Promise<ResolvedAttributes> {
    const q = zResolveQuery.parse(query);
    const mainCategoryId = q.mainCategoryId;
    const subCategoryId = q.subCategoryId ?? null;

    const defs = await attributesRepo.findByMain(mainCategoryId);

    const filtered = defs.filter((d) => {
      const subs = d.subCategoryIds ?? [];
      return (
        subs.includes(null) ||
        (subCategoryId ? subs.includes(subCategoryId) : true)
      );
    });

    const attributeKeys = filtered.map((d) => d.key);
    return {
      mainCategoryId,
      subCategoryId,
      attributeKeys,
      definitions: filtered,
    };
  },

  // ----- Combined: create/update + assign -----
  async createAttributeWithAssign(payload: unknown) {
    const dto = zAttributeCreateWithAssign.parse(payload);
    const ts = now();

    const targetSubs: (string | null)[] =
      dto.subCategoryIds && dto.subCategoryIds.length
        ? dto.subCategoryIds
        : [null];

    const existing = await attributesRepo.getByKey(dto.key);
    const normalizeOptions = (
      opts?: Partial<AttributeOption>[]
    ): AttributeOption[] =>
      (opts ?? []).map((o) => ({
        value: String(o.value ?? ''),
        label: o.label ?? '',
      }));

    const normalizeUnits = (
      units?: Partial<AttributeUnit>[]
    ): AttributeUnit[] =>
      (units ?? []).map((u) => ({
        code: String(u.code ?? ''),
        label: u.label ?? '',
      }));

    let def: AttributeDefinition;

    if (existing) {
      const mainSet = new Set<string>([
        ...(existing.mainCategoryIds ?? []),
        ...dto.mainCategoryIds,
      ]);
      const subSet = new Set<string | null>([
        ...(existing.subCategoryIds ?? []),
        ...targetSubs,
      ]);

      def = await attributesRepo.update(existing.id, {
        label: dto.label,
        description: dto.description ?? null,
        valueType: dto.valueType,
        min: dto.min ?? null,
        max: dto.max ?? null,
        regex: dto.regex ?? null,
        options: normalizeOptions(dto.options),
        units: normalizeUnits(dto.units),
        defaultUnit: dto.defaultUnit ?? null,
        groupKey: dto.groupKey ?? null,
        isFilterable: dto.isFilterable ?? true,
        isSearchable: dto.isSearchable ?? false,
        isVariantDimension: dto.isVariantDimension ?? false,
        aliases: dto.aliases ?? [],
        status: dto.status ?? 'active',
        mainCategoryIds: Array.from(mainSet),
        subCategoryIds: Array.from(subSet),
        updatedAt: ts,
      } as any);
    } else {
      def = await attributesRepo.create({
        key: dto.key,
        label: dto.label,
        description: dto.description ?? null,
        valueType: dto.valueType,
        min: dto.min ?? null,
        max: dto.max ?? null,
        regex: dto.regex ?? null,
        options: normalizeOptions(dto.options),
        units: normalizeUnits(dto.units),
        defaultUnit: dto.defaultUnit ?? null,
        groupKey: dto.groupKey ?? null,
        isFilterable: dto.isFilterable ?? true,
        isSearchable: dto.isSearchable ?? false,
        isVariantDimension: dto.isVariantDimension ?? false,
        aliases: dto.aliases ?? [],
        status: dto.status ?? 'active',
        mainCategoryIds: dto.mainCategoryIds,
        subCategoryIds: targetSubs,
        createdAt: ts,
        updatedAt: ts,
      } as any);
    }

    const assignedCount = dto.mainCategoryIds.length * targetSubs.length;
    return { attribute: def, assignedCount };
  },

  async validateAndCoerceAttributes(
    mainCategoryId: string,
    subCategoryId: string | null | undefined,
    attributes: any
  ) {
    const resolved = await this.resolveAttributes({
      mainCategoryId,
      subCategoryId: subCategoryId ?? undefined,
    });
    const zod = buildZodFromDefs(resolved.definitions);
    return zod.parse(attributes || {});
  },
};
