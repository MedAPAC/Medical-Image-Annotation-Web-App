// annotation/components/MainViewer.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import NiftiViewer from "../NiftiViewer";
import DicomViewer from "../DicomViewer";
import AnnotationCanvas from "../AnnotationCanvas";
import { useAuth } from "../AuthContext";

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

  // Zoom callbacks — passed through so the viewer can report back selections
  setZoomLevel,
  setZoomRegion,
  setIsZoomMode,
}) => {
  const { token } = useAuth();

  const prevSliceRef = useRef(currentSlice);
  const prevFileRef = useRef(selectedFileName);
  const prevDataRef = useRef(null);

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

  const file = uploadedFiles.find((f) => f.originalName === selectedFileName);

  if (file && !annotationRefs.current[file.originalName]) {
    annotationRefs.current[file.originalName] = React.createRef();
  }
  const currentCanvasRef = file ? annotationRefs.current[file.originalName] : null;

  // --- 1. LOAD DATA FROM BACKEND ---
  useEffect(() => {
    if (!selectedFileName || !token || !taskId) return;
    const fetchData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/annotations/${taskId}`, {
          params: { fileName: selectedFileName },
          headers: { Authorization: `Bearer ${token}` },
        });
        const sliceDataMap = response.data || {};
        const newAnnotations = {};
        const newInputs = {};
        const newClassifications = {};
        Object.keys(sliceDataMap).forEach((sliceIdx) => {
          const sData = sliceDataMap[sliceIdx];
          if (sData.editorState) newAnnotations[sliceIdx] = sData.editorState;
          if (sData.attributes) newInputs[sliceIdx] = sData.attributes;
          if (sData.classification) newClassifications[sliceIdx] = sData.classification;
        });
        setAnnotationsByFileAndSlice((prev) => ({ ...prev, [selectedFileName]: newAnnotations }));
        setInputsByFileAndSlice((prev) => ({ ...prev, [selectedFileName]: newInputs }));
        setClassificationByFileAndSlice((prev) => ({ ...prev, [selectedFileName]: newClassifications }));
      } catch (err) {
        console.error("Error loading annotations:", err);
      }
    };
    fetchData();
  }, [selectedFileName, taskId, token, setAnnotationsByFileAndSlice, setInputsByFileAndSlice, setClassificationByFileAndSlice]);

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
    canvas.clearAnnotations();
    if (currentSliceData) canvas.importAnnotations(currentSliceData);
    prevSliceRef.current = currentSlice;
    prevFileRef.current = selectedFileName;
    prevDataRef.current = currentSliceData;
  }, [currentSlice, selectedFileName, currentCanvasRef, currentSliceData, saveSliceAnnotationToState]);

  if (!file) return null;

  const isDicom = file.type === "dicom";

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
  const imageIds = isDicom
    ? uploadedFiles
        .filter((f) => {
          if (f.type !== "dicom") return false;
          if (file.seriesInstanceUID || f.seriesInstanceUID) {
            return f.seriesInstanceUID === file.seriesInstanceUID;
          }
          return true;
        })
        .map((f) => `wadouri:${f.url}`)
    : [];

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
    <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          borderRadius: "16px",
          boxShadow: `0 3px 12px rgba(0,0,0,0.08), 0 0 0 4px ${glowColor}`,
          position: "relative",
          border: `2px solid ${borderColor}`,
          padding: "8px",
          width: "max-content",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        }}
      >
        <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>

          {/* Zoom mode banner */}
          {isZoomMode && (
            <div
              style={{
                position: "absolute",
                top: 0, left: 0, right: 0,
                zIndex: 30,
                background: "rgba(99,102,241,0.92)",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 600,
                textAlign: "center",
                padding: "5px 0",
                borderRadius: "12px 12px 0 0",
                letterSpacing: "0.02em",
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              Draw a rectangle to zoom into that region
            </div>
          )}

          <div
            style={{
              position: "relative",
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid #e2e8f0",
            }}
          >
            {/* ----------------------------------------------------------------
                VIEWER WRAPPER — CSS zoom transform applied here.
                DicomViewer / NiftiViewer NEVER receive isZoomMode, zoomRegion,
                or zoomLevel, so their internal broken zoom code never runs.
            ---------------------------------------------------------------- */}
            <div
              ref={viewerWrapperRef}
              style={{
                position: "relative",
                overflow: "hidden",
                // Cursor signals zoom mode to the user
                cursor: isZoomMode ? "crosshair" : "default",
              }}
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
                    onSliceChange={setCurrentSlice}
                    setTotalSlices={setTotalSlices}
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
                    onSliceChange={setCurrentSlice}
                    setTotalSlices={setTotalSlices}
                    viewType={viewType}
                    width={500}
                    height={500}
                  />
                )}
              </div>

              {/* Annotation canvas overlay — disabled during zoom mode so
                  mouse events for region drawing reach the wrapper above */}
              <div
                style={{
                  position: "absolute",
                  top: 0, left: 0,
                  width: "100%", height: "100%",
                  zIndex: 10,
                  pointerEvents: isZoomMode ? "none" : "all",
                }}
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
                />
              </div>

              {/* Drag-selection rectangle drawn while user is selecting zoom region */}
              {isZoomMode && dragRect && (
                <div
                  style={{
                    position: "absolute",
                    left: `${dragRect.x}%`,
                    top: `${dragRect.y}%`,
                    width: `${dragRect.width}%`,
                    height: `${dragRect.height}%`,
                    border: "2px dashed #6366f1",
                    background: "rgba(99,102,241,0.12)",
                    pointerEvents: "none",
                    zIndex: 20,
                    borderRadius: "2px",
                  }}
                />
              )}

              {classification && (
                <div
                  style={{
                    position: "absolute",
                    top: "8px", right: "8px",
                    backgroundColor: borderColor,
                    color: "#fff",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    zIndex: 20,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  }}
                >
                  {classification.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              marginTop: "8px",
              textAlign: "center",
              fontSize: "14px",
              color: "#64748b",
              fontWeight: 500,
            }}
          >
            Slice {currentSlice + 1} / {totalSlices}
            {zoomLevel > 1 && (
              <span
                style={{
                  marginLeft: "10px",
                  fontSize: "12px",
                  color: "#6366f1",
                  fontWeight: 600,
                  background: "#eef2ff",
                  padding: "1px 7px",
                  borderRadius: "10px",
                }}
              >
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