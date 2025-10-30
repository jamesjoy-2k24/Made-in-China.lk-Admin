import { getFirestore } from 'firebase-admin/firestore';
import type { Category } from '../types';
import { env } from '../config/env';

const db = env.DATABASE_ID
  ? getFirestore(undefined, env.DATABASE_ID)
  : getFirestore();

const COL = 'categories';

export const categoriesRepo = {
  col: () => db.collection(COL),

  async getById(id: string) {
    const doc = await this.col().doc(id).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() } as Category) : null;
  },

  async getChildren(parentId: string | null) {
    const q = this.col().where('parentId', '==', parentId).orderBy('sortOrder');
    const snap = await q.get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
  },

  async listAll() {
    const snap = await this.col().orderBy('sortOrder').get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
  },

  async findBySlugUnderParent(slug: string, parentId: string | null) {
    const q = await this.col()
      .where('slug', '==', slug)
      .where('parentId', '==', parentId)
      .limit(1)
      .get();
    return q.empty
      ? null
      : ({ id: q.docs[0].id, ...q.docs[0].data() } as Category);
  },

  async create(data: Omit<Category, 'id'>) {
    const ref = this.col().doc();
    await ref.set({ ...data });
    const doc = await ref.get();
    return { id: ref.id, ...(doc.data() as Omit<Category, 'id'>) } as Category;
  },

  async update(id: string, patch: Partial<Category>) {
    const ref = this.col().doc(id);
    await ref.set({ ...patch, updatedAt: Date.now() }, { merge: true });
    const doc = await ref.get();
    return { id: doc.id, ...doc.data() } as Category;
  },

  async remove(id: string) {
    await this.col().doc(id).delete();
  },

  async getDescendantsIds(rootId: string): Promise<string[]> {
    const all = await this.listAll();
    const byParent: Record<string, Category[]> = {};
    for (const c of all) {
      const key = c.parentId ?? '__ROOT__';
      (byParent[key] ||= []).push(c);
    }
    const res: string[] = [];
    const stack = [rootId];
    while (stack.length) {
      const id = stack.pop()!;
      res.push(id);
      const kids = byParent[id] || [];
      for (const k of kids) stack.push(k.id);
    }
    return res;
  },
};
