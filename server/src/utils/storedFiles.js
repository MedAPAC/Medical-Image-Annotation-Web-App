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

const validateMedicalFileSignature = async (filePath, originalName) => {
  const handle = await fs.promises.open(filePath, 'r');
  try {
    const header = Buffer.alloc(560);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    const bytes = header.subarray(0, bytesRead);
    const lowerName = String(originalName || '').toLowerCase();

    const isExecutable = (
      (bytes[0] === 0x4d && bytes[1] === 0x5a) ||
      (bytes[0] === 0x7f && bytes.subarray(1, 4).toString('ascii') === 'ELF')
    );
    if (isExecutable) throw new Error('Executable content is not accepted as a medical image.');

    if (lowerName.endsWith('.png')) {
      const pngSignature = '89504e470d0a1a0a';
      if (bytes.subarray(0, 8).toString('hex') !== pngSignature) throw new Error('Invalid PNG file signature.');
    } else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
      if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
        throw new Error('Invalid JPEG file signature.');
      }
    } else if (lowerName.endsWith('.nii.gz')) {
      if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) throw new Error('Invalid compressed NIfTI signature.');
    } else if (lowerName.endsWith('.nii')) {
      const littleEndianSize = bytes.length >= 4 ? bytes.readInt32LE(0) : 0;
      const bigEndianSize = bytes.length >= 4 ? bytes.readInt32BE(0) : 0;
      if (![348, 540].includes(littleEndianSize) && ![348, 540].includes(bigEndianSize)) {
        throw new Error('Invalid NIfTI header.');
      }
    }
    return true;
  } finally {
    await handle.close();
  }
};

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
  validateMedicalFileSignature,
  getSafeContentType,
  sanitizeDownloadName,
  toPublicFile,
  toPublicTask,
};
