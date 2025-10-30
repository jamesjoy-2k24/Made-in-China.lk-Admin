// routes/attributes.routes.ts
import { Router } from "express";
import { attributesController } from "../controllers/attributes.controller";
import { requireAuth } from "../middleware/auth";
import { requirePerm } from "../middleware/rbac";

const r = Router();

// ----- Attribute Definitions -----
r.get("/attributes",         requireAuth, requirePerm("catalog:list"),   attributesController.list);
r.get("/attributes/:id",     requireAuth, requirePerm("catalog:list"),   attributesController.get);
r.post("/attributes",        requireAuth, requirePerm("catalog:create"), attributesController.create);
r.patch("/attributes/:id",   requireAuth, requirePerm("catalog:update"), attributesController.update);
r.delete("/attributes/:id",  requireAuth, requirePerm("catalog:delete"), attributesController.remove);

// ----- Resolve for a picked (main, sub?) -----
r.get("/attributes/resolve", requireAuth, requirePerm("catalog:list"), attributesController.resolve);

// ----- Combined: create/update attribute + assign to many categories -----
r.post("/attributes/with-assign", requireAuth, requirePerm("catalog:create"), attributesController.createWithAssign);

export default r;
