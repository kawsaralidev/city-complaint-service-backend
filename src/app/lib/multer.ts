import multer from "multer";

// Store uploaded files in memory
const storage = multer.memoryStorage();

// Allow only common image MIME types
const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

export const upload = multer({
  storage,

  // Maximum file size: 1 MB
  limits: {
    fileSize: 1 * 1024 * 1024,
  },

  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed."));
      return;
    }

    cb(null, true);
  },
});
