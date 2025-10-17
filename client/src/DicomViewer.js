import React, { useEffect, useRef, useState } from "react";
import cornerstone from "cornerstone-core";
import cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import dicomParser from "dicom-parser";

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

  // Sync external slice
  useEffect(() => {
    if (currentSlice !== undefined && currentSlice !== currentIndex) {
      setCurrentIndex(currentSlice);
    }
  }, [currentSlice, currentIndex]);

  // Notify parent slice change
  useEffect(() => {
    if (onSliceChange) onSliceChange(currentIndex);
  }, [currentIndex, onSliceChange]);

  // Set total slices
  useEffect(() => {
    if (imageIds?.length && setTotalSlices) {
      setTotalSlices(imageIds.length);
    }
  }, [imageIds, setTotalSlices]);

  // Enable cornerstone
  useEffect(() => {
    const el = element.current;
    if (el) cornerstone.enable(el);
    return () => {
      if (el) cornerstone.disable(el);
    };
  }, []);

  // Load and display current DICOM slice
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

  // Ensure currentIndex stays in bounds
  useEffect(() => {
    if (currentIndex >= imageIds.length && imageIds.length > 0) {
      setCurrentIndex(imageIds.length - 1);
    }
  }, [imageIds.length, currentIndex]);

  return (
    <div
      ref={element}
      style={{
        width,
        height,
        background: "#000",
        display: "block",
        objectFit: "contain",
      }}
    />
  );
}

export default DicomViewer;
