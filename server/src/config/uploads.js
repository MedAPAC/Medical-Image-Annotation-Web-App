const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { UPLOADS_ROOT } = require("./constants");

const ensureDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const createUploadMiddleware = (uploadDir = UPLOADS_ROOT) => {
  ensureDirectory(uploadDir);

  const generalStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
      cb(null, `${base}-${timestamp}${ext}`);
    },
  });

  const taskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const taskId = req.params.taskId;
      const taskUploadDir = path.join(uploadDir, "tasks", taskId);
      ensureDirectory(taskUploadDir);
      cb(null, taskUploadDir);
    },
    filename: (req, file, cb) => {
      const originalName = file.originalname.toLowerCase();
      let extension = path.extname(originalName);

      if (originalName.endsWith(".nii.gz")) {
        extension = ".nii.gz";
      }
      if (originalName.endsWith(".nii")) {
        extension = ".nii";
      }

      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + extension);
    },
  });

  const taskUpload = multer({
    storage: taskStorage,
    limits: { fileSize: 1000 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = [".jpg", ".jpeg", ".png", ".nii", ".nii.gz", ".dcm", ".dicom"];
      const ext = path.extname(file.originalname).toLowerCase();

      if (file.originalname.toLowerCase().endsWith(".nii.gz") || allowed.includes(ext) || file.originalname.toLowerCase().endsWith(".nii")) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type"));
      }
    },
  });

  return {
    upload: multer({ storage: generalStorage }),
    taskUpload,
    uploadDir,
  };
};

module.exports = { createUploadMiddleware };