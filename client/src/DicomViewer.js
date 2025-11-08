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
  viewType = "axial", // ✅ new prop
  imageStacks = {},
  isZoomMode = ""    // ✅ optional: { axial: [...], coronal: [...], sagittal: [...] }
}) {
  const element = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeStack, setActiveStack] = useState(imageIds);

  // 🔹 Switch stack when viewType changes
  useEffect(() => {
    if (imageStacks[viewType] && imageStacks[viewType].length) {
      setActiveStack(imageStacks[viewType]);
      setCurrentIndex(0);
      if (setTotalSlices) setTotalSlices(imageStacks[viewType].length);
    } else {
      setActiveStack(imageIds);
    }
  }, [viewType, imageStacks, imageIds, setTotalSlices]);

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

  // Set total slices initially
  useEffect(() => {
    if (activeStack?.length && setTotalSlices) {
      setTotalSlices(activeStack.length);
    }
  }, [activeStack, setTotalSlices]);

  // Enable cornerstone
  useEffect(() => {
    const el = element.current;
    if (el) cornerstone.enable(el);
    return () => {
      if (el) cornerstone.disable(el);
    };
  }, []);

  useEffect(() => {
  if (!element.current) return;
  const el = element.current;

  let mouseDown = false;
  let start = null;

  if (isZoomMode) {
    const handleMouseDown = (e) => {
      mouseDown = true;
      start = { x: e.offsetX, y: e.offsetY };
    };

    const handleMouseUp = (e) => {
      if (!mouseDown || !start) return;
      const end = { x: e.offsetX, y: e.offsetY };
      mouseDown = false;

      const zoomRect = {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y),
      };

      const factor = Math.min(el.clientWidth / zoomRect.width, el.clientHeight / zoomRect.height);
      cornerstone.setViewport(el, {
        ...cornerstone.getViewport(el),
        scale: factor,
      });
    };

    el.addEventListener("mousedown", handleMouseDown);
    el.addEventListener("mouseup", handleMouseUp);

    return () => {
      el.removeEventListener("mousedown", handleMouseDown);
      el.removeEventListener("mouseup", handleMouseUp);
    };
  }
}, [isZoomMode]);

  // Load and display current DICOM slice
  useEffect(() => {
    if (!activeStack.length || !element.current) return;

    const loadImage = async () => {
      try {
        const image = await cornerstone.loadImage(activeStack[currentIndex]);
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
  }, [activeStack, currentIndex, windowCenter, windowWidth]);

  // Ensure currentIndex stays in bounds
  useEffect(() => {
    if (currentIndex >= activeStack.length && activeStack.length > 0) {
      setCurrentIndex(activeStack.length - 1);
    }
  }, [activeStack.length, currentIndex]);

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
