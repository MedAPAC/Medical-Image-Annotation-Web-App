function getFileType(filename) {
  const lowerName = filename.toLowerCase();

  if (lowerName.endsWith(".dcm") || lowerName.endsWith(".dicom")) return "dicom";
  if (lowerName.endsWith(".nii") || lowerName.endsWith(".nii.gz")) return "nifti";
  if (
    lowerName.endsWith(".jpg") ||
    lowerName.endsWith(".jpeg") ||
    lowerName.endsWith(".png") ||
    lowerName.endsWith(".gif") ||
    lowerName.endsWith(".bmp") ||
    lowerName.endsWith(".tiff") ||
    lowerName.endsWith(".tif")
  ) return "image";

  return "other";
}

module.exports = { getFileType };