import {
  ANNOTATION_SCHEMA_VERSION,
  normalizeClassificationForSave,
  toInternalSliceKey,
  toSavedSliceKey,
} from './annotationFormat';

test('stores slice indices as one-based keys', () => {
  expect(toSavedSliceKey(0)).toBe('1');
  expect(toSavedSliceKey(11)).toBe('12');
  expect(toInternalSliceKey('12', { sliceNumber: 12 })).toBe('11');
});

test('normalizes classification records for annotation export', () => {
  expect(normalizeClassificationForSave('positive')).toEqual({
    value: 'positive',
    scope: 'slice',
    schemaVersion: ANNOTATION_SCHEMA_VERSION,
  });
  expect(normalizeClassificationForSave(null)).toBeNull();
});
