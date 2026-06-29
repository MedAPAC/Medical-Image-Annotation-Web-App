const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const {
  UPLOADS_ROOT,
  MAX_UPLOAD_FILE_BYTES,
  MAX_UPLOAD_FILES,
} = require('./constants');

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.nii', '.nii.gz', '.dcm', '.dicom']);

const ensureDirectory = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const getValidatedExtension = (originalName) => {
  const safeName = path.basename(String(originalName || '')).toLowerCase();
  if (!safeName || safeName.length > 255 || safeName.includes('\0')) return null;
  const extension = safeName.endsWith('.nii.gz') ? '.nii.gz' : path.extname(safeName);
  return ALLOWED_EXTENSIONS.has(extension) ? extension : null;
};

const fileFilter = (req, file, callback) => {
  if (!getValidatedExtension(file.originalname)) {
    const error = new Error('Invalid file type. Supported formats are DICOM, NIfTI, JPEG, and PNG.');
    error.status = 400;
    callback(error);
    return;
  }
  callback(null, true);
};

const commonLimits = {
  fileSize: MAX_UPLOAD_FILE_BYTES,
  files: MAX_UPLOAD_FILES,
  fields: 10,
  parts: MAX_UPLOAD_FILES + 10,
  fieldNameSize: 100,
  fieldSize: 64 * 1024,
};

const createUploadMiddleware = (uploadDir = UPLOADS_ROOT) => {
  ensureDirectory(uploadDir);

  const generalStorage = multer.diskStorage({
    destination: (req, file, callback) => callback(null, uploadDir),
    filename: (req, file, callback) => {
      const extension = getValidatedExtension(file.originalname);
      callback(null, `${crypto.randomUUID()}${extension || ''}`);
    },
  });

  const taskStorage = multer.diskStorage({
    destination: (req, file, callback) => {
      const taskUploadDir = path.resolve(uploadDir, 'tasks', String(req.params.taskId));
      ensureDirectory(taskUploadDir);
      callback(null, taskUploadDir);
    },
    filename: (req, file, callback) => {
      const extension = getValidatedExtension(file.originalname);
      callback(null, `${crypto.randomUUID()}${extension || ''}`);
    },
  });

  return {
    upload: multer({ storage: generalStorage, limits: commonLimits, fileFilter }),
    taskUpload: multer({ storage: taskStorage, limits: commonLimits, fileFilter }),
    uploadDir,
  };
};

module.exports = { createUploadMiddleware, getValidatedExtension };
