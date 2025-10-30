// controllers/attributes.controller.ts
import { Request, Response } from "express";
import { attributesService } from "../services/attributes.service";

const handle = async (res: Response, fn: () => Promise<any>) => {
  try {
    const data = await fn();
    res.json(data);
  } catch (e: any) {
    const msg = e?.message || "Bad Request";
    const code = /not found/i.test(msg) ? 404 : 400;
    res.status(code).json({ ok: false, message: msg });
  }
};

export const attributesController = {
  // AttributeDefinition
  create: (req: Request, res: Response) => handle(res, () => attributesService.createAttribute(req.body)),
  update: (req: Request, res: Response) => handle(res, () => attributesService.updateAttribute(req.params.id, req.body)),
  get:    (req: Request, res: Response) => handle(res, () => attributesService.getAttribute(req.params.id)),
  list:   (req: Request, res: Response) => handle(res, () => attributesService.listAttributes(req.query.status as any)),
  remove: (req: Request, res: Response) => handle(res, () => attributesService.deleteAttribute(req.params.id)),

  // Resolve for product form
  resolve: (req: Request, res: Response) => handle(res, () => attributesService.resolveAttributes(req.query)),

  // Combined create + assign (writes pairKeys in the attribute doc)
  createWithAssign: (req: Request, res: Response) => handle(res, () => attributesService.createAttributeWithAssign(req.body)),
};
