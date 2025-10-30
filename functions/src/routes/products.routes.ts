import { Router } from "express";
import ctrl from "../controllers/products.controller";
import { requireAuth } from "../middleware/auth";
import { requirePerm } from "../middleware/rbac";
import { imageUploadArray } from "../middleware/upload";

const r = Router();

// Create (multipart; field: files; 1–5 images)
r.post("/", requireAuth, requirePerm("products:create"), imageUploadArray, ctrl.create);

// List / Get
r.get("/", requireAuth, requirePerm("products:list"), ctrl.list);
r.get("/:id", requireAuth, requirePerm("products:list"), ctrl.get);

// Update (multipart supported; files optional)
r.patch("/:id", requireAuth, requirePerm("products:update"), imageUploadArray, ctrl.update);

// Delete
r.delete("/:id", requireAuth, requirePerm("products:delete"), ctrl.remove);

export default r;
