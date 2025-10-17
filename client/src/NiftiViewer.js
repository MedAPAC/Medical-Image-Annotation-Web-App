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
}) {
  const [niftiHeader, setNiftiHeader] = useState(null);
  const [niftiImage, setNiftiImage] = useState(null);
  const [currentSlice, setCurrentSlice] = useState(0);
  const [defaultWC, setDefaultWC] = useState(null);
  const [defaultWW, setDefaultWW] = useState(null);
  const canvasRef = useRef(null);

  // Sync external slice index from parent
  useEffect(() => {
    if (externalSlice !== undefined && externalSlice !== currentSlice) {
      setCurrentSlice(externalSlice);
    }
  }, [externalSlice, currentSlice]);

  // Notify parent when slice changes
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

          if (setTotalSlices) setTotalSlices(header.dims?.[3] || 1);
        } else {
          console.error("Invalid NIfTI file format.");
        }
      } catch (err) {
        console.error("Failed to load NIfTI:", err);
      }
    }

    loadNifti();
  }, [url, setTotalSlices]);

  // Render a slice to canvas
  useEffect(() => {
    if (!niftiHeader || !niftiImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const w = niftiHeader.dims[1];
    const h = niftiHeader.dims[2];
    const d = niftiHeader.dims[3];
    if (currentSlice >= d) return;

    const sliceSize = w * h;
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

    const slice = volume.slice(currentSlice * sliceSize, (currentSlice + 1) * sliceSize);
    const min = Math.min(...slice);
    const max = Math.max(...slice);

    if (defaultWC === null || defaultWW === null) {
      setDefaultWC((min + max) / 2);
      setDefaultWW(max - min);
    }

    const wc = windowCenter ?? (min + max) / 2;
    const ww = windowWidth ?? max - min;

    const lower = wc - ww / 2;
    const upper = wc + ww / 2;

    const normalized = new Uint8ClampedArray(slice.length);
    for (let i = 0; i < slice.length; i++) {
      const val = slice[i];
      const scaled = ((val - lower) / (upper - lower)) * 255;
      normalized[i] = Math.max(0, Math.min(255, scaled));
    }

    const imageData = ctx.createImageData(w, h);
    for (let i = 0; i < normalized.length; i++) {
      const v = normalized[i];
      imageData.data[i * 4] = v;
      imageData.data[i * 4 + 1] = v;
      imageData.data[i * 4 + 2] = v;
      imageData.data[i * 4 + 3] = 255;
    }

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.putImageData(imageData, 0, 0);

    // Clear and draw with scaling (maintain aspect ratio)
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    const aspect = w / h;
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
