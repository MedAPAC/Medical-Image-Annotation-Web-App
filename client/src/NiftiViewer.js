import React, { useEffect, useRef, useState, useCallback } from "react";
import * as nifti from "nifti-reader-js";
import "./i18n";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const canvasRef = useRef(null);

  // Sync external slice prop with internal state
  useEffect(() => {
    if (externalSlice !== undefined && externalSlice !== currentSlice) {
      setCurrentSlice(externalSlice);
    }
  }, [externalSlice, currentSlice]);

  // Notify parent on slice change
  useEffect(() => {
    if (onSliceChange) onSliceChange(currentSlice);
  }, [currentSlice, onSliceChange]);

  // Set total slices
  useEffect(() => {
    if (niftiHeader && setTotalSlices) {
      setTotalSlices(niftiHeader.dims?.[3] || 1);
    }
  }, [niftiHeader, setTotalSlices]);

  // Keyboard navigation
  const goNext = useCallback(() => {
    if (!niftiHeader) return;
    setCurrentSlice((prev) => Math.min(prev + 1, niftiHeader.dims[3] - 1));
  }, [niftiHeader]);

  const goPrev = useCallback(() => {
    setCurrentSlice((prev) => Math.max(prev - 1, 0));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  // Load NIfTI file
  useEffect(() => {
    async function loadNifti() {
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
        console.error("Invalid NIfTI file.");
      }
    }

    loadNifti();
  }, [url]);

  // Render current slice to canvas
  useEffect(() => {
    if (!niftiHeader || !niftiImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const [w, h, d] = [niftiHeader.dims[1], niftiHeader.dims[2], niftiHeader.dims[3]];
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
        console.warn("Unsupported data type");
        return;
    }

    const slice = volume.slice(currentSlice * sliceSize, (currentSlice + 1) * sliceSize);
    const min = Math.min(...slice);
    const max = Math.max(...slice);

    if (defaultWC === null || defaultWW === null) {
      setDefaultWC((min + max) / 2);
      setDefaultWW(max - min);
    }

    const useCustomWindow = windowCenter != null && windowWidth != null;
    const wc = useCustomWindow ? windowCenter : (min + max) / 2;
    const ww = useCustomWindow ? windowWidth : max - min;

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
      imageData.data[i * 4 + 0] = v;
      imageData.data[i * 4 + 1] = v;
      imageData.data[i * 4 + 2] = v;
      imageData.data[i * 4 + 3] = 255;
    }

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = w;
    tempCanvas.height = h;
    tempCanvas.getContext("2d").putImageData(imageData, 0, 0);

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(tempCanvas, 0, 0, width, height);
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

  if (!niftiHeader) return <div>Loading...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ border: "1px solid black", background: "#000" }}
      />

      <div style={{ marginTop: "8px" }}>
        Slice {currentSlice + 1} / {niftiHeader.dims[3]}
      </div>

      <div style={{ marginTop: "8px", display: "flex", gap: "12px" }}>
        <button
          onClick={goPrev}
          disabled={currentSlice === 0}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            background: "#ddd",
            cursor: currentSlice === 0 ? "not-allowed" : "pointer",
          }}
        >
          {t("prev")}
        </button>
        <button
          onClick={goNext}
          disabled={currentSlice === niftiHeader.dims[3] - 1}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            background: "#ddd",
            cursor: currentSlice === niftiHeader.dims[3] - 1 ? "not-allowed" : "pointer",
          }}
        >
          {t("nxt")}
        </button>
      </div>

      <div style={{ marginTop: "8px", width: "100%" }}>
        <input
          type="range"
          min={0}
          max={niftiHeader.dims[3] - 1}
          value={currentSlice}
          onChange={(e) => setCurrentSlice(Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}

export default NiftiViewer;
