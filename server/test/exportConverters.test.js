const { test } = require('node:test');
const assert = require('node:assert');
const {
  convertToYolo,
  convertToCoco,
  convertToPascalVoc,
  parseCustomTemplate
} = require('../src/utils/exportConverters');

const mockLabelOptions = [
  { id: '1', name: 'GGO' },
  { id: '2', name: 'Consolidation' }
];

const mockAnnotations = [
  {
    label: 'GGO',
    points: [
      { x: 100, y: 150 },
      { x: 200, y: 150 },
      { x: 200, y: 250 },
      { x: 100, y: 250 }
    ]
  },
  {
    label: 'Consolidation',
    points: [
      { x: 50, y: 60 },
      { x: 150, y: 60 },
      { x: 150, y: 160 },
      { x: 50, y: 160 }
    ]
  }
];

test('convertToYolo - normalizes coordinates and maps labels', () => {
  const result = convertToYolo(mockAnnotations, mockLabelOptions, 500, 500);
  const lines = result.trim().split('\n');
  assert.equal(lines.length, 2);

  // Line 1: class 0, center_x = (100+200)/2/500 = 0.3, center_y = (150+250)/2/500 = 0.4, w = 100/500 = 0.2, h = 100/500 = 0.2
  assert.equal(lines[0], '0 0.300000 0.400000 0.200000 0.200000');
  // Line 2: class 1, center_x = (50+150)/2/500 = 0.2, center_y = (60+160)/2/500 = 0.22, w = 100/500 = 0.2, h = 100/500 = 0.2
  assert.equal(lines[1], '1 0.200000 0.220000 0.200000 0.200000');
});

test('convertToCoco - formats valid COCO dataset JSON', () => {
  const mockImages = [{ id: 'img-1', filename: 'scan1.png', width: 500, height: 500 }];
  const result = convertToCoco(
    [{ ...mockAnnotations[0], imageId: 'img-1', id: 'ann-1' }],
    mockLabelOptions,
    mockImages
  );

  assert.equal(result.categories.length, 2);
  assert.equal(result.categories[0].name, 'GGO');
  assert.equal(result.images.length, 1);
  assert.equal(result.images[0].file_name, 'scan1.png');
  assert.equal(result.annotations.length, 1);
  assert.equal(result.annotations[0].image_id, 'img-1');
  // COCO bbox format: [x_min, y_min, width, height]
  assert.deepEqual(result.annotations[0].bbox, [100, 150, 100, 100]);
});

test('convertToPascalVoc - compiles correct XML structure', () => {
  const result = convertToPascalVoc(mockAnnotations, 500, 500, 'scan1.png');
  assert.match(result, /<filename>scan1\.png<\/filename>/);
  assert.match(result, /<width>500<\/width>/);
  assert.match(result, /<name>GGO<\/name>/);
  assert.match(result, /<xmin>100<\/xmin>/);
  assert.match(result, /<ymin>150<\/ymin>/);
  assert.match(result, /<xmax>200<\/xmax>/);
  assert.match(result, /<ymax>250<\/ymax>/);
});

test('parseCustomTemplate - replaces template placeholders dynamically', () => {
  const template = 'File: {{filename}}, Annotation: {{label}} ({{x_min}},{{y_min}}) to ({{x_max}},{{y_max}}) size: {{width}}x{{height}}';
  const annotation = mockAnnotations[0];
  const imageMetadata = { filename: 'scan1.png', width: 500, height: 500 };

  const result = parseCustomTemplate(template, annotation, imageMetadata);
  assert.equal(result, 'File: scan1.png, Annotation: GGO (100,150) to (200,250) size: 100x100');
});
