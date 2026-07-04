// pages/Annotation.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from '../AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { fabric } from "fabric";

import { CircleDot, ScanLine, Wand2 } from 'lucide-react';
import { runnerRegistry } from "../inference/InferenceRunner";
import { formatAIPrompt } from "../inference/promptFormatter";
import { polygonToMask, maskToPolygon } from "../inference/maskConverter";

// Hooks
import useTaskData from "../useTaskData";
import useAnnotationData from "../useAnnotationData";
import useFileHandling from "../useFileHandling";
import useNavigationGuard from "../useNavigationGuard";

// Components
import TaskTimer from "../components/TaskTimer";
import Header from '../components/Header';
import TaskInfoBar from "../components/TaskInfoBar";
import FileUploadSection from "../components/FileUploadSection";
import ToolbarLeft from "../components/ToolbarLeft";
import LeftDrawer from "../components/LeftDrawer";
import MainViewer from "../components/MainViewer";
import ToolbarRight from "../components/ToolbarRight";
import RightPanel from "../components/RightPanel";
import UnsavedChangesModal from "../components/UnsavedChangesModal";
import "../styles/Annotation.css";
import {
  ANNOTATION_SCHEMA_VERSION,
  normalizeClassificationForSave,
  toSavedSliceKey,
  toSavedSliceNumber,
} from "../annotationFormat";

// Constants
import { SHAPES, SECTION_ICONS, LEFT_BUTTONS, RIGHT_BUTTONS } from "../constants";

import { API_BASE_URL, apiUrl } from '../config/api';

const fileSelectionKey = (file) => file?.annotationKey || file?.originalName;

const getDicomSeriesKey = (file) => {
  const seriesId =
    file.seriesInstanceUID ||
    file.seriesId ||
    file.seriesUID ||
    file.studyInstanceUID ||
    null;

  return seriesId ? `dicom-series:${seriesId}` : "dicom-series:default";
};

const buildLogicalFileList = (files) => {
  const logicalFiles = [];
  const dicomGroups = new Map();

  files.forEach((file) => {
    if (file.type !== "dicom") {
      logicalFiles.push({
        ...file,
        annotationKey: fileSelectionKey(file),
        displayName: file.displayName || file.originalName,
      });
      return;
    }

    const groupKey = getDicomSeriesKey(file);
    if (!dicomGroups.has(groupKey)) {
      dicomGroups.set(groupKey, []);
      logicalFiles.push({ __dicomGroupKey: groupKey });
    }
    dicomGroups.get(groupKey).push(file);
  });

  return logicalFiles.map((entry) => {
    if (!entry.__dicomGroupKey) return entry;

    const seriesFiles = dicomGroups.get(entry.__dicomGroupKey) || [];
    const firstFile = seriesFiles[0] || {};
    const seriesId = String(entry.__dicomGroupKey).split(":").pop();
    const seriesLabel =
      entry.__dicomGroupKey === "dicom-series:default"
        ? "DICOM series"
        : `DICOM series ${seriesId.slice(-8)}`;

    return {
      ...firstFile,
      type: "dicom",
      files: seriesFiles,
      isDicomSeries: true,
      sliceCount: seriesFiles.length,
      annotationKey: entry.__dicomGroupKey,
      originalName: entry.__dicomGroupKey,
      displayName: `${seriesLabel} (${seriesFiles.length} slice${seriesFiles.length === 1 ? "" : "s"})`,
    };
  });
};

const roundCoordinate = (value) => Number(Number(value || 0).toFixed(3));

