const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CONTENT_TYPES = new Map([
  ['.dcm', 'application/dicom'],
  ['.dicom', 'application/dicom'],
  ['.nii', 'application/octet-stream'],
  ['.gz', 'application/gzip'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
]);

const isPathInside = (candidate, parent) => (
  candidate === parent || candidate.startsWith(`${parent}${path.sep}`)
);

const resolveTaskFilePath = (uploadsRoot, taskId, file) => {
  const taskRoot = path.resolve(uploadsRoot, 'tasks', String(taskId));
  const candidate = path.resolve(file.path || path.join(taskRoot, file.filename || ''));
  if (!file.filename || !isPathInside(candidate, taskRoot)) {
    const error = new Error('Stored file path is invalid.');
    error.status = 400;
    throw error;
  }
  return candidate;
};

const hashFile = (filePath) => new Promise((resolve, reject) => {
  const hash = crypto.createHash('sha256');
  const stream = fs.createReadStream(filePath);
  stream.on('error', reject);
  stream.on('data', (chunk) => hash.update(chunk));
  stream.on('end', () => resolve(hash.digest('hex')));
});

const getSafeContentType = (filename) => {
  const lowerName = String(filename || '').toLowerCase();
  if (lowerName.endsWith('.nii.gz')) return 'application/gzip';
  return CONTENT_TYPES.get(path.extname(lowerName)) || 'application/octet-stream';
};

const sanitizeDownloadName = (filename) => path.basename(String(filename || 'medical-image'))
  .replace(/[\r\n\0\x22]/g, '_')
  .slice(0, 200) || 'medical-image';

const toPublicFile = (file) => {
  if (!file || typeof file !== 'object') return file;
  const { path: storedPath, ...publicFile } = file;
  return publicFile;
};

const toPublicTask = (task) => {
  if (!task || typeof task !== 'object') return task;
  return {
    ...task,
    files: Array.isArray(task.files) ? task.files.map(toPublicFile) : [],
  };
};

module.exports = {
  resolveTaskFilePath,
  hashFile,
  getSafeContentType,
  sanitizeDownloadName,
  toPublicFile,
  toPublicTask,
};
