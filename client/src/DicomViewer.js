import React, { useEffect, useRef, useState } from "react";
import cornerstone from "cornerstone-core";
import cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import dicomParser from "dicom-parser";
import "./i18n";
import { useTranslation } from "react-i18next";


cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

function DicomViewer({ imageIds = [], windowCenter = null, windowWidth = null, onSliceChange }) {
  const element = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (onSliceChange) {
      onSliceChange(currentIndex);
    }
  }, [currentIndex, onSliceChange]);
  useEffect(() => {
    if (element.current) {
      cornerstone.enable(element.current);
    }
    return () => {
      if (element.current) {
        cornerstone.disable(element.current);
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

  const goNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, imageIds.length - 1));
  };

  const goPrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

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
  }, [imageIds]);

return (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div
      ref={element}
      style={{
        width: 512,
        height: 512,
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
  </div>
);

}

export default DicomViewer;
