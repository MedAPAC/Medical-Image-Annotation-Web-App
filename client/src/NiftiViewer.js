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
  viewType = "axial", // ✅ NEW
}) {
  const [niftiHeader, setNiftiHeader] = useState(null);
  const [niftiImage, setNiftiImage] = useState(null);
  const [currentSlice, setCurrentSlice] = useState(0);
  const [defaultWC, setDefaultWC] = useState(null);
  const [defaultWW, setDefaultWW] = useState(null);
  const canvasRef = useRef(null);

  // Sync slice index from parent
  useEffect(() => {
    if (externalSlice !== undefined && externalSlice !== currentSlice) {
      setCurrentSlice(externalSlice);
    }
  }, [externalSlice, currentSlice]);

  // Notify parent
  useEffect(() => {
    if (onSliceChange) onSliceChange(currentSlice);
  }, [currentSlice, onSliceChange]);

  // Load NIfTI file once
  useEffect(() => {
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
          setNiftiHeader(header);
          setNiftiImage(image);
          setCurrentSlice(0);
        } else {
          console.error("Invalid NIfTI file format.");
        }
      } catch (err) {
        console.error("Failed to load NIfTI:", err);
      }
    }
    loadNifti();
  }, [url]);

  // ✅ Update total slices when header or viewType changes
  useEffect(() => {
    if (!niftiHeader) return;
    const dims = niftiHeader.dims;
    let total = 1;
    if (viewType === "axial") total = dims[3] || 1;
    if (viewType === "coronal") total = dims[2] || 1;
    if (viewType === "sagittal") total = dims[1] || 1;
    if (setTotalSlices) setTotalSlices(total);
  }, [niftiHeader, viewType, setTotalSlices]);

  // ✅ Draw selected slice
  useEffect(() => {
    if (!niftiHeader || !niftiImage) return;

    const dims = niftiHeader.dims; // [dim, x, y, z]
    const nx = dims[1];
    const ny = dims[2];
    const nz = dims[3];
    const totalVoxels = nx * ny * nz;

    let volume;
    switch (niftiHeader.datatypeCode) {
      case nifti.NIFTI1.TYPE_UINT8:
        volume = new Uint8Array(niftiImage);
        break;
      case nifti.NIFTI1.TYPE_INT16:
        volume = new Int16Array(niftiImage);
        break;
      case nifti.NIFTI1.TYPE_FLOAT32:
        volume = new Float32Array(niftiImage);
        break;
      default:
        console.warn("Unsupported NIfTI datatype");
        return;
    }

    // ✅ Extract slice depending on viewType
    let sliceData, sliceW, sliceH;
    if (viewType === "axial") {
      sliceW = nx;
      sliceH = ny;
      const start = currentSlice * sliceW * sliceH;
      sliceData = volume.slice(start, start + sliceW * sliceH);
    } else if (viewType === "coronal") {
      sliceW = nx;
      sliceH = nz;
      sliceData = new Array(sliceW * sliceH);
      for (let z = 0; z < nz; z++) {
        for (let x = 0; x < nx; x++) {
          sliceData[z * nx + x] = volume[z * nx * ny + currentSlice * nx + x];
        }
      }
    } else if (viewType === "sagittal") {
      sliceW = ny;
      sliceH = nz;
      sliceData = new Array(sliceW * sliceH);
      for (let z = 0; z < nz; z++) {
        for (let y = 0; y < ny; y++) {
          sliceData[z * ny + y] =
            volume[z * nx * ny + y * nx + currentSlice];
        }
      }
    }

    const min = Math.min(...sliceData);
    const max = Math.max(...sliceData);

    if (defaultWC === null || defaultWW === null) {
      setDefaultWC((min + max) / 2);
      setDefaultWW(max - min);
    }

    const wc = windowCenter ?? (min + max) / 2;
    const ww = windowWidth ?? max - min;
    const lower = wc - ww / 2;
    const upper = wc + ww / 2;

    const normalized = new Uint8ClampedArray(sliceData.length);
    for (let i = 0; i < sliceData.length; i++) {
      const val = sliceData[i];
      const scaled = ((val - lower) / (upper - lower)) * 255;
      normalized[i] = Math.max(0, Math.min(255, scaled));
    }

    const canvas = canvasRef.current;
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

    // Maintain aspect ratio
    const aspect = sliceW / sliceH;
    let drawW = width;
    let drawH = height;
    if (aspect > 1) drawH = height / aspect;
    else drawW = width * aspect;

    const dx = (width - drawW) / 2;
    const dy = (height - drawH) / 2;
    ctx.drawImage(tempCanvas, dx, dy, drawW, drawH);
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
