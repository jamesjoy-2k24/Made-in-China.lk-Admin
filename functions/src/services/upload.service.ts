// src/services/upload.service.ts
import { getStorage } from 'firebase-admin/storage';
import { randomUUID } from 'crypto';
import path from 'path';
import { env } from '../config/env';

const bucket = getStorage().bucket(env.STORAGE_BUCKET || undefined);

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export async function uploadImageBuffer(
  buffer: Buffer,
  folder: 'categories' | 'brands' | 'products' | 'misc',
  originalName: string,
  contentType?: string,
  nameBase?: string
): Promise<{ url: string; path: string; token: string }> {
  const ext =
    (path.extname(originalName) || '.jpg').replace(/^\./, '') || 'jpg';
  const base =
    slugify(nameBase || originalName.replace(/\.[^.]+$/, '')) || 'image';
  const objectPath = `${folder}/${base}_${Date.now()}.${ext}`;

  const file = bucket.file(objectPath);
  const token = randomUUID();

  await file.save(buffer, {
    metadata: {
      contentType: contentType || 'application/octet-stream',
      metadata: { firebaseStorageDownloadTokens: token },
    },
    public: false,
    resumable: false,
    validation: 'crc32c',
  });

  const encoded = encodeURIComponent(objectPath);
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encoded}?alt=media&token=${token}`;

  return { url, path: objectPath, token };
}

export async function uploadManyImages(
  files: Express.Multer.File[],
  folder: 'categories' | 'brands' | 'products' | 'misc',
  nameBases?: (string | undefined)[]
) {
  const tasks = files.map((f, i) =>
    uploadImageBuffer(
      f.buffer,
      folder,
      f.originalname,
      f.mimetype,
      nameBases?.[i]
    )
  );
  return Promise.all(tasks);
}

export async function deleteByPath(storagePath: string) {
  await bucket.file(storagePath).delete({ ignoreNotFound: true });
  return { ok: true, path: storagePath };
}

export async function deleteMany(paths: string[]) {
  await Promise.all(
    paths.map((p) => bucket.file(p).delete({ ignoreNotFound: true }))
  );
  return { ok: true, removed: paths.length };
}

/* ----------------------------------------------------
 * NEW: Delete by Firebase download URL (or gs:// URL)
 * --------------------------------------------------*/

/** Parse a Firebase Storage URL into { bucket, object } if possible. */
function parseStorageUrl(
  u: string
): { bucket?: string; object?: string } | null {
  try {
    // gs://<bucket>/<object>
    if (u.startsWith('gs://')) {
      const rest = u.slice('gs://'.length);
      const i = rest.indexOf('/');
      return i === -1
        ? { bucket: rest, object: '' }
        : { bucket: rest.slice(0, i), object: rest.slice(i + 1) };
    }

    // https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encodedObject>?...
    if (u.includes('firebasestorage.googleapis.com')) {
      const m = u.match(/\/b\/([^/]+)\/o\/([^?]+)/);
      if (m) return { bucket: m[1], object: decodeURIComponent(m[2]) };
    }

    // Fallback: try to pull /o/<object> from any similar URL
    const m2 = u.match(/\/o\/([^?]+)/);
    if (m2) return { object: decodeURIComponent(m2[1]) };

    return null;
  } catch {
    return null;
  }
}

/** Delete an object by its Firebase download URL (tokenized) or gs:// URL. */
export async function deleteByUrl(url: string): Promise<void> {
  const parsed = parseStorageUrl(url);
  if (!parsed || !parsed.object) return;

  const b = parsed.bucket ? getStorage().bucket(parsed.bucket) : bucket;
  await b
    .file(parsed.object)
    .delete({ ignoreNotFound: true })
    .catch(() => {});
}

/** Convenience bulk helper (optional). */
export async function deleteByUrls(urls: string[]): Promise<void> {
  await Promise.all(urls.map((u) => deleteByUrl(u).catch(() => {})));
}
