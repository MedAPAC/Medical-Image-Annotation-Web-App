import React, { useEffect, useRef, useState } from "react";
import cornerstone from "cornerstone-core";
import cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import dicomParser from "dicom-parser";

cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

/**
 * DicomViewer
 *
 * Treats the *entire* set of imageIds passed in as ONE volume/series
 * (all slices of one file/study), sorted by slice position. From that
 * volume it can render:
 *  - axial   : the native loaded slices, in order
 *  - coronal : a reformatted plane built from the volume
 *  - sagittal: a reformatted plane built from the volume
 *
 * FIX 1 (crash on slice change): previously `currentIndex` could be out
 * of range for the active stack for one render cycle after `viewType`
 * changed (the bounds-clamp effect ran *after* the image-load effect),
 * causing cornerstone.loadImage(undefined) to throw. Now the active
 * stack and a clamped index are derived together and the render effect
 * guards against any out-of-range / missing entries.
 *
 * FIX 2 (one file = one stack): instead of receiving separate
 * `imageStacks` per view type from the parent, this component builds
 * the volume itself from `imageIds` (all slices belonging to the
 * selected DICOM series) and derives axial/coronal/sagittal from it.
 */
function DicomViewer({
  imageIds = [],
  windowCenter = null,
  windowWidth = null,
  onSliceChange,
  width = 600,
  height = 600,
  currentSlice,
  setTotalSlices,
  viewType = "axial",
  isZoomMode = false,
}) {
  const element = useRef(null);
  const canvasRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(0);

  // The full 3D volume built from all axial slices of this series.
  const [volume, setVolume] = useState(null); // { data, rows, cols, numSlices, ... }
  const [volumeError, setVolumeError] = useState(null);
  const [loadingVolume, setLoadingVolume] = useState(false);

  const lastImageIdsRef = useRef(null);

  // -------------------------------------------------------------------
  // 1. Enable cornerstone on a hidden element (required for
  //    loadAndCacheImage's decode pipeline). The visible output is the
  //    canvas, rendered manually in step 5.
  // -------------------------------------------------------------------
  useEffect(() => {
    const el = element.current;
    if (el) cornerstone.enable(el);
    return () => {
      if (el) {
        try {
          cornerstone.disable(el);
        } catch (e) {
          // element may already be gone
        }
      }
    };
  }, []);

  // -------------------------------------------------------------------
  // 2. Build the volume whenever the imageIds (the file/series) change.
  //    All slices of the series are sorted (by ImagePositionPatient z,
  //    then InstanceNumber, then original order) and decoded into a
  //    single typed-array volume.
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!imageIds || imageIds.length === 0) {
      setVolume(null);
      setVolumeError(null);
      lastImageIdsRef.current = null;
      return;
    }

    const idsKey = imageIds.join("|");
    if (lastImageIdsRef.current === idsKey) {
      return; // already built for this exact set of slices
    }

    let cancelled = false;
    setLoadingVolume(true);
    setVolumeError(null);

    async function buildVolume() {
      try {
        const loaded = [];
        for (const imageId of imageIds) {
          try {
            const image = await cornerstone.loadAndCacheImage(imageId);
            loaded.push(image);
          } catch (e) {
            console.error("Failed to load DICOM slice:", imageId, e);
          }
        }

        if (cancelled) return;
        if (loaded.length === 0) {
          setVolumeError("No DICOM slices could be loaded.");
          setLoadingVolume(false);
          return;
        }

        // Sort slices into anatomical order (one "file" = one series)
        loaded.sort((a, b) => {
          const ipp = (img) => {
            const str = img.data?.string?.("x00200032"); // ImagePositionPatient
            if (!str) return null;
            const parts = str.split("\\").map(Number);
            return parts.length === 3 ? parts[2] : null; // z component
          };

          const instanceNum = (img) => {
            const v = img.data?.intString?.("x00200013"); // InstanceNumber
            return typeof v === "number" && !isNaN(v) ? v : null;
          };

          const za = ipp(a);
          const zb = ipp(b);
          if (za !== null && zb !== null && za !== zb) return za - zb;

          const ia = instanceNum(a);
          const ib = instanceNum(b);
          if (ia !== null && ib !== null && ia !== ib) return ia - ib;

          return 0;
        });

        const rows = loaded[0].rows;
        const cols = loaded[0].columns;
        const numSlices = loaded.length;

        const consistent = loaded.every(
          (img) => img.rows === rows && img.columns === cols
        );
        if (!consistent) {
          console.warn(
            "DICOM slices have inconsistent dimensions; slices that don't match the first slice's dimensions will be skipped."
          );
        }

        const data = new Float32Array(rows * cols * numSlices);

        loaded.forEach((img, z) => {
          if (img.rows !== rows || img.columns !== cols) return;
          const pixelData = img.getPixelData();
          const slope = img.slope ?? 1;
          const intercept = img.intercept ?? 0;
          const base = z * rows * cols;
          for (let i = 0; i < pixelData.length; i++) {
            data[base + i] = pixelData[i] * slope + intercept;
          }
        });

        // Pixel spacing (row spacing, column spacing) + slice spacing,
        // used to keep aspect ratios correct for reformatted planes.
        let rowSpacing = 1;
        let colSpacing = 1;
        let sliceSpacing = 1;
        try {
          const ps = loaded[0].data?.string?.("x00280030"); // PixelSpacing
          if (ps) {
            const [r, c] = ps.split("\\").map(Number);
            if (!isNaN(r)) rowSpacing = r;
            if (!isNaN(c)) colSpacing = c;
          }
          const thickness = loaded[0].data?.floatString?.("x00180050"); // SliceThickness
          if (thickness && !isNaN(thickness)) sliceSpacing = thickness;
        } catch (e) {
          // best-effort only
        }

        if (cancelled) return;

        setVolume({
          data,
          rows, // y dimension (height of an axial slice)
          cols, // x dimension (width of an axial slice)
          numSlices, // z dimension (number of axial slices)
          rowSpacing,
          colSpacing,
          sliceSpacing,
          firstImage: loaded[0],
        });
        lastImageIdsRef.current = idsKey;
        setLoadingVolume(false);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to build DICOM volume:", err);
          setVolumeError("Failed to load DICOM series.");
          setLoadingVolume(false);
        }
      }
    }

    buildVolume();

    return () => {
      cancelled = true;
    };
  }, [imageIds]);

  // -------------------------------------------------------------------
  // 3. Total slices for the current view type, derived from the volume.
  //    Reset currentIndex to a valid value whenever totals change so we
  //    never end up out of bounds (this fixes the crash on navigation).
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!volume) return;

    let total = 1;
    if (viewType === "axial") total = volume.numSlices;
    else if (viewType === "coronal") total = volume.rows;
    else if (viewType === "sagittal") total = volume.cols;

    if (setTotalSlices) setTotalSlices(total);

    setCurrentIndex((prev) => {
      if (prev >= total || prev < 0) {
        return Math.floor(total / 2);
      }
      return prev;
    });
  }, [volume, viewType, setTotalSlices]);

  // -------------------------------------------------------------------
  // 4. Sync external slice index (clamped to the current view's bounds).
  //
  // FIX (infinite loop / "Maximum update depth exceeded" crash):
  // setCurrentIndex here can trigger effect #(notify parent) below, which
  // calls onSliceChange -> parent's setCurrentSlice -> changes the
  // `currentSlice` prop -> re-runs this effect. If the clamped value ever
  // differs from `currentSlice` (e.g. switching viewType where the new
  // plane has fewer slices than the old `currentSlice` value), this
  // becomes an infinite ping-pong between parent and child state.
  //
  // We break the cycle by only pushing OUR clamped value back out via
  // onSliceChange when we actually had to clamp/correct it, and by never
  // calling setCurrentIndex when the prop already matches our state.
  // -------------------------------------------------------------------
  useEffect(() => {
    if (currentSlice === undefined || !volume) return;
    if (typeof currentSlice !== "number" || !Number.isFinite(currentSlice)) return;

    let total = 1;
    if (viewType === "axial") total = volume.numSlices;
    else if (viewType === "coronal") total = volume.rows;
    else if (viewType === "sagittal") total = volume.cols;

    const clamped = Math.min(Math.max(currentSlice, 0), Math.max(total - 1, 0));

    setCurrentIndex((prev) => (prev !== clamped ? clamped : prev));
  }, [currentSlice, volume, viewType]);

  // Notify parent of slice changes.
  // FIX: only notify when currentIndex actually differs from the prop the
  // parent gave us. Without this guard, every time the parent sets
  // currentSlice -> effect #4 sets currentIndex to the same value ->
  // this effect fires anyway -> calls setCurrentSlice in the parent ->
  // parent re-renders with the "same" value but a new object/reference,
  // re-triggering effect #4, etc. This is the infinite loop that crashes
  // the app ("Maximum update depth exceeded") when navigating slices.
  const lastNotifiedRef = useRef(undefined);
  useEffect(() => {
    if (volume && typeof currentSlice === "number" && Number.isFinite(currentSlice)) {
      let total = 1;
      if (viewType === "axial") total = volume.numSlices;
      else if (viewType === "coronal") total = volume.rows;
      else if (viewType === "sagittal") total = volume.cols;

      const clampedExternal = Math.min(
        Math.max(currentSlice, 0),
        Math.max(total - 1, 0)
      );

      if (clampedExternal !== currentIndex) return;
    }

    if (currentSlice === currentIndex) {
      lastNotifiedRef.current = currentIndex;
      return;
    }
    if (lastNotifiedRef.current === currentIndex) return;
    lastNotifiedRef.current = currentIndex;
    if (onSliceChange) onSliceChange(currentIndex);
  }, [currentIndex, currentSlice, onSliceChange, volume, viewType]);

  // -------------------------------------------------------------------
  // 5. Render the current slice (for any view type) to the canvas.
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!volume) return;

    const { data, rows, cols, numSlices, rowSpacing, colSpacing, sliceSpacing } = volume;

    let sliceW, sliceH, pixelAspect;
    let sliceData;

    // Clamp index defensively against the *current* view's bounds
    let maxIndex = 0;
    if (viewType === "axial") maxIndex = numSlices - 1;
    else if (viewType === "coronal") maxIndex = rows - 1;
    else if (viewType === "sagittal") maxIndex = cols - 1;
    const idx = Math.min(Math.max(currentIndex, 0), Math.max(maxIndex, 0));

    if (viewType === "axial") {
      // Native slice: width = cols, height = rows
      sliceW = cols;
      sliceH = rows;
      const start = idx * rows * cols;
      sliceData = data.subarray(start, start + rows * cols);
      pixelAspect = colSpacing / rowSpacing;
    } else if (viewType === "coronal") {
      // Fixed row (y = idx): width = cols, height = numSlices
      sliceW = cols;
      sliceH = numSlices;
      sliceData = new Float32Array(sliceW * sliceH);
      for (let z = 0; z < numSlices; z++) {
        for (let x = 0; x < cols; x++) {
          sliceData[z * cols + x] = data[z * rows * cols + idx * cols + x];
        }
      }
      pixelAspect = colSpacing / sliceSpacing;
    } else {
      // sagittal: Fixed column (x = idx): width = rows, height = numSlices
      sliceW = rows;
      sliceH = numSlices;
      sliceData = new Float32Array(sliceW * sliceH);
      for (let z = 0; z < numSlices; z++) {
        for (let y = 0; y < rows; y++) {
          sliceData[z * rows + y] = data[z * rows * cols + y * cols + idx];
        }
      }
      pixelAspect = rowSpacing / sliceSpacing;
    }

    if (sliceW <= 0 || sliceH <= 0) return;

    // Determine windowing
    let wc = windowCenter;
    let ww = windowWidth;
    if (wc == null || ww == null) {
      const firstImg = volume.firstImage;
      wc = wc ?? firstImg?.windowCenter ?? null;
      ww = ww ?? firstImg?.windowWidth ?? null;
    }
    if (wc == null || ww == null) {
      let min = Infinity;
      let max = -Infinity;
      for (let i = 0; i < sliceData.length; i++) {
        const v = sliceData[i];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      if (!isFinite(min) || !isFinite(max)) {
        min = 0;
        max = 1;
      }
      wc = wc ?? (min + max) / 2;
      ww = ww ?? Math.max(max - min, 1);
    }

    const lower = wc - ww / 2;
    const upper = wc + ww / 2;
    const range = Math.max(upper - lower, 1e-6);

    const normalized = new Uint8ClampedArray(sliceData.length);
    for (let i = 0; i < sliceData.length; i++) {
      const scaled = ((sliceData[i] - lower) / range) * 255;
      normalized[i] = Math.max(0, Math.min(255, scaled));
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const imageData = ctx.createImageData(sliceW, sliceH);
    for (let i = 0; i < normalized.length; i++) {
      const v = normalized[i];
      imageData.data[i * 4] = v;
      imageData.data[i * 4 + 1] = v;
      imageData.data[i * 4 + 2] = v;
      imageData.data[i * 4 + 3] = 255;
    }

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = sliceW;
    tempCanvas.height = sliceH;
    tempCanvas.getContext("2d").putImageData(imageData, 0, 0);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    // Effective aspect ratio accounting for pixel/slice spacing so
    // reformatted coronal/sagittal planes aren't squashed.
    const effectiveAspect = (sliceW * (pixelAspect || 1)) / sliceH;

    let drawW, drawH;
    if (effectiveAspect > width / height) {
      drawW = width;
      drawH = drawW / effectiveAspect;
    } else {
      drawH = height;
      drawW = drawH * effectiveAspect;
    }

    const dx = (width - drawW) / 2;
    const dy = (height - drawH) / 2;

    if (viewType === "axial") {
      ctx.drawImage(tempCanvas, dx, dy, drawW, drawH);
    } else {
      // Flip vertically so superior is up for coronal/sagittal
      ctx.save();
      ctx.translate(0, height);
      ctx.scale(1, -1);
      ctx.drawImage(tempCanvas, dx, height - (dy + drawH), drawW, drawH);
      ctx.restore();
    }
  }, [volume, currentIndex, viewType, windowCenter, windowWidth, width, height]);

  // -------------------------------------------------------------------
  // 6. Optional zoom-region drawing on the canvas (mirrors NiftiViewer's
  //    approach). MainViewer currently handles zoom via its own CSS
  //    transform and does not pass isZoomMode here, but this keeps
  //    behavior consistent if it ever does.
  // -------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isZoomMode) return;

    const handleMouseDown = () => {};
    const handleMouseUp = () => {};

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isZoomMode]);

  if (volumeError) {
    return (
      <div
        style={{
          width,
          height,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#f87171",
          fontSize: "14px",
          background: "#000",
          borderRadius: "8px",
          textAlign: "center",
          padding: "16px",
        }}
      >
        {volumeError}
      </div>
    );
  }

  if (loadingVolume || !volume) {
    return (
      <div
        style={{
          width,
          height,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#6b7280",
          fontSize: "14px",
          background: "#000",
          borderRadius: "8px",
        }}
      >
        Loading DICOM...
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#000",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      {/* Hidden element kept enabled for cornerstone's decode pipeline;
          the visible output is the canvas below. */}
      <div ref={element} style={{ display: "none" }} />
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          objectFit: "contain",
        }}
      />
    </div>
  );
}

export default DicomViewer;
