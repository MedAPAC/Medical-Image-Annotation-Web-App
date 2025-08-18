import React, { useEffect, useRef, useState } from "react";
import * as nifti from "nifti-reader-js";
import "./i18n";
import { useTranslation } from "react-i18next";

function NiftiViewer({ url, windowCenter = null, windowWidth = null, onSliceChange }) {
  const [niftiHeader, setNiftiHeader] = useState(null);
  const [niftiImage, setNiftiImage] = useState(null);
  const [currentSlice, setCurrentSlice] = useState(0);
  const [defaultWC, setDefaultWC] = useState(null);
  const [defaultWW, setDefaultWW] = useState(null);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (onSliceChange) {
      onSliceChange(currentSlice);
    }
  }, [currentSlice, onSliceChange]);  const canvasRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!niftiHeader) return;
      if (e.key === "ArrowRight") {
        setCurrentSlice((prev) =>
          Math.min(prev + 1, niftiHeader.dims[3] - 1)
        );
      } else if (e.key === "ArrowLeft") {
        setCurrentSlice((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [niftiHeader]);

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
      } else {
        console.error("Invalid NIfTI file.");
      }
    }

    loadNifti();
  }, [url]);

  useEffect(() => {
    if (!niftiHeader || !niftiImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const [w, h, d] = [
      niftiHeader.dims[1],
      niftiHeader.dims[2],
      niftiHeader.dims[3],
    ];
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

    const slice = volume.slice(
      currentSlice * sliceSize,
      (currentSlice + 1) * sliceSize
    );

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

    ctx.putImageData(imageData, 0, 0);
  }, [
    niftiHeader,
    niftiImage,
    currentSlice,
    windowCenter,
    windowWidth,
    defaultWC,
    defaultWW,
  ]);

  if (!niftiHeader) return <div>Loading...</div>;

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={niftiHeader.dims[1]}
        height={niftiHeader.dims[2]}
        style={{ border: "1px solid black" }}
      />
      <div className="mt-2 space-x-2">
        <button onClick={() => setCurrentSlice(Math.max(currentSlice - 1, 0))}>
          {t("prev")}
        </button>
        <button
          onClick={() =>
            setCurrentSlice(Math.min(currentSlice + 1, niftiHeader.dims[3] - 1))
          }
        >
          {t("nxt")}
        </button>
        <span>
          Slice {currentSlice + 1} / {niftiHeader.dims[3]}
        </span>
      </div>
    </div>
  );
}

export default NiftiViewer;
