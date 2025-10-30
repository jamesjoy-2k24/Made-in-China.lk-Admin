import { getFirestore } from 'firebase-admin/firestore';
import type { Brand } from '../types';
import { env } from '../config/env';

const db = env.DATABASE_ID
  ? getFirestore(undefined, env.DATABASE_ID)
  : getFirestore();

const COL = 'brands';

export const brandsRepo = {
  col: () => db.collection(COL),

  async getById(id: string) {
    const doc = await this.col().doc(id).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() } as Brand) : null;
  },

  async findBySlug(slug: string) {
    const q = await this.col().where('slug', '==', slug).limit(1).get();
    return q.empty
      ? null
      : ({ id: q.docs[0].id, ...q.docs[0].data() } as Brand);
  },

  async listAll(mainCategoryId?: string) {
    let q: FirebaseFirestore.Query = this.col().orderBy('name');
    if (mainCategoryId)
      q = this.col()
        .where('mainCategoryId', '==', mainCategoryId)
        .orderBy('name');
    const snap = await q.get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Brand));
  },

  async create(data: Omit<Brand, 'id'>) {
    const ref = this.col().doc();
    await ref.set({ ...data });
    const doc = await ref.get();
    return { id: ref.id, ...(doc.data() as Omit<Brand, 'id'>) } as Brand;
  },

  async update(id: string, patch: Partial<Brand>) {
    const ref = this.col().doc(id);
    await ref.set({ ...patch, updatedAt: Date.now() }, { merge: true });
    const doc = await ref.get();
    return { id: doc.id, ...doc.data() } as Brand;
  },

  async remove(id: string) {
    await this.col().doc(id).delete();
  },
};
