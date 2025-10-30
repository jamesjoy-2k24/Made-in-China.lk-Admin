import { Router } from "express";
import { uploadController } from "../controllers/upload.controller";
import { imageUploadSingle, imageUploadArray } from "../middleware/upload";
import { requireAuth } from "../middleware/auth";
import { requirePerm } from "../middleware/rbac";

const r = Router();

// Choose the permissions that fit your RBAC (you can switch to "catalog:create" etc.)
r.post(
  "/image",
  requireAuth,
  requirePerm("content:create"),
  imageUploadSingle,
  uploadController.image
);

r.post(
  "/images",
  requireAuth,
  requirePerm("content:create"),
  imageUploadArray,
  uploadController.images
);

r.delete(
  "/image",
  requireAuth,
  requirePerm("content:delete"),
  uploadController.remove
);

r.delete(
  "/images",
  requireAuth,
  requirePerm("content:delete"),
  uploadController.removeMany
);

export default r;
