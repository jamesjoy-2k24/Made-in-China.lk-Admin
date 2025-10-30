import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { permit } from "../middleware/rbac";
import * as ctrl from "../controllers/users.controller";

const r = Router();
r.get("/", requireAuth, permit("users:list"), ctrl.list);
r.post("/", requireAuth, permit("users:create"), ctrl.create);
r.get("/:id", requireAuth, permit("users:list"), ctrl.getById);
r.put("/:id", requireAuth, permit("users:update"), ctrl.update);
r.delete("/:id", requireAuth, permit("users:delete"), ctrl.remove);
export default r;
