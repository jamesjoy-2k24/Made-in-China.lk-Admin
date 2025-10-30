import { Router } from "express";
const r = Router();
r.get("/", (_req, res) => res.json({ items: [] }));
export default r;
