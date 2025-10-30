// repositories/attributes.repo.ts
import { col } from "./firestore";
import type { AttributeDefinition } from "../types/attributes";

const COLL = "attribute_definitions";

export const attributesRepo = {
  async getById(id: string): Promise<AttributeDefinition | null> {
    const doc = await col(COLL).doc(id).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() } as any) : null;
  },

  async getByKey(key: string): Promise<AttributeDefinition | null> {
    const snap = await col(COLL).where("key", "==", key).limit(1).get();
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...(d.data() as any) };
  },

  async create(base: Omit<AttributeDefinition, "id">): Promise<AttributeDefinition> {
    const ref = await col(COLL).add(base);
    return { id: ref.id, ...base } as any;
  },

  async update(id: string, patch: Partial<AttributeDefinition>): Promise<AttributeDefinition> {
    await col(COLL).doc(id).set(patch, { merge: true });
    const d = await col(COLL).doc(id).get();
    return { id: d.id, ...(d.data() as any) };
  },

  async remove(id: string): Promise<void> {
    await col(COLL).doc(id).delete();
  },

  async listAll(status?: "active" | "archived"): Promise<AttributeDefinition[]> {
    let q = col(COLL).orderBy("createdAt", "desc") as FirebaseFirestore.Query;
    if (status) q = q.where("status", "==", status);
    const snap = await q.get();
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  },

  // 🔎 main-only query (filter subs in service)
  async findByMain(mainCategoryId: string): Promise<AttributeDefinition[]> {
    const snap = await col(COLL)
      .where("mainCategoryIds", "array-contains", mainCategoryId)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  },
};
