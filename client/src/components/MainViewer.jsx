// annotation/components/MainViewer.jsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import axios from "axios";
import NiftiViewer from "../NiftiViewer";
import DicomViewer from "../DicomViewer";
import AnnotationCanvas from "../AnnotationCanvas";
import { useAuth } from "../AuthContext";
import {
  normalizeClassificationForState,
  toInternalSliceKey,
} from "../annotationFormat";

const fileSelectionKey = (file) => file?.annotationKey || file?.originalName;

const MainViewer = ({
  uploadedFiles,
  selectedFileName,
  windowCenter,
  windowWidth,
  currentSlice,
  setCurrentSlice,
  setTotalSlices,
  zoomLevel,
  zoomRegion,
  isZoomMode,
  viewType,
  selectedShape,
  selectedLabel,
  brushColor,
  brushSize,
  toolChangeId,
  annotationOpacity,

  // Data State
  classificationByFileAndSlice,
  annotationsByFileAndSlice,
  saveSliceAnnotationToState,
  setInputsByFileAndSlice,
  setClassificationByFileAndSlice,
  setAnnotationsByFileAndSlice,

  annotationRefs,
  totalSlices,
  taskId,
  remoteAnnotationReload,

  // Zoom callbacks — passed through so the viewer can report back selections
  setZoomLevel,
  setZoomRegion,
  setIsZoomMode,
  onAnnotationChange,
}) => {
  const { token } = useAuth();

  const prevSliceRef = useRef(currentSlice);
  const prevFileRef = useRef(selectedFileName);
  const prevDataRef = useRef(null);
  const loadedAnnotationFilesRef = useRef(new Set());

  // -----------------------------------------------------------------------
  // CSS-TRANSFORM ZOOM
  // We own zoom entirely here with a CSS transform on the viewer wrapper.
  // isZoomMode=true enters "draw a region" mode using our own overlay.
  // We NEVER pass isZoomMode / zoomRegion / zoomLevel to DicomViewer or
  // NiftiViewer — their internal zoom mechanisms are bypassed completely,
  // which prevents the blank-image bug.
  // -----------------------------------------------------------------------
  const [dragStart, setDragStart] = useState(null);
  const [dragRect, setDragRect] = useState(null);
  const viewerWrapperRef = useRef(null);

  // Build the CSS transform from zoomLevel + zoomRegion
  const getZoomTransform = () => {
    if (!zoomRegion || zoomLevel <= 1) return { transform: "none", transformOrigin: "top left" };
    // zoomRegion is { x, y, width, height } in percentage (0-100) of the viewer
    const originX = zoomRegion.x + zoomRegion.width / 2;
    const originY = zoomRegion.y + zoomRegion.height / 2;
    return {
      transform: `scale(${zoomLevel})`,
      transformOrigin: `${originX}% ${originY}%`,
      transition: "transform 0.2s ease",
    };
  };

  // Mouse handlers for drawing a zoom region
  const handleZoomMouseDown = useCallback((e) => {
    if (!isZoomMode) return;
    e.preventDefault();
    const rect = viewerWrapperRef.current.getBoundingClientRect();
    setDragStart({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
    setDragRect(null);
  }, [isZoomMode]);

  const handleZoomMouseMove = useCallback((e) => {
    if (!isZoomMode || !dragStart) return;
    e.preventDefault();
    const rect = viewerWrapperRef.current.getBoundingClientRect();
    const curX = ((e.clientX - rect.left) / rect.width) * 100;
    const curY = ((e.clientY - rect.top) / rect.height) * 100;
    setDragRect({
      x: Math.min(dragStart.x, curX),
      y: Math.min(dragStart.y, curY),
      width: Math.abs(curX - dragStart.x),
      height: Math.abs(curY - dragStart.y),
    });
  }, [isZoomMode, dragStart]);

  const handleZoomMouseUp = useCallback((e) => {
    if (!isZoomMode || !dragStart || !dragRect) return;
    e.preventDefault();
    // Only apply if region is large enough to be intentional
    if (dragRect.width > 2 && dragRect.height > 2) {
      // Calculate zoom level so the selected region fills the viewer
      const scaleX = 100 / dragRect.width;
      const scaleY = 100 / dragRect.height;
      const newZoom = Math.min(scaleX, scaleY, 8); // cap at 8×
      if (setZoomRegion) setZoomRegion(dragRect);
      if (setZoomLevel) setZoomLevel(parseFloat(newZoom.toFixed(2)));
    }
    setDragStart(null);
    setDragRect(null);
    if (setIsZoomMode) setIsZoomMode(false);
  }, [isZoomMode, dragStart, dragRect, setZoomRegion, setZoomLevel, setIsZoomMode]);

  const file = useMemo(
    () => uploadedFiles.find((f) => fileSelectionKey(f) === selectedFileName),
    [uploadedFiles, selectedFileName]
  );

  if (file && selectedFileName && !annotationRefs.current[selectedFileName]) {
    annotationRefs.current[selectedFileName] = React.createRef();
  }
  const currentCanvasRef = file && selectedFileName ? annotationRefs.current[selectedFileName] : null;

  // --- 1. LOAD DATA FROM BACKEND ---
  useEffect(() => {
    if (!selectedFileName || !token || !taskId) return;
    const forceReload =
      remoteAnnotationReload?.filename === selectedFileName &&
      remoteAnnotationReload?.version;

    if (!forceReload && loadedAnnotationFilesRef.current.has(selectedFileName)) {
      return;
    }

    let cancelled = false;
    const fetchData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/annotations/${taskId}`, {
          params: { fileName: selectedFileName },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        const sliceDataMap = response.data || {};
        const newAnnotations = {};
        const newInputs = {};
        const newClassifications = {};
        Object.keys(sliceDataMap).forEach((savedSliceKey) => {
          const sData = sliceDataMap[savedSliceKey] || {};
          const internalSliceKey = toInternalSliceKey(savedSliceKey, sData);
          const classification = normalizeClassificationForState(sData.classification);

          if (sData.editorState) newAnnotations[internalSliceKey] = sData.editorState;
          if (sData.attributes) newInputs[internalSliceKey] = sData.attributes;
          if (classification) newClassifications[internalSliceKey] = classification;
        });
        setAnnotationsByFileAndSlice((prev) => ({ ...prev, [selectedFileName]: newAnnotations }));
        setInputsByFileAndSlice((prev) => ({ ...prev, [selectedFileName]: newInputs }));
        setClassificationByFileAndSlice((prev) => ({ ...prev, [selectedFileName]: newClassifications }));
        loadedAnnotationFilesRef.current.add(selectedFileName);
      } catch (err) {
        if (!cancelled) {
          console.error("Error loading annotations:", err);
        }
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [
    selectedFileName,
    taskId,
    token,
    remoteAnnotationReload,
    setAnnotationsByFileAndSlice,
    setInputsByFileAndSlice,
    setClassificationByFileAndSlice,
  ]);

  // --- 2. HANDLE CANVAS SYNC ---
  const currentSliceData = annotationsByFileAndSlice[selectedFileName]?.[currentSlice];

  useEffect(() => {
    if (!currentCanvasRef || !currentCanvasRef.current) return;
    const canvas = currentCanvasRef.current;
    const isSliceChange = prevSliceRef.current !== currentSlice;
    const isFileChange = prevFileRef.current !== selectedFileName;
    const isDataUpdate = prevDataRef.current !== currentSliceData;
    if (!isSliceChange && !isFileChange && !isDataUpdate) return;
    if (isSliceChange || isFileChange) {
      const oldSlice = prevSliceRef.current;
      const oldFile = prevFileRef.current;
      if (oldFile === selectedFileName && oldSlice !== currentSlice) {
        const json = canvas.exportAnnotations();
        saveSliceAnnotationToState(oldFile, oldSlice, json);
      }
    }
    canvas.clearAnnotations({ silent: true });
    if (currentSliceData) canvas.importAnnotations(currentSliceData);
    prevSliceRef.current = currentSlice;
    prevFileRef.current = selectedFileName;
    prevDataRef.current = currentSliceData;
  }, [currentSlice, selectedFileName, currentCanvasRef, currentSliceData, saveSliceAnnotationToState]);

  const handleAnnotationChange = useCallback(() => {
    onAnnotationChange?.();
  }, [onAnnotationChange]);

  const isDicom = file?.type === "dicom";
  const fileStack = useMemo(
    () => {
      if (!file) return [];
      return Array.isArray(file.files) && file.files.length > 0 ? file.files : [file];
    },
    [file]
  );

  const handleSliceChange = useCallback((nextSlice) => {
    setCurrentSlice(nextSlice);
  }, [setCurrentSlice]);

  const handleTotalSlicesChange = useCallback((nextTotal) => {
    setTotalSlices((previousTotal) => (
      previousTotal === nextTotal ? previousTotal : nextTotal
    ));
  }, [setTotalSlices]);

  // -----------------------------------------------------------------------
  // FIX: "all dicom slices = one file"
  // Previously this grabbed *every* uploaded DICOM file regardless of which
  // series/file the user selected, and the order was whatever order they
  // were uploaded in. DicomViewer now treats this whole array as ONE
  // volume (sorting + reformatting happens inside DicomViewer), so we just
  // need to make sure we pass it the correct, complete set of slices for
  // the *selected* series.
  //
  // If your uploaded file objects carry a series/study identifier (e.g.
  // f.seriesInstanceUID or f.seriesId), group by that. Otherwise, fall back
  // to treating all uploaded DICOM files as one series (single-series
  // uploads).
  // -----------------------------------------------------------------------
  const imageIds = useMemo(
    () => (
      isDicom
        ? fileStack
            .filter((f) => f.type === "dicom" && f.url)
            .map((f) => `wadouri:${f.url}`)
        : []
    ),
    [isDicom, fileStack]
  );

  if (!file) return null;

  const classification = classificationByFileAndSlice[selectedFileName]?.[currentSlice];
  const borderColor =
    classification === "positive"
      ? "#16a34a"
      : classification === "negative"
      ? "#dc2626"
      : "#e2e8f0";
  const glowColor =
    classification === "positive"
      ? "rgba(22,163,74,0.3)"
      : classification === "negative"
      ? "rgba(220,38,38,0.3)"
      : "rgba(0,0,0,0.05)";
  const finalLabel =
    selectedLabel && typeof selectedLabel === "object" ? selectedLabel.name : selectedLabel;

  const zoomStyle = getZoomTransform();

  return (
    <div className="main-viewer">
      <div
        className={[
          "viewer-container",
          classification === "positive" ? "positive" : "",
          classification === "negative" ? "negative" : "",
        ].filter(Boolean).join(" ")}
        style={{
          boxShadow: `0 3px 12px rgba(0,0,0,0.08), 0 0 0 4px ${glowColor}`,
          border: `2px solid ${borderColor}`,
        }}
      >
        <div className="viewer-shell">

          {/* Zoom mode banner */}
          {isZoomMode && (
            <div className="zoom-mode-banner">
              Draw a rectangle to zoom into that region
            </div>
          )}

          <div className="image-wrapper">
            {/* ----------------------------------------------------------------
                VIEWER WRAPPER — CSS zoom transform applied here.
                DicomViewer / NiftiViewer NEVER receive isZoomMode, zoomRegion,
                or zoomLevel, so their internal broken zoom code never runs.
            ---------------------------------------------------------------- */}
            <div
              ref={viewerWrapperRef}
              className="viewer-transform-root"
              style={{ cursor: isZoomMode ? "crosshair" : "default" }}
              onMouseDown={handleZoomMouseDown}
              onMouseMove={handleZoomMouseMove}
              onMouseUp={handleZoomMouseUp}
            >
              {/* The zoom transform wrapper */}
              <div style={{ ...zoomStyle, willChange: "transform" }}>
                {isDicom ? (
                  <DicomViewer
                    imageIds={imageIds}
                    windowCenter={windowCenter}
                    windowWidth={windowWidth}
                    currentSlice={currentSlice}
                    onSliceChange={handleSliceChange}
                    setTotalSlices={handleTotalSlicesChange}
                    viewType={viewType}
                    width={500}
                    height={500}
                  />
                ) : (
                  <NiftiViewer
                    url={file.url}
                    windowCenter={windowCenter}
                    windowWidth={windowWidth}
                    currentSlice={currentSlice}
                    onSliceChange={handleSliceChange}
                    setTotalSlices={handleTotalSlicesChange}
                    viewType={viewType}
                    width={500}
                    height={500}
                  />
                )}
              </div>

              {/* Annotation canvas overlay — disabled during zoom mode so
                  mouse events for region drawing reach the wrapper above */}
              <div
                className="annotation-layer"
                style={{ pointerEvents: isZoomMode ? "none" : "all" }}
              >
                <AnnotationCanvas
                  ref={currentCanvasRef}
                  mode={selectedShape}
                  width={500} height={500}
                  selectedLabel={finalLabel}
                  brushColor={brushColor}
                  brushSize={brushSize}
                  toolChangeId={toolChangeId}
                  annotationOpacity={annotationOpacity}
                  zoomLevel={zoomLevel}
                  isZoomMode={isZoomMode}
                  onShapeComplete={handleAnnotationChange}
                />
              </div>

              {/* Drag-selection rectangle drawn while user is selecting zoom region */}
              {isZoomMode && dragRect && (
                <div
                  className="zoom-selection-rect"
                  style={{
                    left: `${dragRect.x}%`,
                    top: `${dragRect.y}%`,
                    width: `${dragRect.width}%`,
                    height: `${dragRect.height}%`,
                  }}
                />
              )}

              {classification && (
                <div
                  className="classification-tag"
                  style={{
                    backgroundColor: borderColor,
                  }}
                >
                  {classification.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div className="viewer-footer">
            Slice {currentSlice + 1} / {totalSlices}
            {zoomLevel > 1 && (
              <span className="zoom-pill">
                {zoomLevel.toFixed(1)}×
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainViewer;
