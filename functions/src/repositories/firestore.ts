// repositories/firestore.ts
import { getFirestore } from 'firebase-admin/firestore';
import { env } from '../config/env';

// Pick the named DB if provided, otherwise (default)
const db = env.DATABASE_ID
  ? getFirestore(undefined, env.DATABASE_ID)
  : getFirestore();

// ✅ Ignore undefined values globally (extra safety)
db.settings({ ignoreUndefinedProperties: true });

export const col = (name: string) => db.collection(name);

export const list = async (name: string, limit = 100) => {
  const snap = await col(name).orderBy('createdAt', 'desc').limit(limit).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const create = async (name: string, data: any) => {
  const payload = { ...data, createdAt: Date.now() };
  const ref = await col(name).add(payload);
  return ref.id;
};

export const getById = async (name: string, id: string) => {
  const doc = await col(name).doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
};

export const update = async (name: string, id: string, data: any) => {
  // merge + set updatedAt; Firestore will ignore undefined due to settings above
  await col(name)
    .doc(id)
    .set({ ...data, updatedAt: Date.now() }, { merge: true });
};

export const remove = async (name: string, id: string) => {
  await col(name).doc(id).delete();
};
