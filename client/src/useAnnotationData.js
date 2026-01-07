// annotation/hooks/useAnnotationData.js
import { useState, useRef, useEffect } from "react";
import axios from "axios";

const useAnnotationData = () => {
  // Tool States
  const [selectedShape, setSelectedShape] = useState("polygon");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [labelOptions, setLabelOptions] = useState(["L1", "L2", "L3"]);
  const [selectedFileName, setSelectedFileName] = useState(null);
  
  // Window Settings
  const [windowCenter, setWindowCenter] = useState(null);
  const [windowWidth, setWindowWidth] = useState(null);
  
  // Brush Settings
  const [brushColor, setBrushColor] = useState("rgba(173, 216, 230)");
  const [brushSize, setBrushSize] = useState(10);
  const [toolChangeId, setToolChangeId] = useState(0);
  const [annotationOpacity, setAnnotationOpacity] = useState(0.4);
  
  // UI States
  const [openSection, setOpenSection] = useState(null);
  const [totalSlices, setTotalSlices] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isZoomMode, setIsZoomMode] = useState(false);
  const [zoomRegion, setZoomRegion] = useState(null);
  
  // Data States
  const [inputsByFileAndSlice, setInputsByFileAndSlice] = useState({});
  const [classificationByFileAndSlice, setClassificationByFileAndSlice] = useState({});
  const [currentSlice, setCurrentSlice] = useState(0);
  
  // Panel States
  const [rightPanelOpen, setRightPanelOpen] = useState(null);
  const [viewType, setViewType] = useState("axial");
  
  // Refs
  const annotationRefs = useRef({});

  // Keyboard navigation for slices
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedFileName) return;

      if (e.key === "ArrowRight") {
        setCurrentSlice((prev) => Math.min(prev + 1, totalSlices - 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentSlice((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFileName, totalSlices]);

  // Helper functions
  const getInputsForCurrent = (fileName, slice) => {
    return inputsByFileAndSlice[fileName]?.[slice] || {
      checkbox: false,
      number: "",
      text: "",
      radio: "",
      select: ""
    };
  };

  const updateInputsForCurrent = (fileName, slice, updates) => {
    setInputsByFileAndSlice((prev) => ({
      ...prev,
      [fileName]: {
        ...(prev[fileName] || {}),
        [slice]: {
          ...(prev[fileName]?.[slice] || {}),
          ...updates,
        },
      },
    }));
  };

  return {
    // State
    selectedShape,
    setSelectedShape,
    selectedLabel,
    setSelectedLabel,
    labelOptions,
    setLabelOptions,
    selectedFileName,
    setSelectedFileName,
    windowCenter,
    setWindowCenter,
    windowWidth,
    setWindowWidth,
    brushColor,
    setBrushColor,
    brushSize,
    setBrushSize,
    toolChangeId,
    setToolChangeId,
    annotationOpacity,
    setAnnotationOpacity,
    openSection,
    setOpenSection,
    totalSlices,
    setTotalSlices,
    zoomLevel,
    setZoomLevel,
    isZoomMode,
    setIsZoomMode,
    zoomRegion,
    setZoomRegion,
    inputsByFileAndSlice,
    setInputsByFileAndSlice,
    currentSlice,
    setCurrentSlice,
    classificationByFileAndSlice,
    setClassificationByFileAndSlice,
    rightPanelOpen,
    setRightPanelOpen,
    viewType,
    setViewType,
    
    // Refs
    annotationRefs,
    
    // Helper functions
    getInputsForCurrent,
    updateInputsForCurrent
  };
};

export default useAnnotationData;