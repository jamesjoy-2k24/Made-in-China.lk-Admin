import multer from "multer";

// Memory storage: files are kept in RAM and then pushed to Firebase Storage
const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (file.mimetype.startsWith("image/")) return cb(null, true);
  cb(new Error("Only image uploads are allowed"));
};

export const uploader = multer({
  storage,
  fileFilter,
  limits: {
    // Per-file max (tune as you like)
    fileSize: 8 * 1024 * 1024, // 8MB
  },
});

// Single image: field name = "file"
export const imageUploadSingle = uploader.single("file");

// Multi image: field name = "files", up to 5 files
export const imageUploadArray = uploader.array("files", 5);
