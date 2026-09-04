import multer from "multer";

// Store uploaded image in memory
const storage = multer.memoryStorage();

export const upload = multer({
  storage,

  // Maximum image size: 1 MB
  limits: {
    fileSize: 1 * 1024 * 1024,
  },
});