const getBoundsFromPoints = (points) => {
  if (!Array.isArray(points) || points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const right = Math.max(...xs);
  const bottom = Math.max(...ys);

  return {
    x: roundCoordinate(left),
    y: roundCoordinate(top),
    width: roundCoordinate(right - left),
    height: roundCoordinate(bottom - top),
  };
};

const getSerializedWorldPoints = (obj) => {
  const type = obj.customType || obj.type;

  if ((type === "polygon" || type === "polyline") && Array.isArray(obj.points)) {
    const pathOffset = obj.pathOffset || { x: 0, y: 0 };
    const matrix = fabric.util.composeMatrix({
      translateX: obj.left || 0,
      translateY: obj.top || 0,
      angle: obj.angle || 0,
      scaleX: (obj.scaleX ?? 1) * (obj.flipX ? -1 : 1),
      scaleY: (obj.scaleY ?? 1) * (obj.flipY ? -1 : 1),
      skewX: obj.skewX || 0,
      skewY: obj.skewY || 0,
    });

    return obj.points.map((point) => {
      const transformed = fabric.util.transformPoint(
        new fabric.Point(
          point.x - pathOffset.x,
          point.y - pathOffset.y
        ),
        matrix
      );
      return [roundCoordinate(transformed.x), roundCoordinate(transformed.y)];
    });
  }

  if (type === "rect" || type === "rectangle") {
    const x = obj.left || 0;
    const y = obj.top || 0;
    const w = (obj.width || 0) * (obj.scaleX ?? 1);
    const h = (obj.height || 0) * (obj.scaleY ?? 1);
    return [
      [roundCoordinate(x), roundCoordinate(y)],
      [roundCoordinate(x + w), roundCoordinate(y)],
      [roundCoordinate(x + w), roundCoordinate(y + h)],
      [roundCoordinate(x), roundCoordinate(y + h)],
    ];
  }

  return [];
};

const extractStandardData = (fabricObjects) => {
  if (!fabricObjects || !Array.isArray(fabricObjects)) return [];

  return fabricObjects
    .filter((obj) => {
      const type = obj.customType || obj.type;
      return ["polygon", "polyline", "rect", "rectangle"].includes(type);
    })
    .map((obj, index) => {
      const standardGeometry = obj.standardGeometry || {};
      const type = standardGeometry.type || obj.customType || obj.type;
      const points = Array.isArray(standardGeometry.points) && standardGeometry.points.length > 0
        ? standardGeometry.points
        : getSerializedWorldPoints(obj);
      const bbox = standardGeometry.bbox || getBoundsFromPoints(points);

      return {
        id: `annotation-${index + 1}`,
        schemaVersion: ANNOTATION_SCHEMA_VERSION,
        label: standardGeometry.label || obj.label || "Unlabeled",
        type,
        coordinateSystem: "image-pixel",
        points,
        bbox,
      };
    });
};

function Annotation() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, loading: authLoading, token } = useAuth();
  const navigate = useNavigate();
  const { taskId } = useParams();

  // 1. Task Data Hook
  const {
    isLoading, taskData,
    uploadedFiles: taskUploadedFiles, fetchTask
  } = useTaskData(taskId, isAuthenticated, token, i18n.language, navigate);

  // 2. Annotation Data Hook
  const {
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
    inputsByFileAndSlice, setInputsByFileAndSlice,
    currentSlice, setCurrentSlice,
    classificationByFileAndSlice, setClassificationByFileAndSlice,
    annotationsByFileAndSlice, setAnnotationsByFileAndSlice,
    saveSliceAnnotationToState,
    rightPanelOpen, setRightPanelOpen,
    viewType, setViewType,
    annotationRefs
  } = useAnnotationData();

  // AI prompting & inference state
  const [activeAIModel, setActiveAIModel] = useState("mock");
  const [enabledAIPromptTypes, setEnabledAIPromptTypes] = useState(["point", "box", "text"]);
  const [aiTextPrompt, setAiTextPrompt] = useState("");
  const [aiPromptIsPositive, setAiPromptIsPositive] = useState(true);
  const [activeAIPrompts, setActiveAIPrompts] = useState({ points: [], box: null });
  const [aiChatMessages, setAiChatMessages] = useState([]);

  const collaborationClientIdRef = useRef(
    `annotation-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
  const selectedFileNameRef = useRef(selectedFileName);
  const isDirtyRef = useRef(false);
  const [remoteAnnotationReload, setRemoteAnnotationReload] = useState(null);

  const alertTimerRef = useRef(null);
  const [pageAlert, setPageAlert] = useState(null);

  const showPageAlert = useCallback((type, message) => {
    if (alertTimerRef.current) {
      window.clearTimeout(alertTimerRef.current);
    }

    setPageAlert({ type, message });
    alertTimerRef.current = window.setTimeout(() => {
      setPageAlert(null);
      alertTimerRef.current = null;
    }, 4200);
  }, []);

  useEffect(() => {
    return () => {
      if (alertTimerRef.current) {
        window.clearTimeout(alertTimerRef.current);
      }
    };
  }, []);

  // 3. File Handling Hook
  const {
    files, uploadProgress, uploadMode, setUploadMode,
    handleDrop, handleFileChange, handleUpload, uploadedFiles: newlyUploadedFiles
  } = useFileHandling(taskId, token, setSelectedFileName, showPageAlert);

  const rawUploadedFiles = useMemo(() => {
    const seen = new Set();
    return [...taskUploadedFiles, ...newlyUploadedFiles].filter((file) => {
      const key = file.filename || file.url || file.originalName;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [taskUploadedFiles, newlyUploadedFiles]);

  const allUploadedFiles = useMemo(
    () => buildLogicalFileList(rawUploadedFiles),
    [rawUploadedFiles]
  );

  // -----------------------------------------------------------------------
  // UNSAVED CHANGES TRACKING
  //
  // isDirty becomes true when the user actually changes annotations,
  // classifications, or attribute inputs — NOT on the first load.
  //
  // Two refs gate the effect:
  //   isInitialLoadRef      — skips the very first fire (component mount)
  //   skipNextDirtyCheckRef — skips the fire that follows a save or a fresh
  //                           data load, where state updates are not user edits
  // -----------------------------------------------------------------------
  const [isDirty, setIsDirtyLocal] = useState(false);
  const [eventTicket, setEventTicket] = useState(null);

  useEffect(() => {
    selectedFileNameRef.current = selectedFileName;
  }, [selectedFileName]);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  const markDirty = useCallback(() => {
    setIsDirtyLocal(true);
  }, []);

  const handleMarkClean = useCallback(() => {
    setIsDirtyLocal(false);
  }, []);

  const setDirtyClassificationByFileAndSlice = useCallback((updater) => {
    markDirty();
    setClassificationByFileAndSlice(updater);
  }, [markDirty, setClassificationByFileAndSlice]);

  const setDirtyInputsByFileAndSlice = useCallback((updater) => {
    markDirty();
    setInputsByFileAndSlice(updater);
  }, [markDirty, setInputsByFileAndSlice]);

  // ── Navigation guard ──────────────────────────────────────────────
  const {
    markClean,
    showUnsavedModal,
    handleConfirmLeave,
    handleCancelLeave,
    guardedNavigate,
  } = useNavigationGuard({
    isDirtyExternal: isDirty,
    onMarkClean: handleMarkClean,
  });

  // -----------------------------------------------------------------------
  // AUTH & INIT
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
    } else if (taskId) {
      fetchTask();
    }
  }, [authLoading, isAuthenticated, token, taskId, fetchTask, navigate]);

  useEffect(() => {
    if (!taskId || !token) return undefined;
    let cancelled = false;
    let refreshTimer;

    const requestEventTicket = async () => {
      try {
        const response = await axios.post(
          apiUrl(`/api/annotation-events/${taskId}/ticket`),
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!cancelled) {
          setEventTicket(response.data.ticket);
          refreshTimer = window.setTimeout(requestEventTicket, 14 * 60 * 1000);
        }
      } catch (error) {
        if (!cancelled) console.warn('Failed to establish realtime collaboration', error);
      }
    };

    requestEventTicket();
    return () => {
      cancelled = true;
      window.clearTimeout(refreshTimer);
      setEventTicket(null);
    };
  }, [taskId, token]);

  useEffect(() => {
    if (!taskId || !token || typeof EventSource === "undefined") return;

    if (!eventTicket) return;
    const params = new URLSearchParams({
      ticket: eventTicket,
      clientId: collaborationClientIdRef.current,
    });
    const source = new EventSource(
      `${API_BASE_URL}/annotation-events/${taskId}?${params.toString()}`
    );

    const handleAnnotationUpdate = (event) => {
      try {
        const update = JSON.parse(event.data);
        if (!update?.filename || update.clientId === collaborationClientIdRef.current) {
          return;
        }

        const activeFile = selectedFileNameRef.current;
        const collaborator = update.updatedBy || t("Another collaborator");

        if (update.filename === activeFile) {
          if (isDirtyRef.current) {
            showPageAlert(
              "warning",
              t("{{collaborator}} saved updates for this file. Save your work before reloading to avoid overwriting local changes.", { collaborator })
            );
            return;
          }

          setRemoteAnnotationReload({
            filename: update.filename,
            version: Date.now(),
          });
          showPageAlert(
            "info",
            t("{{collaborator}} saved updates. The current file has been refreshed.", { collaborator })
          );
          return;
        }

        setRemoteAnnotationReload({
          filename: update.filename,
          version: Date.now(),
        });
        showPageAlert(
          "info",
          t("{{collaborator}} saved updates to another file in this task.", { collaborator })
        );
      } catch (err) {
        console.warn("Failed to process annotation update event", err);
      }
    };

    source.addEventListener("annotation-updated", handleAnnotationUpdate);
    source.onerror = () => {
      // EventSource reconnects automatically; keep this quiet unless parsing fails.
    };

    return () => {
      source.removeEventListener("annotation-updated", handleAnnotationUpdate);
      source.close();
    };
  }, [taskId, token, eventTicket, showPageAlert, t]);

  useEffect(() => {
    if (allUploadedFiles.length === 0) return;
    const selectedExists = allUploadedFiles.some(
      (file) => fileSelectionKey(file) === selectedFileName
    );
    if (!selectedFileName || !selectedExists) {
      setSelectedFileName(fileSelectionKey(allUploadedFiles[0]));
    }
  }, [allUploadedFiles, selectedFileName, setSelectedFileName]);

  // ── Labels ────────────────────────────────────────────────────────
  const [allProjectLabels, setAllProjectLabels] = useState([]);
  useEffect(() => {
    if (taskData?.labels) {
      setAllProjectLabels(
        taskData.labels.map(l => ({ value: l.name, label: l.name, color: l.color, type: l.type }))
      );
    }
  }, [taskData]);

  useEffect(() => {
    const relevant = allProjectLabels.filter(
      l => !selectedShape || l.type === selectedShape || !l.type
    );
    setLabelOptions(relevant);
    if (relevant.length > 0 && !relevant.find(l => l.value === selectedLabel)) {
      setSelectedLabel(relevant[0].value);
    }
  }, [selectedShape, allProjectLabels, selectedLabel, setSelectedLabel, setLabelOptions]);

  useEffect(() => {
    const opt = labelOptions.find(o => o.value === selectedLabel);
    if (opt) setBrushColor(opt.color);
  }, [selectedLabel, labelOptions, setBrushColor]);

  const allowedShapeIds = useMemo(() => {
    return taskData?.labels?.length
      ? Array.from(new Set(taskData.labels.map(l => l.type)))
      : SHAPES.map(s => s.name);
  }, [taskData]);

  const projectAttributes = useMemo(() => taskData?.attributes || [], [taskData]);
  const activeTool = useMemo(
    () => SHAPES.find((shape) => shape.name === selectedShape),
    [selectedShape]
  );
  const activeLabelOption = useMemo(
    () => labelOptions.find((option) => option.value === selectedLabel),
    [labelOptions, selectedLabel]
  );

  // ── File switch ───────────────────────────────────────────────────
  const handleFileSwitch = useCallback((newFileName) => {
    if (newFileName === selectedFileName) return;
    if (selectedFileName && annotationRefs.current[selectedFileName]?.current) {
      saveSliceAnnotationToState(
        selectedFileName,
        currentSlice,
        annotationRefs.current[selectedFileName].current.exportAnnotations()
      );
    }
    setTotalSlices(0);
    setCurrentSlice(0);
    setSelectedFileName(newFileName);
  }, [
    selectedFileName, currentSlice, annotationRefs,
    saveSliceAnnotationToState, setTotalSlices, setCurrentSlice, setSelectedFileName,
  ]);

  const clearAIPrompts = useCallback(() => {
    setActiveAIPrompts({ points: [], box: null });
    const canvasRef = annotationRefs.current[selectedFileName];
    canvasRef?.current?.clearAIPrompts();
  }, [selectedFileName, annotationRefs]);

  const runAIInference = useCallback(async () => {
    const runner = runnerRegistry.get(activeAIModel);
    if (!runner) {
      showPageAlert("error", "No inference runner found for model " + activeAIModel);
      return;
    }

    const prompts = [];
    
    if (enabledAIPromptTypes.includes("point") && activeAIPrompts.points.length > 0) {
      activeAIPrompts.points.forEach((pt) => {
        prompts.push(formatAIPrompt({ type: "point", x: pt.x, y: pt.y, isPositive: pt.isPositive }));
      });
    }

    if (enabledAIPromptTypes.includes("box") && activeAIPrompts.box) {
      const box = activeAIPrompts.box;
      prompts.push(formatAIPrompt({ type: "box", x1: box.x1, y1: box.y1, x2: box.x2, y2: box.y2 }));
    }

    if (enabledAIPromptTypes.includes("text") && aiTextPrompt) {
      prompts.push(formatAIPrompt({ type: "text", text: aiTextPrompt }));
    }

    if (prompts.length === 0) {
      showPageAlert("info", "Please provide a point, box, or text prompt first.");
      return;
    }

    try {
      showPageAlert("info", "Running AI inference...");
      const canvasRef = annotationRefs.current[selectedFileName];
      
      const imageContext = {
        width: canvasRef?.current?.fabricRef?.current?.width || 512,
        height: canvasRef?.current?.fabricRef?.current?.height || 512,
      };

      const results = await runner.predict(prompts, imageContext);

      let addedAny = false;
      results.forEach((output) => {
        if (output.type === "polygon" || output.type === "mask" || output.type === "bbox") {
          if (output.type === "polygon") {
            canvasRef?.current?.addAIAnnotation("polygon", { points: output.points });
            addedAny = true;
          } else if (output.type === "bbox") {
            canvasRef?.current?.addAIAnnotation("box", { x1: output.x1, y1: output.y1, x2: output.x2, y2: output.y2 });
            addedAny = true;
          }
        } else if (output.type === "classification") {
          const label = output.labels[0];
          if (label) {
            setDirtyClassificationByFileAndSlice((prev) => ({
              ...prev,
              [selectedFileName]: {
                ...(prev[selectedFileName] || {}),
                [currentSlice]: label,
              },
            }));
            showPageAlert("success", `AI predicted classification: ${label}`);
          }
        }
      });

      if (addedAny) {
        showPageAlert("success", "AI inference complete! Annotation added.");
        clearAIPrompts();
      }
    } catch (err) {
      console.error(err);
      showPageAlert("error", "AI Inference failed: " + (err.message || err));
    }
  }, [
    activeAIModel,
    enabledAIPromptTypes,
    activeAIPrompts,
    aiTextPrompt,
    selectedFileName,
    currentSlice,
    showPageAlert,
    annotationRefs,
    clearAIPrompts,
    setDirtyClassificationByFileAndSlice,
  ]);

  const handleAnnotationChange = useCallback((event) => {
    markDirty();
    if (event && event.type === "ai-prompt") {
      const { target } = event;
      if (target.type === "points") {
        setActiveAIPrompts((prev) => ({ ...prev, points: target.prompts }));
      } else if (target.type === "box") {
        setActiveAIPrompts((prev) => ({ ...prev, box: target }));
      }
    }
  }, [markDirty]);

  const handleConvertPolygonToMask = useCallback(() => {
    const canvasRef = annotationRefs.current[selectedFileName];
    if (!canvasRef?.current) return;

    const points = canvasRef.current.getSelectedShapePoints();
    if (!points) {
      showPageAlert("info", "Please select a polygon or polyline annotation on the canvas first.");
      return;
    }

    const width = canvasRef.current.fabricRef?.current?.width || 512;
    const height = canvasRef.current.fabricRef?.current?.height || 512;
    const maskGrid = polygonToMask(points, width, height);

    const tracedPoints = maskToPolygon(maskGrid, width, height);

    if (tracedPoints && tracedPoints.length > 0) {
      canvasRef.current.replaceSelectedShapePoints(tracedPoints);
      showPageAlert("success", "Successfully converted Polygon to 2D Mask and back to contour outline!");
    } else {
      showPageAlert("error", "Failed to trace mask outline during conversion.");
    }
  }, [selectedFileName, annotationRefs, showPageAlert]);

  const handleConvertMaskToPolygon = useCallback(() => {
    const canvasRef = annotationRefs.current[selectedFileName];
    if (!canvasRef?.current) return;

    const width = canvasRef.current.fabricRef?.current?.width || 512;
    const height = canvasRef.current.fabricRef?.current?.height || 512;
    const mockMask = Array(height).fill(null).map(() => Array(width).fill(0));

    const cy = Math.floor(height / 2);
    const cx = Math.floor(width / 2);
    for (let y = cy - 50; y < cy + 50; y++) {
      for (let x = cx - 50; x < cx + 50; x++) {
        mockMask[y][x] = 1;
      }
    }

    const tracedPoints = maskToPolygon(mockMask, width, height);
    if (tracedPoints && tracedPoints.length > 0) {
      canvasRef.current.addAIAnnotation("polygon", { points: tracedPoints });
      showPageAlert("success", "Successfully converted mock binary mask to vector polygon contour!");
    } else {
      showPageAlert("error", "Failed to trace mock mask outline.");
    }
  }, [selectedFileName, annotationRefs, showPageAlert]);

  const handleSendAiChatMessage = useCallback(async (text) => {
    setAiChatMessages((prev) => [...prev, { sender: "user", text }]);

    try {
      const response = await axios.post(
        apiUrl("/api/ai/chat"),
        { message: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const reply = response.data?.reply || "No response from AI assistant.";
      setAiChatMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.error || error.message || "Failed to contact assistant.";
      setAiChatMessages((prev) => [...prev, { sender: "ai", text: `Error: ${errorMsg}` }]);
    }
  }, [token]);

  const handleCreateDeveloperTicket = useCallback(async ({ title, description }) => {
    try {
      const chatContext = aiChatMessages
        .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
        .join("\n");
      const response = await axios.post(
        apiUrl("/api/tickets/create"),
        { title, description, chatContext },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showPageAlert("success", `Developer ticket created successfully! Ticket ID: ${response.data.ticketId}`);
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.error || error.message || "Failed to create ticket.";
      showPageAlert("error", `Failed to create developer ticket: ${errorMsg}`);
    }
  }, [token, aiChatMessages, showPageAlert]);

  // ── Save ──────────────────────────────────────────────────────────
  const handleSaveAll = useCallback(async () => {
    if (!selectedFileName) {
      markClean();
      return true;
    }
    try {
      let currentCanvasJson = null;
      const annotationsSnapshot = { ...annotationsByFileAndSlice };
      if (annotationRefs.current[selectedFileName]?.current) {
        currentCanvasJson =
          annotationRefs.current[selectedFileName].current.exportAnnotations();
        saveSliceAnnotationToState(selectedFileName, currentSlice, currentCanvasJson);
        annotationsSnapshot[selectedFileName] = {
          ...(annotationsSnapshot[selectedFileName] || {}),
          [currentSlice]: currentCanvasJson,
        };
      }

      const fileNamesToSave = new Set([
        selectedFileName,
        ...Object.keys(annotationsSnapshot),
        ...Object.keys(classificationByFileAndSlice),
        ...Object.keys(inputsByFileAndSlice),
      ]);

      const saveRequests = Array.from(fileNamesToSave).map((fileName) => {
        const fileAnnotations = annotationsSnapshot[fileName] || {};
        const fileClassifications = classificationByFileAndSlice[fileName] || {};
        const fileInputs = inputsByFileAndSlice[fileName] || {};

        const allActiveSlices = new Set([
          ...Object.keys(fileAnnotations),
          ...Object.keys(fileClassifications),
          ...Object.keys(fileInputs),
        ]);

        if (fileName === selectedFileName) {
          allActiveSlices.add(currentSlice.toString());
        }

        const slicesPayload = {};
        allActiveSlices.forEach(idx => {
          const internalSliceIndex = Number(idx);
          if (!Number.isFinite(internalSliceIndex)) return;

          const sliceNumber = toSavedSliceNumber(internalSliceIndex);
          const savedSliceKey = toSavedSliceKey(internalSliceIndex);
          const editorState = fileAnnotations[idx];
          const standardData =
            editorState?.objects ? extractStandardData(editorState.objects) : [];

          slicesPayload[savedSliceKey] = {
            schemaVersion: ANNOTATION_SCHEMA_VERSION,
            sliceNumber,
            sliceIndexBase: 1,
            coordinateSystem: "image-pixel",
            editorState,
            annotations: standardData,
            standardData,
            classification: normalizeClassificationForSave(fileClassifications[idx]),
            attributes: fileInputs[idx] || {},
          };
        });

        return axios.post(
          apiUrl('/save-annotations'),
          {
            taskId,
            filename: fileName,
            sliceData: slicesPayload,
            clientId: collaborationClientIdRef.current,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      });

      await Promise.all(saveRequests);

      markClean();
      showPageAlert("success", t("Changes Saved Successfully!"));
      return true;
    } catch (err) {
      console.error("Save failed", err);
      showPageAlert("error", t("Failed to save annotations."));
      return false;
    }
  }, [
    selectedFileName, currentSlice, annotationRefs,
    annotationsByFileAndSlice, classificationByFileAndSlice, inputsByFileAndSlice,
    taskId, token, saveSliceAnnotationToState, markClean, showPageAlert, t,
  ]);

  // ── Render guards ─────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        {t("Checking session...")}
      </div>
    );
  }
  if (!isAuthenticated) return null;
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        {t("Loading Task...")}
      </div>
    );
  }

  return (
    <div className="annotation-page">
      <Header page="tasks" guardedNavigate={guardedNavigate} />

      <div className="annotation-task-strip">
        <div className="annotation-task-strip-main">
          <TaskInfoBar
            taskData={taskData} files={allUploadedFiles}
            selectedFileName={selectedFileName} onFileSelect={handleFileSwitch}
          />
        </div>
        {taskId && (
          <div className="annotation-task-timer">
            <TaskTimer taskId={taskId} token={token} />
          </div>
        )}
      </div>

      {allUploadedFiles.length === 0 ? (
        <FileUploadSection
          files={files} uploadProgress={uploadProgress}
          uploadMode={uploadMode} setUploadMode={setUploadMode}
          handleDrop={handleDrop} handleFileChange={handleFileChange}
          handleUpload={() => handleUpload().then(() => fetchTask())}
        />
      ) : (
        <>
          <main
            className={[
              "annotation-workspace",
              openSection ? "has-left-drawer" : "",
              rightPanelOpen ? "has-right-panel" : "",
            ].filter(Boolean).join(" ")}
          >
            <ToolbarLeft
              shapes={SHAPES} allowedShapeIds={allowedShapeIds}
              selectedShape={selectedShape} setSelectedShape={setSelectedShape}
              setToolChangeId={setToolChangeId} sectionIcons={SECTION_ICONS}
              openSection={openSection} setOpenSection={setOpenSection}
            />

            <LeftDrawer
              openSection={openSection}
              setOpenSection={setOpenSection}
              windowCenter={windowCenter} windowWidth={windowWidth}
              setWindowCenter={setWindowCenter} setWindowWidth={setWindowWidth}
              annotationOpacity={annotationOpacity} setAnnotationOpacity={setAnnotationOpacity}
              selectedShape={selectedShape}
              brushColor={brushColor} setBrushColor={setBrushColor}
              brushSize={brushSize} setBrushSize={setBrushSize}
              selectedLabel={selectedLabel} setSelectedLabel={setSelectedLabel}
              labelOptions={labelOptions} t={t}
              activeAIModel={activeAIModel} setActiveAIModel={setActiveAIModel}
              enabledAIPromptTypes={enabledAIPromptTypes} setEnabledAIPromptTypes={setEnabledAIPromptTypes}
              aiTextPrompt={aiTextPrompt} setAiTextPrompt={setAiTextPrompt}
              aiPromptIsPositive={aiPromptIsPositive} setAiPromptIsPositive={setAiPromptIsPositive}
              onRunAIInference={runAIInference}
              onClearAIPrompts={clearAIPrompts}
              onConvertPolygonToMask={handleConvertPolygonToMask}
              onConvertMaskToPolygon={handleConvertMaskToPolygon}
            />

            <section className="annotation-stage" aria-label="Medical image annotation viewer">
              <div className='annotation-stage-header'>
                <div className='annotation-stage-title'>
                  <span className='annotation-stage-icon' aria-hidden='true'>
                    <ScanLine size={18} />
                  </span>
                  <div>
                    <strong>{t('Image workspace')}</strong>
                    <span>{t(viewType.charAt(0).toUpperCase() + viewType.slice(1))} | {t('Slice')} {currentSlice + 1} / {totalSlices || 0}</span>
                  </div>
                </div>
                <div className='annotation-stage-state'>
                  <span className={`workspace-save-state ${isDirty ? 'dirty' : 'saved'}`}>
                    <CircleDot size={13} />
                    {isDirty ? t('Unsaved changes') : t('All changes saved')}
                  </span>
                  <span className='workspace-context-chip'>
                    <small>{t('Tool')}</small>
                    <strong>{activeTool ? t(activeTool.label) : t('Select')}</strong>
                  </span>
                  <span className='workspace-context-chip label-chip'>
                    <i style={{ backgroundColor: activeLabelOption?.color || '#94a3b8' }} />
                    <small>{t('Label')}</small>
                    <strong>{activeLabelOption?.label || selectedLabel || t('None')}</strong>
                  </span>
                </div>
              </div>
              <div className='annotation-stage-body'>
                <MainViewer
                uploadedFiles={allUploadedFiles} selectedFileName={selectedFileName}
                windowCenter={windowCenter} windowWidth={windowWidth}
                currentSlice={currentSlice} setCurrentSlice={setCurrentSlice}
                setTotalSlices={setTotalSlices}
                zoomLevel={zoomLevel} zoomRegion={zoomRegion}
                isZoomMode={isZoomMode} viewType={viewType}
                selectedShape={selectedShape} selectedLabel={selectedLabel}
                brushColor={brushColor} brushSize={brushSize}
                toolChangeId={toolChangeId} annotationOpacity={annotationOpacity}
                classificationByFileAndSlice={classificationByFileAndSlice}
                annotationsByFileAndSlice={annotationsByFileAndSlice}
                saveSliceAnnotationToState={saveSliceAnnotationToState}
                setInputsByFileAndSlice={setInputsByFileAndSlice}
                setClassificationByFileAndSlice={setClassificationByFileAndSlice}
                setAnnotationsByFileAndSlice={setAnnotationsByFileAndSlice}
                onAnnotationChange={handleAnnotationChange}
                annotationRefs={annotationRefs}
                totalSlices={totalSlices}
                taskId={taskId}
                remoteAnnotationReload={remoteAnnotationReload}
                setZoomLevel={setZoomLevel}
                setZoomRegion={setZoomRegion}
                setIsZoomMode={setIsZoomMode}
              />
              </div>
            </section>

            <ToolbarRight
              buttons_right={RIGHT_BUTTONS} buttons={LEFT_BUTTONS}
              selectedFileName={selectedFileName} annotationRefs={annotationRefs}
              rightPanelOpen={rightPanelOpen} setRightPanelOpen={setRightPanelOpen}
              onSave={handleSaveAll}
            />

            <RightPanel
              rightPanelOpen={rightPanelOpen} setRightPanelOpen={setRightPanelOpen} t={t}
              viewType={viewType} setViewType={setViewType}
              selectedFileName={selectedFileName}
              currentSlice={currentSlice} setCurrentSlice={setCurrentSlice}
              classificationByFileAndSlice={classificationByFileAndSlice}
              setClassificationByFileAndSlice={setDirtyClassificationByFileAndSlice}
              inputsByFileAndSlice={inputsByFileAndSlice}
              setInputsByFileAndSlice={setDirtyInputsByFileAndSlice}
              totalSlices={totalSlices}
              isZoomMode={isZoomMode} setIsZoomMode={setIsZoomMode}
              zoomLevel={zoomLevel} setZoomLevel={setZoomLevel}
              zoomRegion={zoomRegion} setZoomRegion={setZoomRegion}
              projectAttributes={projectAttributes}
              aiChatMessages={aiChatMessages}
              handleSendAiChatMessage={handleSendAiChatMessage}
              handleCreateDeveloperTicket={handleCreateDeveloperTicket}
            />
          </main>
        </>
      )}

      {pageAlert && (
        <div className={`annotation-alert ${pageAlert.type}`} role="status" aria-live="polite">
          <div className="annotation-alert-content">
            <strong>{pageAlert.type === "success" ? t("Saved") : t("Attention needed")}</strong>
            <span>{pageAlert.message}</span>
          </div>
          <button
            type="button"
            className="annotation-alert-close"
            onClick={() => setPageAlert(null)}
            aria-label={t("Dismiss notification")}
          >
            x
          </button>
        </div>
      )}

      <UnsavedChangesModal
        open={showUnsavedModal}
        t={t}
        onSaveAndLeave={async () => {
          const saved = await handleSaveAll();
          if (saved) handleConfirmLeave();
        }}
        onLeaveWithoutSaving={handleConfirmLeave}
        onCancel={handleCancelLeave}
      />
    </div>
  );
}

export default Annotation;
