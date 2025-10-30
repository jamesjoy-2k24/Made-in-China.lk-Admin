import { Request, Response } from "express";
import * as svc from "../services/products.service";

const ctrl = {
  // CREATE (multipart) – field name: files (1–5)
  async create(req: Request, res: Response) {
    try {
      const files = (req as any).files as Express.Multer.File[] | undefined;
      const product = await svc.createFromForm(req.body, files || []);
      res.status(201).json(product);
    } catch (e: any) {
      res.status(400).json({ ok: false, message: e?.message || "create_failed" });
    }
  },

  async get(req: Request, res: Response) {
    try {
      const item = await svc.getOne(req.params.id);
      res.json(item);
    } catch (e: any) {
      res.status(404).json({ ok: false, message: e?.message || "not_found" });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const data = await svc.listMany({
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        status: req.query.status as any,
        mainCategoryId: req.query.mainCategoryId as string | undefined,
        subCategoryId: req.query.subCategoryId as string | undefined,
        brandId: req.query.brandId as string | undefined,
        search: req.query.search as string | undefined,
        orderBy: (req.query.orderBy as any) || undefined,
        orderDir: (req.query.orderDir as any) || undefined,
      });
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ ok: false, message: e?.message || "list_failed" });
    }
  },

  // UPDATE (multipart supported)
  async update(req: Request, res: Response) {
    try {
      const files = (req as any).files as Express.Multer.File[] | undefined;
      const product = await svc.updateOne(req.params.id, req.body, files);
      res.json(product);
    } catch (e: any) {
      res.status(400).json({ ok: false, message: e?.message || "update_failed" });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const result = await svc.removeOne(req.params.id);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ ok: false, message: e?.message || "delete_failed" });
    }
  },
};

export default ctrl;
