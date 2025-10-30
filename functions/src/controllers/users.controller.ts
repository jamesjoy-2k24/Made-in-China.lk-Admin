import { Request, Response } from 'express';
import * as svc from '../services/users.service';
import { UserDto } from '../schemas/users.schema';
import { parseOrThrow } from '../lib/z';
import { z } from 'zod';

export const list = async (_req: Request, res: Response) => {
  const items = await svc.list();
  res.json({ items });
};

export const create = async (req: Request, res: Response) => {
  const data = parseOrThrow<z.infer<typeof UserDto>>(UserDto, req.body);
  const id = await svc.create(data);
  res.status(201).json({ id });
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  const item = await svc.getById(req.params.id);
  if (!item) return;
  res.json(item);
};

export const update = async (req: Request, res: Response) => {
  const id = req.params.id;
  await svc.update(id, req.body);
  res.json({ id, updated: true });
};

export const remove = async (req: Request, res: Response) => {
  const id = req.params.id;
  await svc.remove(id);
  res.status(204).send();
};
