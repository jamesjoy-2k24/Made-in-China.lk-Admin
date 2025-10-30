// routes/catalog.routes.ts
import { Router } from "express";
import { catalogController } from "../controllers/catalog.controller";
import { requireAuth } from "../middleware/auth";
import { requirePerm } from "../middleware/rbac";
import { imageUploadSingle } from "../middleware/upload";

const r = Router();

// -------- Categories (JSON) --------
r.get("/categories", requireAuth, requirePerm("catalog:list"), catalogController.listCategories);
r.get("/categories/:id", requireAuth, requirePerm("catalog:list"), catalogController.getCategory);
r.post("/categories", requireAuth, requirePerm("catalog:create"), catalogController.createCategory);
r.patch("/categories/:id", requireAuth, requirePerm("catalog:update"), catalogController.updateCategory);
r.delete("/categories/:id", requireAuth, requirePerm("catalog:delete"), catalogController.deleteCategory);

// -------- Categories (multipart with file) --------
r.post(
  "/categories/upload",
  requireAuth,
  requirePerm("catalog:create"),
  imageUploadSingle,
  catalogController.createCategoryWithUpload
);

r.patch(
  "/categories/:id/upload",
  requireAuth,
  requirePerm("catalog:update"),
  imageUploadSingle,
  catalogController.updateCategoryWithUpload
);

// -------- Brands (JSON) --------
r.get("/brands", requireAuth, requirePerm("catalog:list"), catalogController.listBrands);
r.get("/brands/:id", requireAuth, requirePerm("catalog:list"), catalogController.getBrand);
r.post("/brands", requireAuth, requirePerm("catalog:create"), catalogController.createBrand);
r.patch("/brands/:id", requireAuth, requirePerm("catalog:update"), catalogController.updateBrand);
r.delete("/brands/:id", requireAuth, requirePerm("catalog:delete"), catalogController.deleteBrand);

// -------- Brands (multipart with file) --------
r.post(
  "/brands/upload",
  requireAuth,
  requirePerm("catalog:create"),
  imageUploadSingle,
  catalogController.createBrandWithUpload
);

r.patch(
  "/brands/:id/upload",
  requireAuth,
  requirePerm("catalog:update"),
  imageUploadSingle,
  catalogController.updateBrandWithUpload
);

export default r;
