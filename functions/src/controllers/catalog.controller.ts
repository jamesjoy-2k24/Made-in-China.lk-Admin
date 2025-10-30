import { Request, Response } from 'express';
import { catalogService } from '../services/catalog.service';
import { uploadImageBuffer } from '../services/upload.service';

const handle = async (res: Response, fn: () => Promise<any>) => {
  try {
    const data = await fn();
    res.json(data);
  } catch (e: any) {
    const msg = e?.message || 'Bad Request';
    const code = /not found/i.test(msg) ? 404 : 400;
    res.status(code).json({ ok: false, message: msg });
  }
};

export const catalogController = {
  // ------- Categories (JSON) -------
  createCategory: (req: Request, res: Response) =>
    handle(res, () => catalogService.createCategory(req.body)),

  updateCategory: (req: Request, res: Response) =>
    handle(res, () => catalogService.updateCategory(req.params.id, req.body)),

  getCategory: (req: Request, res: Response) =>
    handle(res, () => catalogService.getCategory(req.params.id)),

  listCategories: (req: Request, res: Response) =>
    handle(res, () => {
      const parentId = (req.query.parentId as string) ?? undefined;
      return catalogService.listCategories(parentId);
    }),

  deleteCategory: (req: Request, res: Response) =>
    handle(res, () => {
      const hard = String(req.query.hard || '') === 'true';
      return catalogService.deleteCategory(req.params.id, { hard });
    }),

  // ------- Brands (JSON) -------
  createBrand: (req: Request, res: Response) =>
    handle(res, () => catalogService.createBrand(req.body)),

  updateBrand: (req: Request, res: Response) =>
    handle(res, () => catalogService.updateBrand(req.params.id, req.body)),

  getBrand: (req: Request, res: Response) =>
    handle(res, () => catalogService.getBrand(req.params.id)),

  listBrands: (req: Request, res: Response) =>
    handle(res, () => {
      const mainCategoryId = (req.query.mainCategoryId as string) || undefined;
      return catalogService.listBrands(mainCategoryId);
    }),

  deleteBrand: (req: Request, res: Response) =>
    handle(res, () => {
      const hard = String(req.query.hard || '') === 'true';
      return catalogService.deleteBrand(req.params.id, { hard });
    }),

  // ------- Categories (multipart upload) -------
  createCategoryWithUpload: (req: Request, res: Response) =>
    handle(res, async () => {
      const file = (req as any).file as Express.Multer.File | undefined;
      const body = req.body as any;

      const parentId =
        body.parentId === 'null' || body.parentId === '' || body.parentId == null
          ? null
          : String(body.parentId);

      let image: string | null = null;
      if (file) {
        const up = await uploadImageBuffer(
          file.buffer,
          'categories',
          file.originalname,
          file.mimetype,
          body.name
        );
        image = up.url;
      }

      return catalogService.createCategory({
        name: String(body.name),
        parentId,
        sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
        image,
        status: body.status || 'active',
        slug: body.slug || undefined,
        description: body.description || null,

        // NEW
        shippingType: body.shippingType ? String(body.shippingType) : null,
        shippingRate:
          body.shippingRate != null && body.shippingRate !== ''
            ? Number(body.shippingRate)
            : null,
      });
    }),

  updateCategoryWithUpload: (req: Request, res: Response) =>
    handle(res, async () => {
      const file = (req as any).file as Express.Multer.File | undefined;
      const body = req.body as any;

      const patch: any = {};
      if (body.name != null) patch.name = String(body.name);
      if (body.sortOrder != null) patch.sortOrder = Number(body.sortOrder);
      if (body.status != null) patch.status = String(body.status);
      if (body.slug != null) patch.slug = String(body.slug);
      if (body.parentId != null) {
        patch.parentId =
          body.parentId === 'null' || body.parentId === '' ? null : String(body.parentId);
      }
      if (body.description != null) patch.description = String(body.description);

      // NEW
      if (body.shippingType !== undefined) {
        patch.shippingType = body.shippingType ? String(body.shippingType) : null;
      }
      if (body.shippingRate !== undefined) {
        patch.shippingRate =
          body.shippingRate != null && body.shippingRate !== ''
            ? Number(body.shippingRate)
            : null;
      }

      if (file) {
        const up = await uploadImageBuffer(
          file.buffer,
          'categories',
          file.originalname,
          file.mimetype,
          body.name || undefined
        );
        patch.image = up.url;
      }

      return catalogService.updateCategory(req.params.id, patch);
    }),

  // ------- Brands (multipart upload) -------
  createBrandWithUpload: (req: Request, res: Response) =>
    handle(res, async () => {
      const file = (req as any).file as Express.Multer.File | undefined;
      const body = req.body as any;

      let image: string | null = null;
      if (file) {
        const up = await uploadImageBuffer(
          file.buffer,
          'brands',
          file.originalname,
          file.mimetype,
          body.name
        );
        image = up.url;
      }

      return catalogService.createBrand({
        name: String(body.name),
        mainCategoryId: String(body.mainCategoryId),
        image,
        description: body.description || null,
        website: body.website || null,
        status: body.status || 'active',
        slug: body.slug || undefined,
      });
    }),

  updateBrandWithUpload: (req: Request, res: Response) =>
    handle(res, async () => {
      const file = (req as any).file as Express.Multer.File | undefined;
      const body = req.body as any;

      const patch: any = {};
      if (body.name != null) patch.name = String(body.name);
      if (body.mainCategoryId != null) patch.mainCategoryId = String(body.mainCategoryId);
      if (body.description != null) patch.description = String(body.description);
      if (body.website != null) patch.website = String(body.website);
      if (body.status != null) patch.status = String(body.status);
      if (body.slug != null) patch.slug = String(body.slug);

      if (file) {
        const up = await uploadImageBuffer(
          file.buffer,
          'brands',
          file.originalname,
          file.mimetype,
          body.name || undefined
        );
        patch.image = up.url;
      }

      return catalogService.updateBrand(req.params.id, patch);
    }),
};
