import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import '../config/firebase';
import { getFirestore } from 'firebase-admin/firestore';
import { admin as AdminSDK } from '../config/firebase';
import { env } from '../config/env';

const db = env.DATABASE_ID
  ? getFirestore(undefined, env.DATABASE_ID)
  : getFirestore();

type AnyObj = Record<string, any>;

function loadJson<T = AnyObj>(rel: string): T {
  const p = path.resolve(__dirname, '../data', rel);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// ---------- Mappers ----------
function mapUser(u: AnyObj) {
  return {
    name: u.name,
    phone: u.phone,
    isVerified: Boolean(u.isVerified),
    // NOTE: do NOT store plaintext passwords in Firestore
    createdAt: Date.now(),
  };
}

function mapProduct(p: AnyObj) {
  const firstVar =
    Array.isArray(p.variants) && p.variants.length ? p.variants[0] : null;
  const price =
    typeof p.price === 'number'
      ? p.price
      : p.price && typeof p.price.value === 'number'
      ? p.price.value
      : 0;

  const images = Array.isArray(p.images) ? p.images : [];
  const attributes = {
    ...(p.attributes || {}),
    // carry useful meta into attributes since schema uses generic attributes:
    type: p.type,
    category: p.category,
    brand: p.brand,
    shipping: p.shipping || undefined,
    seller: p.seller || undefined,
    rating: p.rating || undefined,
  };

  return {
    title: p.name,
    sku: firstVar?.sku || p.id,
    price,
    stock: Number(firstVar?.stock ?? 0),
    images,
    attributes,
    status: 'active',
    createdAt: Date.now(),
  };
}

// ---------- Admin defaults (RBAC) ----------
const DEFAULT_PERMS = [
  'users:list',
  'users:create',
  'users:update',
  'users:delete',
  'users:import',
  'users:export',
  'products:list',
  'products:create',
  'products:update',
  'products:delete',
  'products:import',
  'products:bulkUpdate',
  'orders:list',
  'orders:update',
  'orders:export',
  'payments:list',
  'payments:refund',
  'content:list',
  'content:create',
  'content:update',
  'content:delete',
  'catalog:list',
  'catalog:create',
  'catalog:update',
  'catalog:delete',
  'system:roles',
  'system:audit',
  'system:settings',
  'dashboard:view',
];

async function ensureAdminAuthAndProfile(a: AnyObj) {
  const email = String(a.email || '')
    .trim()
    .toLowerCase();
  if (!email) throw new Error("Admin entry missing 'email'");
  const password = String(a.password || 'TempPass!123');
  const name = a.name || 'Admin';
  const image = a.image || null;
  const phone = a.phone || null;
  const role = a.role || 'SuperAdmin';

  // 1) Find or create Firebase Auth user by email
  let user;
  try {
    user = await AdminSDK.auth().getUserByEmail(email);
  } catch {
    user = await AdminSDK.auth().createUser({
      email,
      password,
      displayName: name,
      photoURL: image || undefined,
      emailVerified: true,
      disabled: false,
    });
  }

  // 2) Ensure custom claims (RBAC)
  await AdminSDK.auth().setCustomUserClaims(user.uid, {
    role,
    permissions: DEFAULT_PERMS,
  });

  // 3) Upsert Firestore profile (users collection, doc = uid)
  const profile = {
    name,
    email,
    phone,
    photoURL: image,
    isVerified: true,
    role,
    permissions: DEFAULT_PERMS,
    updatedAt: Date.now(),
    createdAt: user.metadata?.creationTime
      ? new Date(user.metadata.creationTime).getTime()
      : Date.now(),
  };

  await db.collection('users').doc(user.uid).set(profile, { merge: true });
  return user.uid;
}

// ---------- Seeders ----------
async function seedUsers() {
  const filePath = path.resolve(__dirname, '../data', 'users.json');
  if (!fs.existsSync(filePath)) return { written: 0 };

  const { users } = loadJson<{ users: AnyObj[] }>('users.json');
  if (!Array.isArray(users)) return { written: 0 };

  let n = 0;
  for (const u of users) {
    const docId = u.id || undefined; // use given id if present
    const data = mapUser(u);
    const ref = docId
      ? db.collection('users').doc(docId)
      : db.collection('users').doc();
    await ref.set(data, { merge: true });
    n++;
  }
  return { written: n };
}

async function seedProducts() {
  const filePath = path.resolve(__dirname, '../data', 'product.json');
  if (!fs.existsSync(filePath)) return { written: 0 };

  const { products } = loadJson<{ products: AnyObj[] }>('product.json');
  if (!Array.isArray(products)) return { written: 0 };

  let n = 0;
  for (const p of products) {
    const docId = p.id || undefined; // keep provided id as Firestore doc id
    const data = mapProduct(p);
    const ref = docId
      ? db.collection('products').doc(docId)
      : db.collection('products').doc();
    await ref.set(data, { merge: true });
    n++;
  }
  return { written: n };
}

async function seedAdmins() {
  const filePath = path.resolve(__dirname, '../data', 'admins.json');
  if (!fs.existsSync(filePath)) return { written: 0 };

  const { admins } = loadJson<{ admins: AnyObj[] }>('admins.json');
  if (!Array.isArray(admins)) return { written: 0 };

  let n = 0;
  for (const a of admins) {
    await ensureAdminAuthAndProfile(a);
    n++;
  }
  return { written: n };
}

// ---------- Entrypoint ----------
async function main() {
  const users = await seedUsers();
  const prods = await seedProducts();
  const admins = await seedAdmins();
  console.log('✅ Seed complete:', {
    users: users.written,
    products: prods.written,
    admins: admins.written,
  });
}

main().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
