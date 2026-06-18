export const ANNOTATION_SCHEMA_VERSION = "medical-image-annotation.v1";
export const SAVED_SLICE_INDEX_BASE = 1;

export const toSavedSliceNumber = (internalSliceIndex) => {
  const numeric = Number(internalSliceIndex);
  if (!Number.isFinite(numeric)) return 1;
  return Math.max(Math.round(numeric) + SAVED_SLICE_INDEX_BASE, 1);
};

export const toSavedSliceKey = (internalSliceIndex) => String(toSavedSliceNumber(internalSliceIndex));

export const toInternalSliceKey = (savedSliceKey, savedSliceData) => {
  const explicitSliceNumber = Number(
    savedSliceData?.sliceNumber ?? savedSliceData?.metadata?.sliceNumber
  );

  if (Number.isFinite(explicitSliceNumber) && explicitSliceNumber >= 1) {
    return String(Math.round(explicitSliceNumber) - SAVED_SLICE_INDEX_BASE);
  }

  return String(savedSliceKey);
};

export const normalizeClassificationForState = (classification) => {
  if (!classification) return null;
  if (typeof classification === "string") return classification;
  if (typeof classification === "object") {
    return classification.value || classification.label || classification.classification || null;
  }
  return null;
};

export const normalizeClassificationForSave = (classification) => {
  const value = normalizeClassificationForState(classification);
  if (!value) return null;

  return {
    value,
    scope: "slice",
    schemaVersion: ANNOTATION_SCHEMA_VERSION,
  };
};
