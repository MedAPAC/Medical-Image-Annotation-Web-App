// annotation/hooks/useAnnotationData.js
import { useState, useRef, useEffect, useCallback } from "react";

const clampSlice = (value, sliceCount) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;

  const maxSlice = Math.max((Number(sliceCount) || 0) - 1, 0);
  return Math.min(Math.max(Math.round(numeric), 0), maxSlice);
};

const useAnnotationData = () => {
  // --- Tool States ---
  const [selectedShape, setSelectedShape] = useState("");
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [labelOptions, setLabelOptions] = useState([]);
  const [selectedFileName, setSelectedFileName] = useState(null);

  // --- Display Settings ---
  const [windowCenter, setWindowCenter] = useState(null);
  const [windowWidth, setWindowWidth] = useState(null);
  const [brushColor, setBrushColor] = useState("#FFFFFF");
  const [brushSize, setBrushSize] = useState(10);
  const [toolChangeId, setToolChangeId] = useState(0);
  const [annotationOpacity, setAnnotationOpacity] = useState(0.5);

  // --- UI States ---
  const [openSection, setOpenSection] = useState(null);
  const [totalSlices, setTotalSlices] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isZoomMode, setIsZoomMode] = useState(false);
  const [zoomRegion, setZoomRegion] = useState(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(null);
  const [viewType, setViewType] = useState("axial");
  const [currentSlice, setCurrentSliceRaw] = useState(0);

  const setCurrentSlice = useCallback((nextSlice) => {
    setCurrentSliceRaw((previousSlice) => {
      const nextValue =
        typeof nextSlice === "function" ? nextSlice(previousSlice) : nextSlice;
      return clampSlice(nextValue, totalSlices);
    });
  }, [totalSlices]);

  useEffect(() => {
    setCurrentSliceRaw((previousSlice) => clampSlice(previousSlice, totalSlices));
  }, [totalSlices]);

  // --- DATA STATES (The "Database" in Frontend Memory) ---
  // Key structure: { [fileName]: { [sliceIndex]: Data } }
  
  const [inputsByFileAndSlice, setInputsByFileAndSlice] = useState({});
  const [classificationByFileAndSlice, setClassificationByFileAndSlice] = useState({});
  const [annotationsByFileAndSlice, setAnnotationsByFileAndSlice] = useState({});

  // Refs for Canvas interaction
  const annotationRefs = useRef({});

  // --- Keyboard Navigation ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedFileName) return;
      // Prevent slice change if user is typing
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === "ArrowRight") {
        setCurrentSlice((prev) => Math.min(prev + 1, totalSlices - 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentSlice((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFileName, totalSlices, setCurrentSlice]);

  // --- Helpers ---

  // Helper to save Canvas JSON to state (In-Memory)
  const saveSliceAnnotationToState = (fileName, sliceIndex, canvasJson) => {
    setAnnotationsByFileAndSlice(prev => ({
      ...prev,
      [fileName]: {
        ...(prev[fileName] || {}),
        [sliceIndex]: canvasJson
      }
    }));
  };

  return {
    selectedShape, setSelectedShape,
    selectedLabel, setSelectedLabel,
    labelOptions, setLabelOptions,
    selectedFileName, setSelectedFileName,
    windowCenter, setWindowCenter,
    windowWidth, setWindowWidth,
    brushColor, setBrushColor,
    brushSize, setBrushSize,
    toolChangeId, setToolChangeId,
    annotationOpacity, setAnnotationOpacity,
    openSection, setOpenSection,
    totalSlices, setTotalSlices,
    zoomLevel, setZoomLevel,
    isZoomMode, setIsZoomMode,
    zoomRegion, setZoomRegion,
    
    // Data Props
    inputsByFileAndSlice, setInputsByFileAndSlice,
    classificationByFileAndSlice, setClassificationByFileAndSlice,
    annotationsByFileAndSlice, setAnnotationsByFileAndSlice, 
    saveSliceAnnotationToState, 
    
    currentSlice, setCurrentSlice,
    rightPanelOpen, setRightPanelOpen,
    viewType, setViewType,
    annotationRefs
  };
};

export default useAnnotationData;
