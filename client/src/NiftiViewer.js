import React, { useEffect, useRef, useState } from "react";
import * as nifti from "nifti-reader-js";

function NiftiViewer({
  url,
  windowCenter = null,
  windowWidth = null,
  onSliceChange,
  width = 600,
  height = 600,
  currentSlice: externalSlice,
  setTotalSlices,
  viewType = "axial",
  isZoomMode = false,
  zoomRegion = null,
  setZoomRegion = () => {},
  zoomLevel = 1,
  setZoomLevel = () => {},
}) {
  const [niftiHeader, setNiftiHeader] = useState(null);
  const [niftiImage, setNiftiImage] = useState(null);
  const [currentSlice, setCurrentSlice] = useState(0);
  const [defaultWC, setDefaultWC] = useState(null);
  const [defaultWW, setDefaultWW] = useState(null);
  const canvasRef = useRef(null);

  // -----------------------------------------------------------------------
  // Zoom-rectangle drawing (only relevant if isZoomMode is actually passed
  // in by the parent — MainViewer currently does its own CSS zoom instead).
  // FIX: previously the cleanup function for the event listeners was
  // returned from *inside* setTimeout's callback, so it was never invoked
  // by React — listeners piled up on every re-render. Now we attach
  // listeners synchronously and clean them up correctly.
  // -----------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isDrawing = false;
    let start = null;

    const handleMouseDown = (e) => {
      if (!isZoomMode) return;
      const rect = canvas.getBoundingClientRect();
      start = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      isDrawing = true;
    };

    const handleMouseMove = (e) => {
      if (!isDrawing || !isZoomMode) return;
      const rect = canvas.getBoundingClientRect();
      const current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const x = Math.min(start.x, current.x);
      const y = Math.min(start.y, current.y);
      const w = Math.abs(start.x - current.x);
      const h = Math.abs(start.y - current.y);

      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.clearRect(x, y, w, h);
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    };

    const handleMouseUp = (e) => {
      if (!isDrawing || !isZoomMode) return;
      isDrawing = false;
      const rect = canvas.getBoundingClientRect();
      const end = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const w = Math.abs(start.x - end.x);
      const h = Math.abs(start.y - end.y);

      if (w > 0 && h > 0) {
        setZoomRegion({ x, y, width: w, height: h });
        const zoomFactor = Math.min(canvas.width / w, canvas.height / h);
        setZoomLevel(zoomFactor);
      }
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isZoomMode, setZoomRegion, setZoomLevel]);

  // Sync slice index from parent
  useEffect(() => {
    if (externalSlice !== undefined && externalSlice !== currentSlice) {
      setCurrentSlice(externalSlice);
    }
  }, [externalSlice, currentSlice]);

  // Notify parent. Guarded against re-notifying the same value to avoid
  // a feedback loop with the parent's currentSlice state (see DicomViewer
  // for full explanation — same fix applied here).
  const lastNotifiedRef = useRef(undefined);
  useEffect(() => {
    if (typeof externalSlice === "number" && Number.isFinite(externalSlice) && niftiHeader) {
      const dims = niftiHeader.dims;
      let total = 1;
      if (viewType === "axial") total = dims[3] || 1;
      if (viewType === "coronal") total = dims[2] || 1;
      if (viewType === "sagittal") total = dims[1] || 1;

      const clampedExternal = Math.min(
        Math.max(externalSlice, 0),
        Math.max(total - 1, 0)
      );

      if (clampedExternal !== currentSlice) return;
    }

    if (externalSlice === currentSlice) {
      lastNotifiedRef.current = currentSlice;
      return;
    }
    if (lastNotifiedRef.current === currentSlice) return;
    lastNotifiedRef.current = currentSlice;
    if (onSliceChange) onSliceChange(currentSlice);
  }, [currentSlice, externalSlice, onSliceChange, niftiHeader, viewType]);

  // Load NIfTI file once (and reset state when the file changes)
  useEffect(() => {
    let cancelled = false;

    async function loadNifti() {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const dataBuffer = nifti.isCompressed(arrayBuffer)
          ? nifti.decompress(arrayBuffer)
          : arrayBuffer;

        if (nifti.isNIFTI(dataBuffer)) {
          const header = nifti.readHeader(dataBuffer);
          const image = nifti.readImage(header, dataBuffer);
          if (cancelled) return;
          setNiftiHeader(header);
          setNiftiImage(image);
          setCurrentSlice(0);
          // Reset window defaults so they're recomputed for the new volume
          setDefaultWC(null);
          setDefaultWW(null);
        } else {
          console.error("Invalid NIfTI file format.");
        }
      } catch (err) {
        console.error("Failed to load NIfTI:", err);
      }
    }

    setNiftiHeader(null);
    setNiftiImage(null);
    loadNifti();

    return () => {
      cancelled = true;
    };
  }, [url]);

  // Update total slices when header or viewType changes, and clamp the
  // current slice index so switching plane never points out of bounds.
  useEffect(() => {
    if (!niftiHeader) return;
    const dims = niftiHeader.dims;
    let total = 1;
    if (viewType === "axial") total = dims[3] || 1;
    if (viewType === "coronal") total = dims[2] || 1;
    if (viewType === "sagittal") total = dims[1] || 1;

    if (setTotalSlices) setTotalSlices(total);

    setCurrentSlice((prev) => {
      const mid = Math.floor(total / 2);
      if (prev >= total) return mid;
      return prev;
    });
  }, [niftiHeader, viewType, setTotalSlices]);

  // Draw selected slice
  useEffect(() => {
    if (!niftiHeader || !niftiImage) return;

    const dims = niftiHeader.dims; // [ndim, x, y, z, ...]
    const nx = dims[1];
    const ny = dims[2];
    const nz = dims[3];

    let volume;
    switch (niftiHeader.datatypeCode) {
      case nifti.NIFTI1.TYPE_UINT8:
        volume = new Uint8Array(niftiImage);
        break;
      case nifti.NIFTI1.TYPE_INT16:
        volume = new Int16Array(niftiImage);
        break;
      case nifti.NIFTI1.TYPE_INT32:
        volume = new Int32Array(niftiImage);
        break;
      case nifti.NIFTI1.TYPE_FLOAT32:
        volume = new Float32Array(niftiImage);
        break;
      case nifti.NIFTI1.TYPE_FLOAT64:
        volume = new Float64Array(niftiImage);
        break;
      case nifti.NIFTI1.TYPE_UINT16:
        volume = new Uint16Array(niftiImage);
        break;
      default:
        console.warn("Unsupported NIfTI datatype:", niftiHeader.datatypeCode);
        return;
    }

    // Clamp slice index defensively (volume bounds depend on viewType)
    let maxSlice = 0;
    if (viewType === "axial") maxSlice = nz - 1;
    else if (viewType === "coronal") maxSlice = ny - 1;
    else if (viewType === "sagittal") maxSlice = nx - 1;
    const slice = Math.min(Math.max(currentSlice, 0), Math.max(maxSlice, 0));

    // Extract slice depending on viewType.
    // NIfTI memory layout is column-major: index = x + y*nx + z*nx*ny
    let sliceW, sliceH;
    let sliceData; // typed array for axial fast-path, Float64Array otherwise

    if (viewType === "axial") {
      // Fixed z = slice -> width = nx, height = ny
      sliceW = nx;
      sliceH = ny;
      const start = slice * nx * ny;
      sliceData = volume.subarray(start, start + nx * ny);
    } else if (viewType === "coronal") {
      // Fixed y = slice -> width = nx, height = nz
      sliceW = nx;
      sliceH = nz;
      sliceData = new Float64Array(sliceW * sliceH);
      for (let z = 0; z < nz; z++) {
        for (let x = 0; x < nx; x++) {
          sliceData[z * nx + x] = volume[x + slice * nx + z * nx * ny];
        }
      }
    } else {
      // sagittal: Fixed x = slice -> width = ny, height = nz
      sliceW = ny;
      sliceH = nz;
      sliceData = new Float64Array(sliceW * sliceH);
      for (let z = 0; z < nz; z++) {
        for (let y = 0; y < ny; y++) {
          sliceData[z * ny + y] = volume[slice + y * nx + z * nx * ny];
        }
      }
    }

    // Min/max without spreading (avoids stack overflow on large slices)
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

    if (defaultWC === null || defaultWW === null) {
      setDefaultWC((min + max) / 2);
      setDefaultWW(Math.max(max - min, 1));
    }

    const wc = windowCenter ?? defaultWC ?? (min + max) / 2;
    const ww = windowWidth ?? defaultWW ?? Math.max(max - min, 1);
    const lower = wc - ww / 2;
    const upper = wc + ww / 2;
    const range = Math.max(upper - lower, 1e-6);

    const normalized = new Uint8ClampedArray(sliceData.length);
    for (let i = 0; i < sliceData.length; i++) {
      const val = sliceData[i];
      const scaled = ((val - lower) / range) * 255;
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
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.putImageData(imageData, 0, 0);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    // Maintain aspect ratio. Coronal/sagittal slices are typically
    // rendered "head up" by flipping the canvas vertically (NIfTI's
    // y-axis for these planes points the opposite way from screen-down).
    const aspect = sliceW / sliceH;
    let drawW = width;
    let drawH = height;
    if (aspect > 1) drawH = height / aspect;
    else drawW = width * aspect;

    const dx = (width - drawW) / 2;
    const dy = (height - drawH) / 2;

    if (viewType === "axial") {
      ctx.drawImage(tempCanvas, dx, dy, drawW, drawH);
    } else {
      // Flip vertically for coronal/sagittal so superior is up
      ctx.save();
      ctx.translate(0, height);
      ctx.scale(1, -1);
      ctx.drawImage(tempCanvas, dx, height - (dy + drawH), drawW, drawH);
      ctx.restore();
    }
  }, [
    niftiHeader,
    niftiImage,
    currentSlice,
    windowCenter,
    windowWidth,
    defaultWC,
    defaultWW,
    width,
    height,
    viewType,
  ]);

  if (!niftiHeader) {
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
        Loading NIfTI...
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

export default NiftiViewer;
