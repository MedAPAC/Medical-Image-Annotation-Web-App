import React, { useEffect, useRef, useState, useCallback } from "react";
import cornerstone from "cornerstone-core";
import cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import dicomParser from "dicom-parser";
import "./i18n";
import { useTranslation } from "react-i18next";

cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

function DicomViewer({
  imageIds = [],
  windowCenter = null,
  windowWidth = null,
  onSliceChange,
  width = 600,
  height = 600,
  currentSlice, 
  setTotalSlices, 
}) {
  const element = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    if (currentSlice !== undefined && currentSlice !== currentIndex) {
      setCurrentIndex(currentSlice);
    }
  }, [currentSlice, currentIndex]);

  useEffect(() => {
    if (onSliceChange) {
      onSliceChange(currentIndex);
    }
  }, [currentIndex, onSliceChange]);

  useEffect(() => {
    if (imageIds?.length && setTotalSlices) {
      setTotalSlices(imageIds.length);
    }
  }, [imageIds, setTotalSlices]);

  useEffect(() => {
    const el = element.current;
    if (el) {
      cornerstone.enable(el);
    }
    return () => {
      if (el) {
        cornerstone.disable(el);
      }
    };
  }, []);

  useEffect(() => {
    if (!imageIds.length || !element.current) return;

    const loadImage = async () => {
      try {
        const image = await cornerstone.loadImage(imageIds[currentIndex]);
        const viewport = cornerstone.getDefaultViewportForImage(element.current, image);

        if (windowCenter != null && windowWidth != null) {
          viewport.voi.windowCenter = windowCenter;
          viewport.voi.windowWidth = windowWidth;
        }

        cornerstone.displayImage(element.current, image, viewport);
      } catch (e) {
        console.error("Error loading DICOM image:", e);
      }
    };

    loadImage();
  }, [imageIds, currentIndex, windowCenter, windowWidth]);

  const goNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(prev + 1, imageIds.length - 1));
  }, [imageIds.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        goNext();
      } else if (e.key === "ArrowLeft") {
        goPrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  useEffect(() => {
    if (currentIndex >= imageIds.length && imageIds.length > 0) {
      setCurrentIndex(imageIds.length - 1);
    }
  }, [imageIds.length, currentIndex]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        ref={element}
        style={{
          width,
          height,
          background: "#000",
        }}
      />

      <div style={{ marginTop: "8px" }}>
        Slice {currentIndex + 1} / {imageIds.length}
      </div>

      <div style={{ marginTop: "8px", display: "flex", gap: "12px" }}>
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            background: "#ddd",
            cursor: currentIndex === 0 ? "not-allowed" : "pointer",
          }}
        >
          {t("prev")}
        </button>
        <button
          onClick={goNext}
          disabled={currentIndex === imageIds.length - 1}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            background: "#ddd",
            cursor: currentIndex === imageIds.length - 1 ? "not-allowed" : "pointer",
          }}
        >
          {t("nxt")}
        </button>
      </div>

      {imageIds.length > 1 && (
        <div style={{ marginTop: "8px", width: "100%" }}>
          <input
            type="range"
            min={0}
            max={imageIds.length - 1}
            value={currentIndex}
            onChange={(e) => setCurrentIndex(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>
      )}
    </div>
  );
}

export default DicomViewer;
