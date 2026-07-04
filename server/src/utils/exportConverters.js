/**
 * Dataset format converters for exporting annotations.
 */

/**
 * Computes bounding box coordinates [xmin, ymin, xmax, ymax] from annotation points.
 */
function getBoundingBox(points) {
  if (!points || points.length === 0) {
    return { xmin: 0, ymin: 0, xmax: 0, ymax: 0 };
  }
  let xmin = points[0].x;
  let xmax = points[0].x;
  let ymin = points[0].y;
  let ymax = points[0].y;

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (p.x < xmin) xmin = p.x;
    if (p.x > xmax) xmax = p.x;
    if (p.y < ymin) ymin = p.y;
    if (p.y > ymax) ymax = p.y;
  }

  return { xmin, ymin, xmax, ymax };
}

/**
 * Converts annotations to YOLO format: class_id x_center y_center width height (normalized)
 */
function convertToYolo(annotations, labelOptions, imageWidth, imageHeight) {
  return annotations.map(ann => {
    const classId = labelOptions.findIndex(opt => opt.name === ann.label);
    const resolvedClassId = classId >= 0 ? classId : 0;
    const { xmin, ymin, xmax, ymax } = getBoundingBox(ann.points);

    const w = (xmax - xmin) / imageWidth;
    const h = (ymax - ymin) / imageHeight;
    const cx = (xmin + xmax) / 2 / imageWidth;
    const cy = (ymin + ymax) / 2 / imageHeight;

    return `${resolvedClassId} ${cx.toFixed(6)} ${cy.toFixed(6)} ${w.toFixed(6)} ${h.toFixed(6)}`;
  }).join('\n');
}

/**
 * Converts annotations to COCO format dataset object.
 */
function convertToCoco(annotations, labelOptions, imagesList) {
  const categories = labelOptions.map((opt, idx) => ({
    id: idx,
    name: opt.name,
    supercategory: 'none'
  }));

  const images = imagesList.map(img => ({
    id: img.id,
    file_name: img.filename,
    width: img.width || 0,
    height: img.height || 0
  }));

  const cocoAnnotations = annotations.map((ann, idx) => {
    const classId = labelOptions.findIndex(opt => opt.name === ann.label);
    const resolvedClassId = classId >= 0 ? classId : 0;
    const { xmin, ymin, xmax, ymax } = getBoundingBox(ann.points);
    const w = xmax - xmin;
    const h = ymax - ymin;

    const segmentation = [];
    if (ann.points) {
      const flattened = [];
      ann.points.forEach(p => {
        flattened.push(p.x);
        flattened.push(p.y);
      });
      segmentation.push(flattened);
    }

    return {
      id: ann.id || `ann-${idx}`,
      image_id: ann.imageId,
      category_id: resolvedClassId,
      segmentation,
      area: w * h,
      bbox: [xmin, ymin, w, h],
      iscrowd: 0
    };
  });

  return {
    info: {
      description: 'MediAnnotate Exported Dataset',
      version: '1.0',
      year: new Date().getFullYear(),
      date_created: new Date().toISOString()
    },
    licenses: [],
    images,
    annotations: cocoAnnotations,
    categories
  };
}

/**
 * Converts annotations to Pascal VOC XML string.
 */
function convertToPascalVoc(annotations, imageWidth, imageHeight, filename) {
  let xml = `<?xml version="1.0"?>\n<annotation>\n`;
  xml += `  <folder>images</folder>\n`;
  xml += `  <filename>${filename}</filename>\n`;
  xml += `  <size>\n`;
  xml += `    <width>${imageWidth}</width>\n`;
  xml += `    <height>${imageHeight}</height>\n`;
  xml += `    <depth>3</depth>\n`;
  xml += `  </size>\n`;

  annotations.forEach(ann => {
    const { xmin, ymin, xmax, ymax } = getBoundingBox(ann.points);
    xml += `  <object>\n`;
    xml += `    <name>${ann.label}</name>\n`;
    xml += `    <pose>Unspecified</pose>\n`;
    xml += `    <truncated>0</truncated>\n`;
    xml += `    <difficult>0</difficult>\n`;
    xml += `    <bndbox>\n`;
    xml += `      <xmin>${Math.round(xmin)}</xmin>\n`;
    xml += `      <ymin>${Math.round(ymin)}</ymin>\n`;
    xml += `      <xmax>${Math.round(xmax)}</xmax>\n`;
    xml += `      <ymax>${Math.round(ymax)}</ymax>\n`;
    xml += `    </bndbox>\n`;
    xml += `  </object>\n`;
  });

  xml += `</annotation>`;
  return xml;
}

/**
 * Parses a custom template replace dynamic placeholder tokens.
 */
function parseCustomTemplate(templateString, annotation, imageMetadata) {
  const { xmin, ymin, xmax, ymax } = getBoundingBox(annotation.points);
  const w = xmax - xmin;
  const h = ymax - ymin;

  const replacements = {
    filename: imageMetadata.filename || '',
    label: annotation.label || '',
    x_min: xmin,
    y_min: ymin,
    x_max: xmax,
    y_max: ymax,
    width: w,
    height: h,
    image_width: imageMetadata.width || 0,
    image_height: imageMetadata.height || 0
  };

  let output = templateString;
  Object.entries(replacements).forEach(([key, val]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    output = output.replace(regex, val);
  });

  return output;
}

module.exports = {
  convertToYolo,
  convertToCoco,
  convertToPascalVoc,
  parseCustomTemplate
};
