import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Layers3, ScanLine, ZoomIn } from 'lucide-react';
import NiftiViewer from '../NiftiViewer';
import DicomViewer from '../DicomViewer';
import AnnotationCanvas from '../AnnotationCanvas';
import { useAuth } from '../AuthContext';
import {
  normalizeClassificationForState,
  toInternalSliceKey,
} from '../annotationFormat';

const VIEWER_SIZE = 500;
const VIEWER_FRAME_WIDTH = 526;
const VIEWER_FRAME_HEIGHT = 564;

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
  const viewerWrapperRef = useRef(null);
  const mainViewerRef = useRef(null);
  const [fitScale, setFitScale] = useState(1);
  const [dragStart, setDragStart] = useState(null);
  const [dragRect, setDragRect] = useState(null);

  useEffect(() => {
    const root = mainViewerRef.current;
    if (!root) return undefined;

    const updateScale = (width, height) => {
      if (width < 120 || height < 120) return;
      const availableScale = Math.min(
        (width - 4) / VIEWER_FRAME_WIDTH,
        (height - 4) / VIEWER_FRAME_HEIGHT
      );
      const nextScale = Math.min(1.55, Math.max(availableScale, 0.58));
      setFitScale((previous) => (
        Math.abs(previous - nextScale) < 0.01 ? previous : nextScale
      ));
    };

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(([entry]) => {
        if (entry) updateScale(entry.contentRect.width, entry.contentRect.height);
      });
      observer.observe(root);
      return () => observer.disconnect();
    }

    const handleResize = () => updateScale(root.clientWidth, root.clientHeight);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const file = useMemo(
    () => uploadedFiles.find((item) => fileSelectionKey(item) === selectedFileName),
    [uploadedFiles, selectedFileName]
  );

  if (file && selectedFileName && !annotationRefs.current[selectedFileName]) {
    annotationRefs.current[selectedFileName] = React.createRef();
  }

  const currentCanvasRef = file && selectedFileName
    ? annotationRefs.current[selectedFileName]
    : null;

  useEffect(() => {
    if (!selectedFileName || !token || !taskId) return undefined;
    const forceReload = (
      remoteAnnotationReload?.filename === selectedFileName &&
      remoteAnnotationReload?.version
    );

    if (!forceReload && loadedAnnotationFilesRef.current.has(selectedFileName)) {
      return undefined;
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
          const sliceData = sliceDataMap[savedSliceKey] || {};
          const internalSliceKey = toInternalSliceKey(savedSliceKey, sliceData);
          const classification = normalizeClassificationForState(sliceData.classification);

          if (sliceData.editorState) newAnnotations[internalSliceKey] = sliceData.editorState;
          if (sliceData.attributes) newInputs[internalSliceKey] = sliceData.attributes;
          if (classification) newClassifications[internalSliceKey] = classification;
        });

        setAnnotationsByFileAndSlice((previous) => ({
          ...previous,
          [selectedFileName]: newAnnotations,
        }));
        setInputsByFileAndSlice((previous) => ({
          ...previous,
          [selectedFileName]: newInputs,
        }));
        setClassificationByFileAndSlice((previous) => ({
          ...previous,
          [selectedFileName]: newClassifications,
        }));
        loadedAnnotationFilesRef.current.add(selectedFileName);
      } catch (error) {
        if (!cancelled) console.error('Error loading annotations:', error);
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

  const currentSliceData = annotationsByFileAndSlice[selectedFileName]?.[currentSlice];

  useEffect(() => {
    if (!currentCanvasRef?.current) return;

    const canvas = currentCanvasRef.current;
    const isSliceChange = prevSliceRef.current !== currentSlice;
    const isFileChange = prevFileRef.current !== selectedFileName;
    const isDataUpdate = prevDataRef.current !== currentSliceData;
    if (!isSliceChange && !isFileChange && !isDataUpdate) return;

    if (isSliceChange || isFileChange) {
      const oldSlice = prevSliceRef.current;
      const oldFile = prevFileRef.current;
      if (oldFile === selectedFileName && oldSlice !== currentSlice) {
        saveSliceAnnotationToState(oldFile, oldSlice, canvas.exportAnnotations());
      }
    }

    canvas.clearAnnotations({ silent: true });
    if (currentSliceData) canvas.importAnnotations(currentSliceData);
    prevSliceRef.current = currentSlice;
    prevFileRef.current = selectedFileName;
    prevDataRef.current = currentSliceData;
  }, [
    currentSlice,
    selectedFileName,
    currentCanvasRef,
    currentSliceData,
    saveSliceAnnotationToState,
  ]);

  const fileStack = useMemo(() => {
    if (!file) return [];
    return Array.isArray(file.files) && file.files.length > 0 ? file.files : [file];
  }, [file]);

  const isDicom = file?.type === 'dicom';
  const imageIds = useMemo(
    () => (
      isDicom
        ? fileStack
            .filter((item) => item.type === 'dicom' && item.url)
            .map((item) => `wadouri:${item.url}`)
        : []
    ),
    [isDicom, fileStack]
  );

  const handleSliceChange = useCallback((nextSlice) => {
    setCurrentSlice(nextSlice);
  }, [setCurrentSlice]);

  const handleTotalSlicesChange = useCallback((nextTotal) => {
    setTotalSlices((previousTotal) => (
      previousTotal === nextTotal ? previousTotal : nextTotal
    ));
  }, [setTotalSlices]);

  const handleAnnotationChange = useCallback(() => {
    onAnnotationChange?.();
  }, [onAnnotationChange]);

  const getZoomTransform = () => {
    if (!zoomRegion || zoomLevel <= 1) {
      return { transform: 'none', transformOrigin: 'top left' };
    }
    const originX = zoomRegion.x + zoomRegion.width / 2;
    const originY = zoomRegion.y + zoomRegion.height / 2;
    return {
      transform: `scale(${zoomLevel})`,
      transformOrigin: `${originX}% ${originY}%`,
      transition: 'transform 0.2s ease',
    };
  };

  const handleZoomMouseDown = useCallback((event) => {
    if (!isZoomMode || !viewerWrapperRef.current) return;
    event.preventDefault();
    const rect = viewerWrapperRef.current.getBoundingClientRect();
    setDragStart({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
    setDragRect(null);
  }, [isZoomMode]);

  const handleZoomMouseMove = useCallback((event) => {
    if (!isZoomMode || !dragStart || !viewerWrapperRef.current) return;
    event.preventDefault();
    const rect = viewerWrapperRef.current.getBoundingClientRect();
    const currentX = ((event.clientX - rect.left) / rect.width) * 100;
    const currentY = ((event.clientY - rect.top) / rect.height) * 100;
    setDragRect({
      x: Math.min(dragStart.x, currentX),
      y: Math.min(dragStart.y, currentY),
      width: Math.abs(currentX - dragStart.x),
      height: Math.abs(currentY - dragStart.y),
    });
  }, [isZoomMode, dragStart]);

  const handleZoomMouseUp = useCallback((event) => {
    if (!isZoomMode || !dragStart || !dragRect) return;
    event.preventDefault();
    if (dragRect.width > 2 && dragRect.height > 2) {
      const newZoom = Math.min(100 / dragRect.width, 100 / dragRect.height, 8);
      setZoomRegion?.(dragRect);
      setZoomLevel?.(Number(newZoom.toFixed(2)));
    }
    setDragStart(null);
    setDragRect(null);
    setIsZoomMode?.(false);
  }, [
    isZoomMode,
    dragStart,
    dragRect,
    setZoomRegion,
    setZoomLevel,
    setIsZoomMode,
  ]);

  if (!file) return null;

  const classification = classificationByFileAndSlice[selectedFileName]?.[currentSlice];
  const finalLabel = selectedLabel && typeof selectedLabel === 'object'
    ? selectedLabel.name
    : selectedLabel;
  const zoomStyle = getZoomTransform();

  return (
    <div className='main-viewer' ref={mainViewerRef}>
      <div
        className='viewer-fit-frame'
        style={{
          width: `${VIEWER_FRAME_WIDTH * fitScale}px`,
          height: `${VIEWER_FRAME_HEIGHT * fitScale}px`,
        }}
      >
        <div
          className='viewer-fit-content'
          style={{ transform: `scale(${fitScale})` }}
        >
          <div
            className={[
              'viewer-container',
              classification === 'positive' ? 'positive' : '',
              classification === 'negative' ? 'negative' : '',
            ].filter(Boolean).join(' ')}
          >
            <div className='viewer-shell'>
              {isZoomMode && (
                <div className='zoom-mode-banner'>
                  <ZoomIn size={15} />
                  Draw a rectangle over the region to inspect
                </div>
              )}

              <div className='image-wrapper'>
                <div
                  ref={viewerWrapperRef}
                  className='viewer-transform-root'
                  style={{ cursor: isZoomMode ? 'crosshair' : 'default' }}
                  onMouseDown={handleZoomMouseDown}
                  onMouseMove={handleZoomMouseMove}
                  onMouseUp={handleZoomMouseUp}
                >
                  <div style={{ ...zoomStyle, willChange: 'transform' }}>
                    {isDicom ? (
                      <DicomViewer
                        imageIds={imageIds}
                        windowCenter={windowCenter}
                        windowWidth={windowWidth}
                        currentSlice={currentSlice}
                        onSliceChange={handleSliceChange}
                        setTotalSlices={handleTotalSlicesChange}
                        viewType={viewType}
                        width={VIEWER_SIZE}
                        height={VIEWER_SIZE}
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
                        width={VIEWER_SIZE}
                        height={VIEWER_SIZE}
                      />
                    )}
                  </div>

                  <div
                    className='annotation-layer'
                    style={{ pointerEvents: isZoomMode ? 'none' : 'all' }}
                  >
                    <AnnotationCanvas
                      ref={currentCanvasRef}
                      mode={selectedShape}
                      width={VIEWER_SIZE}
                      height={VIEWER_SIZE}
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

                  {isZoomMode && dragRect && (
                    <div
                      className='zoom-selection-rect'
                      style={{
                        left: `${dragRect.x}%`,
                        top: `${dragRect.y}%`,
                        width: `${dragRect.width}%`,
                        height: `${dragRect.height}%`,
                      }}
                    />
                  )}

                  {classification && (
                    <div className={`classification-tag ${classification}`}>
                      {classification.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <footer className='viewer-footer'>
                <span><ScanLine size={15} /> {viewType} view</span>
                <strong>Slice {currentSlice + 1} / {totalSlices || 0}</strong>
                <span>
                  {zoomLevel > 1 ? <><ZoomIn size={14} /> {zoomLevel.toFixed(1)}x</> : <><Layers3 size={14} /> 100%</>}
                </span>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainViewer;
