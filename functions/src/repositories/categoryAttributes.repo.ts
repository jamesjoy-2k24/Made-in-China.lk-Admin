// repositories/categoryAttributes.repo.ts
import { col } from './firestore';
import type { CategoryAttributeMap } from '../types/attributes';

const COLL = 'category_attribute_maps';

export const categoryAttributesRepo = {
  async upsert(
    mainCategoryId: string,
    subCategoryId: string | null,
    data: Omit<CategoryAttributeMap, 'id' | 'mainCategoryId' | 'subCategoryId'>
  ): Promise<CategoryAttributeMap> {
    const snap = await col(COLL)
      .where('mainCategoryId', '==', mainCategoryId)
      .where('subCategoryId', '==', subCategoryId)
      .limit(1)
      .get();

    const base = { mainCategoryId, subCategoryId, ...data };
    if (snap.empty) {
      const ref = await col(COLL).add(base);
      return { id: ref.id, ...base } as CategoryAttributeMap;
    }
    const d = snap.docs[0];
    await d.ref.set(base, { merge: true });
    return { id: d.id, ...(d.data() as any), ...data } as CategoryAttributeMap;
  },

  async get(
    mainCategoryId: string,
    subCategoryId: string | null
  ): Promise<CategoryAttributeMap | null> {
    const snap = await col(COLL)
      .where('mainCategoryId', '==', mainCategoryId)
      .where('subCategoryId', '==', subCategoryId)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...(d.data() as any) } as CategoryAttributeMap;
  },

  async findForResolve(
    mainCategoryId: string,
    subCategoryId: string | null
  ): Promise<CategoryAttributeMap[]> {
    const list: CategoryAttributeMap[] = [];

    const shared = await col(COLL)
      .where('mainCategoryId', '==', mainCategoryId)
      .where('subCategoryId', '==', null)
      .get();
    shared.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));

    const specific = await col(COLL)
      .where('mainCategoryId', '==', mainCategoryId)
      .where('subCategoryId', '==', subCategoryId)
      .get();
    specific.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));

    return list.sort(
      (a, b) => a.priority - b.priority || a.updatedAt - b.updatedAt
    );
  },

  async listAll(): Promise<CategoryAttributeMap[]> {
    const snap = await col(COLL).orderBy('createdAt', 'desc').get();
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  },

  async remove(mainCategoryId: string, subCategoryId: string | null) {
    const snap = await col(COLL)
      .where('mainCategoryId', '==', mainCategoryId)
      .where('subCategoryId', '==', subCategoryId)
      .get();
    const batch = col(COLL).firestore.batch();
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    return { removed: snap.size };
  },
};
