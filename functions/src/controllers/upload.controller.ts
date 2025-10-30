import { Request, Response } from 'express';
import {
  uploadImageBuffer,
  uploadManyImages,
  deleteByPath,
  deleteMany,
} from '../services/upload.service';

export const uploadController = {
  // Single file
  image: async (req: Request, res: Response): Promise<void> => {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const folder =
      (req.body.folder as 'categories' | 'brands' | 'products' | 'misc') ||
      'misc';
    const nameBase = (req.body.name as string) || undefined;

    const result = await uploadImageBuffer(
      file.buffer,
      folder,
      file.originalname,
      file.mimetype,
      nameBase
    );

    res.json({ ok: true, folder, url: result.url, path: result.path });
  },

  // Up to 5 files
  images: async (req: Request, res: Response): Promise<void> => {
    const files = (req as any).files as Express.Multer.File[] | undefined;
    if (!files?.length) {
      res.status(400).json({ message: 'No files uploaded' });
      return;
    }
    if (files.length > 5) {
      res.status(400).json({ message: 'Max 5 images allowed' });
      return;
    }

    const folder =
      (req.body.folder as 'categories' | 'brands' | 'products' | 'misc') ||
      'misc';

    let names: (string | undefined)[] = [];
    const rawNames = (req.body.names ?? req.body.name) as any;

    if (Array.isArray(rawNames)) {
      names = rawNames.map((n) => (typeof n === 'string' ? n : undefined));
    } else if (typeof rawNames === 'string') {
      try {
        const parsed = JSON.parse(rawNames);
        names = Array.isArray(parsed) ? parsed : [rawNames];
      } catch {
        names = [rawNames];
      }
    }

    const results = await uploadManyImages(files, folder, names);
    res.json({
      ok: true,
      folder,
      count: results.length,
      items: results.map((r) => ({ url: r.url, path: r.path })),
    });
  },

  // Delete single by path (?path=...)
  remove: async (req: Request, res: Response): Promise<void> => {
    const storagePath = String(req.query.path || '');
    if (!storagePath) {
      res.status(400).json({ message: 'Missing path' });
      return;
    }
    const result = await deleteByPath(storagePath);
    res.json({ ok: true, ...result });
  },

  // Delete many by paths (body: { paths: string[] })
  removeMany: async (req: Request, res: Response): Promise<void> => {
    const { paths } = req.body as { paths: string[] };
    if (!Array.isArray(paths) || !paths.length) {
      res.status(400).json({ message: 'paths[] required' });
      return;
    }

    const result = await deleteMany(paths);
    res.json({ ok: true, ...result });
  },
};
