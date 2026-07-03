// annotation/components/AnnotationCanvas.js
import React, {
  useEffect,
  useImperativeHandle,
  forwardRef,
  useRef,
} from "react";
import { fabric } from "fabric";
import {
  isAxisAlignedRectangle,
  isBoundingBoxAnnotation,
  resizeBoundingBoxPoints,
} from "./annotationGeometry";

const AnnotationCanvas = forwardRef(
  (
    {
      mode, // 'brush', 'rectangle', 'polygon', 'polyline', 'ellipse', 'select'
      width,
      height,
      selectedLabel,
      brushColor,
      brushSize,
      toolChangeId,
      annotationOpacity = 0.5,
      zoomLevel = 1,
      onShapeComplete,
    },
    ref
  ) => {
    const canvasRef = useRef(null);
    const fabricRef = useRef(null);

    // --- State Refs ---
    const drawingModeRef = useRef(mode);
    const labelRef = useRef(selectedLabel);
    const colorRef = useRef(brushColor);
    const opacityRef = useRef(annotationOpacity);
    const isMouseDownRef = useRef(false);

    // --- Drawing State ---
    const polygonPoints = useRef([]);
    const activeLine = useRef(null);
    const activeShape = useRef(null);
    const pointArray = useRef([]);

    // Rectangle State
    const isDrawingBox = useRef(false);
    const boxStart = useRef(null);
    const previewBox = useRef(null);

    // Ellipse State
    const isDrawingEllipse = useRef(false);
    const ellipseStart = useRef(null);
    const previewEllipse = useRef(null);

    // Guides
    const crosshairLines = useRef({ horizontal: null, vertical: null });

    const ANNOTATION_STROKE_WIDTH = 2;
    const HANDLE_RADIUS = 5;
    const LABEL_GAP = 5;
    const LABEL_FONT_SIZE = 11;
    const GENERATED_EDGE_POINT_SPACING = 45;
    const LABEL_CANVAS_PADDING = 4;

    // --- Sync Props to Refs ---
    useEffect(() => { labelRef.current = selectedLabel; }, [selectedLabel]);

    // --- Color Helpers ---
    const getColors = () => {
      const colorInput = colorRef.current || "#0066cc";
      const opacity = opacityRef.current !== undefined ? opacityRef.current : 0.5;

      const fColor = new fabric.Color(colorInput);
      const fill = fColor.setAlpha(opacity).toRgba();
      const stroke = fColor.setAlpha(1).toRgba();

      return { fill, stroke };
    };

    const getBrushColor = () => {
      const { fill } = getColors();
      return fill;
    };

    const getWorldPoints = (shape) => {
      if (!shape) return [];

      if (
        (shape.customType === "polygon" || shape.customType === "polyline") &&
        Array.isArray(shape.points)
      ) {
        const matrix = shape.calcTransformMatrix();
        const pathOffset = shape.pathOffset || { x: 0, y: 0 };
        return shape.points.map((point) => {
          const localPoint = {
            x: point.x - pathOffset.x,
            y: point.y - pathOffset.y,
          };
          return fabric.util.transformPoint(localPoint, matrix);
        });
      }

      const bound = shape.getBoundingRect();
      return [
        { x: bound.left, y: bound.top },
        { x: bound.left + bound.width, y: bound.top },
        { x: bound.left + bound.width, y: bound.top + bound.height },
        { x: bound.left, y: bound.top + bound.height },
      ];
    };

    const getBoundsFromPoints = (points) => {
      if (!Array.isArray(points) || points.length === 0) {
        return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 };
      }

      const xs = points.map((point) => point.x);
      const ys = points.map((point) => point.y);
      const left = Math.min(...xs);
      const top = Math.min(...ys);
      const right = Math.max(...xs);
      const bottom = Math.max(...ys);
      return {
        left,
        top,
        width: right - left,
        height: bottom - top,
        right,
        bottom,
      };
    };

    const getShapeVisualBounds = (shape) => {
      const points = getWorldPoints(shape);
      if (points.length > 0) return getBoundsFromPoints(points);

      const bound = shape.getBoundingRect();
      return {
        ...bound,
        right: bound.left + bound.width,
        bottom: bound.top + bound.height,
      };
    };

    const clampToCanvas = (value, min, max) => Math.min(Math.max(value, min), max);

    const getLabelPosition = (shape, labelText = null) => {
      const bound = getShapeVisualBounds(shape);
      const canvas = fabricRef.current;
      const canvasWidth = canvas?.getWidth?.() || width || 0;
      const canvasHeight = canvas?.getHeight?.() || height || 0;
      const labelWidth = labelText?.width || 0;
      const maxLeft = Math.max(LABEL_CANVAS_PADDING, canvasWidth - labelWidth - LABEL_CANVAS_PADDING);
      const canPlaceAbove = bound.top >= LABEL_FONT_SIZE + LABEL_GAP + LABEL_CANVAS_PADDING;
      const belowTop = Math.min(
        canvasHeight - LABEL_CANVAS_PADDING,
        bound.bottom + LABEL_GAP
      );

      return {
        left: clampToCanvas(bound.left, LABEL_CANVAS_PADDING, maxLeft),
        top: canPlaceAbove ? bound.top - LABEL_GAP : belowTop,
        originY: canPlaceAbove ? "bottom" : "top",
      };
    };

    const roundCoordinate = (value) => Number(Number(value || 0).toFixed(3));

    const getStandardGeometry = (shape) => {
      const points = getWorldPoints(shape).map((point) => [
        roundCoordinate(point.x),
        roundCoordinate(point.y),
      ]);
      const bounds = getBoundsFromPoints(points.map(([x, y]) => ({ x, y })));

      return {
        type: shape.annotationKind || shape.customType || shape.type,
        label: shape.label || "Unlabeled",
        coordinateSystem: "image-pixel",
        points,
        bbox: {
          x: roundCoordinate(bounds.left),
          y: roundCoordinate(bounds.top),
          width: roundCoordinate(bounds.width),
          height: roundCoordinate(bounds.height),
        },
      };
    };

    const attachStandardGeometry = (canvas) => {
      canvas.getObjects().forEach((obj) => {
        if (
          obj.excludeFromExport ||
          obj.customType === "annotation-label" ||
          obj.customType === "vertex-handle"
        ) {
          return;
        }

        obj.standardGeometry = getStandardGeometry(obj);
      });
    };

    const addGeneratedClosingEdgePoints = (points) => {
      if (!Array.isArray(points) || points.length < 3) return points;

      const first = points[0];
      const last = points[points.length - 1];
      const distance = Math.hypot(first.x - last.x, first.y - last.y);
      const generatedCount = Math.floor(distance / GENERATED_EDGE_POINT_SPACING);

      if (generatedCount < 1) return points;

      const generatedPoints = [];
      for (let i = 1; i <= generatedCount; i += 1) {
        const ratio = i / (generatedCount + 1);
        generatedPoints.push({
          x: last.x + (first.x - last.x) * ratio,
          y: last.y + (first.y - last.y) * ratio,
        });
      }

      return [...points, ...generatedPoints];
    };

    const bringEditingChromeToFront = (canvas) => {
      if (!canvas || !canvas.getElement()) return;

      canvas.getObjects().forEach((obj) => {
        if (obj.customType === "annotation-label" && typeof obj.bringToFront === "function") {
          obj.bringToFront();
        }
      });

      canvas.getObjects().forEach((obj) => {
        if (obj.customType === "vertex-handle" && typeof obj.bringToFront === "function") {
          obj.bringToFront();
        }
      });
    };

    // --- ZOOM UPDATE ---
    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas || !canvas.getElement()) return;

      const center = { x: canvas.getWidth() / 2, y: canvas.getHeight() / 2 };
      canvas.zoomToPoint(center, zoomLevel);
      canvas.requestRenderAll();
    }, [zoomLevel]);

    // --- DYNAMIC OPACITY & COLOR UPDATE ---
    useEffect(() => {
      opacityRef.current = annotationOpacity;
      colorRef.current = brushColor;

      const canvas = fabricRef.current;
      if (!canvas || !canvas.getElement()) return;

      const { fill, stroke } = getColors();

      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = fill;
      }

      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        if (
          activeObject.type === 'polygon' ||
          activeObject.type === 'rect' ||
          activeObject.type === 'ellipse' ||
          activeObject.customType === 'polygon'
        ) {
          activeObject.set({ fill: fill, stroke: stroke });
        } else if (activeObject.type === 'path' || activeObject.customType === 'path') {
          activeObject.set({ stroke: fill });
        }
        canvas.requestRenderAll();
      }
    }, [annotationOpacity, brushColor]);

    // --- API Exposed to Parent ---
    useImperativeHandle(ref, () => ({
      exportAnnotations: () => {
        if (fabricRef.current) {
          cleanupTempObjects(fabricRef.current);
          attachStandardGeometry(fabricRef.current);
          return fabricRef.current.toJSON([
            "label",
            "customType",
            "annotationKind",
            "standardGeometry",
          ]);
        }
        return null;
      },
      getSVG: () => fabricRef.current?.toSVG(),
      importAnnotations: (json) => {
        const canvas = fabricRef.current;
        if (canvas && json) {
          cleanupTempObjects(canvas);
          canvas.loadFromJSON(json, () => {
            if (!canvas.getElement()) return;

            const objects = canvas.getObjects().slice();
            objects.forEach((obj) => {
              if (
                ["vertex-handle", "temp-point", "temp-line", "temp-polygon", "temp-polyline", "preview-box", "preview-ellipse"].includes(obj.customType)
              ) {
                canvas.remove(obj);
                return;
              }
              if (obj.labelText) delete obj.labelText;
              if (obj.editHandles) delete obj.editHandles;
            });

            canvas.getObjects().forEach((obj) => {
              if (
                !obj.annotationKind &&
                obj.customType === "polygon" &&
                isAxisAlignedRectangle(obj.points)
              ) {
                obj.annotationKind = "rectangle";
              }
              if (obj.customType === "polygon" || obj.customType === "polyline") {
                generateVertexHandles(obj, canvas);
              }
              if (obj.label) {
                addLabelToShape(obj, obj.label);
              }
            });

            const center = { x: canvas.getWidth() / 2, y: canvas.getHeight() / 2 };
            canvas.zoomToPoint(center, zoomLevel);

            bringEditingChromeToFront(canvas);
            canvas.requestRenderAll();
          });
        }
      },
      clearAnnotations: (options = {}) => {
        const canvas = fabricRef.current;
        if (!canvas || !canvas.getContext()) return;
        const hadAnnotations = canvas.getObjects().some((obj) => {
          return !obj.excludeFromExport && obj.customType !== "annotation-label";
        });

        canvas.clear();
        canvas.backgroundColor = "transparent";

        cleanupTempObjects(canvas);

        const center = { x: canvas.getWidth() / 2, y: canvas.getHeight() / 2 };
        canvas.zoomToPoint(center, zoomLevel);

        canvas.requestRenderAll();
        if (!options.silent && hadAnnotations && onShapeComplete) {
          onShapeComplete({ type: "clear", target: null });
        }
      },
      deleteSelected: () => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();
        if (drawingModeRef.current !== 'select' && polygonPoints.current.length > 0) return;
        if (activeObject) {
          removeShapeAndLabel(activeObject, canvas);
        }
      },
    }));

    // --- Strict Cleanup Helper ---
    const cleanupTempObjects = (canvas) => {
      if (!canvas || !canvas.getElement()) return;

      polygonPoints.current = [];
      pointArray.current = [];
      activeLine.current = null;
      activeShape.current = null;
      isDrawingBox.current = false;
      isDrawingEllipse.current = false;
      boxStart.current = null;
      ellipseStart.current = null;
      isMouseDownRef.current = false;

      canvas.discardActiveObject();

      const tempTypes = new Set([
        "temp-point",
        "temp-line",
        "temp-polygon",
        "temp-polyline",
        "preview-box",
        "preview-ellipse"
      ]);

      const objects = canvas.getObjects();
      for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        if (obj.customType && tempTypes.has(obj.customType)) {
          canvas.remove(obj);
        }
      }

      if (crosshairLines.current.horizontal) {
        canvas.remove(crosshairLines.current.horizontal);
        canvas.remove(crosshairLines.current.vertical);
        crosshairLines.current = { horizontal: null, vertical: null };
      }

      canvas.requestRenderAll();
    };

    const addLabelToShape = (shape, label) => {
      if (!fabricRef.current) return;
      const labelString = label || "";

      if (shape.labelText && typeof shape.labelText.set === "function") {
        fabricRef.current.remove(shape.labelText);
      }

      const position = getLabelPosition(shape);
      const text = new fabric.Text(labelString, {
        left: position.left,
        top: position.top,
        originX: "left",
        originY: position.originY,
        fontSize: LABEL_FONT_SIZE,
        fill: "white",
        backgroundColor: "rgba(15,23,42,0.78)",
        selectable: false,
        evented: false,
        excludeFromExport: true,
        customType: "annotation-label",
      });

      shape.label = labelString;
      shape.labelText = text;
      fabricRef.current.add(text);
      text.set(getLabelPosition(shape, text));
      text.setCoords();

      const updateLabelPos = () => {
        if (!text || typeof text.set !== "function") return;
        text.set(getLabelPosition(shape, text));
        text.setCoords();
        bringEditingChromeToFront(fabricRef.current);
      };

      shape.on("moving", updateLabelPos);
      shape.on("scaling", updateLabelPos);
      shape.on("rotating", updateLabelPos);
      shape.on("modified", updateLabelPos);
      bringEditingChromeToFront(fabricRef.current);
    };

    const removeShapeAndLabel = (shape, canvas) => {
      if (shape.labelText) canvas.remove(shape.labelText);
      if (shape.editHandles) shape.editHandles.forEach((h) => canvas.remove(h));
      canvas.remove(shape);

      if (onShapeComplete) {
        onShapeComplete({ type: 'delete', target: null });
      }

      canvas.discardActiveObject();
      canvas.requestRenderAll();
    };

    // --- Initialization ---
    useEffect(() => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
      }

      const canvas = new fabric.Canvas(canvasRef.current, {
        selection: true,
        preserveObjectStacking: true,
      });

      canvas.setWidth(width);
      canvas.setHeight(height);
      fabricRef.current = canvas;

      const handleWindowKey = (e) => {
        if (e.key === "Delete" || e.key === "Backspace") {
          const active = canvas.getActiveObject();
          if (
            (drawingModeRef.current === "polygon" || drawingModeRef.current === "polyline") &&
            polygonPoints.current.length > 0
          )
            return;
          if (active?.customType === "vertex-handle") return;
          if (active) removeShapeAndLabel(active, canvas);
        }
        if (e.key === "Enter") {
          const isPoly =
            drawingModeRef.current === "polygon" || drawingModeRef.current === "polyline";
          if (isPoly && polygonPoints.current.length > 1) {
            finalizePolygonDrawing();
          }
        }
      };
      window.addEventListener("keydown", handleWindowKey);

      canvas.on("mouse:down", (opt) => handleMouseDown(opt, canvas));
      canvas.on("mouse:move", (opt) => handleMouseMove(opt, canvas));
      canvas.on("mouse:up", (opt) => handleMouseUp(opt, canvas));
      canvas.on("path:created", (e) => handlePathCreated(e, canvas));

      canvas.on("selection:created", (e) => handleSelection(e.target, canvas));
      canvas.on("selection:updated", (e) => handleSelection(e.target, canvas));
      canvas.on("selection:cleared", () => {
        bringEditingChromeToFront(canvas);
      });

      canvas.on("object:moving", (e) => updateVertexHandles(e.target));
      canvas.on("object:scaling", (e) => updateVertexHandles(e.target));
      canvas.on("object:rotating", (e) => updateVertexHandles(e.target));
      canvas.on("object:modified", (e) => {
        bringEditingChromeToFront(canvas);
        if (e.target?.customType !== "vertex-handle" && onShapeComplete) {
          onShapeComplete({ type: "modify", target: e.target });
        }
      });

      return () => {
        window.removeEventListener("keydown", handleWindowKey);
        fabricRef.current = null;
        if (canvas) {
          canvas.dispose();
        }
      };
    // The Fabric canvas owns mutable drawing handlers through refs; re-registering on each render interrupts active annotations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Mode/Tool Change Effect ---
    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas || !canvas.getElement()) return;

      cleanupTempObjects(canvas);
      drawingModeRef.current = mode;

      const isDrawing = ["rectangle", "polygon", "polyline", "ellipse"].includes(mode);
      canvas.defaultCursor = isDrawing ? "crosshair" : "default";
      canvas.selection = !isDrawing;
      canvas.isDrawingMode = mode === "brush";

      if (mode === "brush") {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.color = getBrushColor();
        canvas.freeDrawingBrush.width = brushSize || 10;
        canvas.freeDrawingBrush.decimate = 20;
      }

      canvas.requestRenderAll();
    // Brush color is derived from refs/theme state; keep this effect scoped to explicit tool changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, brushSize, toolChangeId]);

    // --- Drawing Logic ---
    const addPolygonPoint = (pointer, canvas) => {
      const { stroke } = getColors();
      const mode = drawingModeRef.current;

      polygonPoints.current.push({ x: pointer.x, y: pointer.y });

      const circle = new fabric.Circle({
        radius: 4,
        fill: "white",
        stroke: "#333",
        strokeWidth: 1,
        left: pointer.x,
        top: pointer.y,
        selectable: false,
        evented: false,
        originX: "center",
        originY: "center",
        customType: "temp-point",
        objectCaching: false,
        excludeFromExport: true,
      });
      canvas.add(circle);
      pointArray.current.push(circle);

      if (polygonPoints.current.length === 1) {
        activeLine.current = new fabric.Line(
          [pointer.x, pointer.y, pointer.x, pointer.y],
          {
            stroke: stroke,
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
            customType: "temp-line",
            objectCaching: false,
            excludeFromExport: true,
          }
        );
        canvas.add(activeLine.current);
      } else {
        if (activeLine.current) {
          activeLine.current.set({
            x1: pointer.x,
            y1: pointer.y,
            x2: pointer.x,
            y2: pointer.y,
          });
          activeLine.current.setCoords();
        }
      }

      if (polygonPoints.current.length > 1) {
        const points = polygonPoints.current.map((p) => ({ x: p.x, y: p.y }));
        if (activeShape.current) canvas.remove(activeShape.current);

        if (mode === "polygon") {
          activeShape.current = new fabric.Polygon(points, {
            stroke: stroke,
            strokeWidth: ANNOTATION_STROKE_WIDTH,
            fill: new fabric.Color(stroke).setAlpha(0.2).toRgba(),
            selectable: false,
            evented: false,
            customType: "temp-polygon",
            objectCaching: false,
            excludeFromExport: true,
          });
        } else {
          activeShape.current = new fabric.Polyline(points, {
            stroke: stroke,
            strokeWidth: ANNOTATION_STROKE_WIDTH,
            fill: "transparent",
            selectable: false,
            evented: false,
            customType: "temp-polyline",
            objectCaching: false,
            excludeFromExport: true,
          });
        }
        canvas.add(activeShape.current);
        activeShape.current.sendToBack();
        if (activeLine.current) activeLine.current.bringToFront();
      }
    };

    const handleMouseDown = (opt, canvas) => {
      const mode = drawingModeRef.current;
      if (mode === "select" || !mode) return;

      if (opt.target && opt.target.customType === "vertex-handle") return;

      isMouseDownRef.current = true;
      const pointer = canvas.getPointer(opt.e);
      const { stroke, fill } = getColors();

      if (mode === "polygon" || mode === "polyline") {
        canvas.discardActiveObject();
        addPolygonPoint(pointer, canvas);
      } else if (mode === "rectangle") {
        canvas.discardActiveObject();
        isDrawingBox.current = true;
        boxStart.current = pointer;

        previewBox.current = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          stroke: stroke,
          strokeWidth: ANNOTATION_STROKE_WIDTH,
          fill: fill,
          selectable: false,
          evented: false,
          customType: "preview-box",
          excludeFromExport: true,
        });
        canvas.add(previewBox.current);
      } else if (mode === "ellipse") {
        canvas.discardActiveObject();
        isDrawingEllipse.current = true;
        ellipseStart.current = pointer;

        previewEllipse.current = new fabric.Ellipse({
          left: pointer.x,
          top: pointer.y,
          rx: 0,
          ry: 0,
          stroke: stroke,
          strokeWidth: ANNOTATION_STROKE_WIDTH,
          fill: fill,
          selectable: false,
          evented: false,
          originX: "center",
          originY: "center",
          customType: "preview-ellipse",
          excludeFromExport: true,
        });
        canvas.add(previewEllipse.current);
      }
    };

    const handleMouseMove = (opt, canvas) => {
      const pointer = canvas.getPointer(opt.e);
      const mode = drawingModeRef.current;

      if (["rectangle", "ellipse"].includes(mode)) {
        updateCrosshairs(pointer, canvas);
      } else if (crosshairLines.current.horizontal) {
        canvas.remove(crosshairLines.current.horizontal);
        canvas.remove(crosshairLines.current.vertical);
        crosshairLines.current = { horizontal: null, vertical: null };
      }

      if (
        (mode === "polygon" || mode === "polyline") &&
        polygonPoints.current.length > 0
      ) {
        if (activeLine.current) {
          activeLine.current.set({ x2: pointer.x, y2: pointer.y });
          activeLine.current.setCoords();
        }
        if (isMouseDownRef.current) {
          const lastPoint = polygonPoints.current[polygonPoints.current.length - 1];
          const dist = Math.hypot(pointer.x - lastPoint.x, pointer.y - lastPoint.y);
          if (dist > 50) {
            addPolygonPoint(pointer, canvas);
          }
        }
        canvas.requestRenderAll();
      }

      if (mode === "rectangle" && isDrawingBox.current && previewBox.current) {
        const startX = boxStart.current.x;
        const startY = boxStart.current.y;
        const width = pointer.x - startX;
        const height = pointer.y - startY;

        previewBox.current.set({
          left: width < 0 ? pointer.x : startX,
          top: height < 0 ? pointer.y : startY,
          width: Math.abs(width),
          height: Math.abs(height),
        });
        canvas.requestRenderAll();
      }

      if (mode === "ellipse" && isDrawingEllipse.current && previewEllipse.current) {
        const rx = Math.abs(pointer.x - ellipseStart.current.x);
        const ry = Math.abs(pointer.y - ellipseStart.current.y);
        previewEllipse.current.set({ rx, ry });
        canvas.requestRenderAll();
      }
    };

    const handleMouseUp = (opt, canvas) => {
      isMouseDownRef.current = false;
      const mode = drawingModeRef.current;
      const { stroke, fill } = getColors();

      if (mode === "rectangle" && isDrawingBox.current) {
        isDrawingBox.current = false;
        if (
          !previewBox.current ||
          previewBox.current.width < 5 ||
          previewBox.current.height < 5
        ) {
          cleanupTempObjects(canvas);
          return;
        }

        const { left, top, width, height } = previewBox.current;
        const points = [
          { x: left, y: top },
          { x: left + width, y: top },
          { x: left + width, y: top + height },
          { x: left, y: top + height },
        ];

        const polygonRect = new fabric.Polygon(points, {
          stroke,
          strokeWidth: ANNOTATION_STROKE_WIDTH,
          fill,
          selectable: true,
          customType: "polygon",
          annotationKind: "rectangle",
          objectCaching: false,
          hasControls: false,
          hasBorders: false,
        });

        canvas.remove(previewBox.current);
        previewBox.current = null;
        finishShape(polygonRect, canvas, "rectangle");
      }

      if (mode === "ellipse" && isDrawingEllipse.current) {
        isDrawingEllipse.current = false;
        if (!previewEllipse.current) return;
        const { rx, ry, left, top } = previewEllipse.current;

        if (rx < 5 || ry < 5) {
          cleanupTempObjects(canvas);
          return;
        }

        const numPoints = 16;
        const points = [];
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * 2 * Math.PI;
          const x = left + rx * Math.cos(angle);
          const y = top + ry * Math.sin(angle);
          points.push({ x, y });
        }

        const polygonEllipse = new fabric.Polygon(points, {
          stroke,
          strokeWidth: ANNOTATION_STROKE_WIDTH,
          fill,
          selectable: true,
          customType: "polygon",
          objectCaching: false,
          hasControls: false,
          hasBorders: false,
        });

        canvas.remove(previewEllipse.current);
        previewEllipse.current = null;
        finishShape(polygonEllipse, canvas, "ellipse");
      }
    };

    const handlePathCreated = (e, canvas) => {
      const path = e.path;
      if (!path) return;

      canvas.remove(path);

      const { stroke, fill } = getColors();
      const points = [];

      if (path.path) {
        path.path.forEach((cmd) => {
          const len = cmd.length;
          if (len >= 3) {
            points.push({ x: cmd[len - 2], y: cmd[len - 1] });
          }
        });
      }

      const simplifiedPoints = [];
      const SIMPLIFY_THRESHOLD = 15;
      points.forEach((p) => {
        if (simplifiedPoints.length === 0) {
          simplifiedPoints.push(p);
        } else {
          const last = simplifiedPoints[simplifiedPoints.length - 1];
          const dist = Math.hypot(p.x - last.x, p.y - last.y);
          if (dist > SIMPLIFY_THRESHOLD) {
            simplifiedPoints.push(p);
          }
        }
      });

      const finalPoints = simplifiedPoints.length >= 3 ? simplifiedPoints : points;
      if (finalPoints.length < 3) return;

      const polygonBrush = new fabric.Polygon(finalPoints, {
        stroke,
        strokeWidth: ANNOTATION_STROKE_WIDTH,
        fill,
        selectable: true,
        customType: "polygon",
        objectCaching: false,
        hasControls: false,
        hasBorders: false,
      });

      finishShape(polygonBrush, canvas, "brush");
    };

    const finalizePolygonDrawing = () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const mode = drawingModeRef.current;

      if (polygonPoints.current.length < 2) {
        cleanupTempObjects(canvas);
        return;
      }

      const rawPoints = polygonPoints.current.map((p) => ({ x: p.x, y: p.y }));
      const points = mode === "polygon"
        ? addGeneratedClosingEdgePoints(rawPoints)
        : rawPoints;
      const { stroke, fill } = getColors();

      let finalShape;

      if (mode === "polyline") {
        finalShape = new fabric.Polyline(points, {
          stroke,
          strokeWidth: ANNOTATION_STROKE_WIDTH,
          fill: "transparent",
          selectable: true,
          customType: "polyline",
          objectCaching: false,
          hasControls: false,
          hasBorders: false,
        });
      } else {
        finalShape = new fabric.Polygon(points, {
          stroke,
          strokeWidth: ANNOTATION_STROKE_WIDTH,
          fill,
          selectable: true,
          customType: "polygon",
          objectCaching: false,
          hasControls: false,
          hasBorders: false,
        });
      }

      cleanupTempObjects(canvas);
      finishShape(finalShape, canvas, mode);
    };

    const finishShape = (shape, canvas, type) => {
      canvas.add(shape);
      addLabelToShape(shape, labelRef.current);

      if (shape.customType === "polygon" || shape.customType === "polyline") {
        generateVertexHandles(shape, canvas);
      }

      drawingModeRef.current = 'select';
      canvas.defaultCursor = "default";
      canvas.selection = true;
      canvas.isDrawingMode = false;

      canvas.setActiveObject(shape);

      if (onShapeComplete) {
        onShapeComplete({ type, target: shape });
      }

      bringEditingChromeToFront(canvas);
      canvas.requestRenderAll();
    };

    const handleSelection = (target, canvas) => {
      if (!target) return;
      if (target.customType === "polygon" || target.customType === "polyline") {
        generateVertexHandles(target, canvas);
      }
    };

    const generateVertexHandles = (poly, canvas) => {
      if (!poly || (poly.customType !== "polygon" && poly.customType !== "polyline")) return;

      if (poly.editHandles) {
        poly.editHandles.forEach((h) => canvas.remove(h));
      }
      poly.hasControls = false;
      poly.hasBorders = false;

      const handles = [];
      const matrix = poly.calcTransformMatrix();

      poly.points.forEach((point, index) => {
        // ----------------------------------------------------------------
        // FIX: pathOffset is the centroid of the polygon in its own
        // coordinate space. To get the world position of a point we must
        // subtract pathOffset (centering the point around the polygon's
        // origin) then apply the full transform matrix (which includes
        // left/top/scaleX/scaleY/angle).
        // ----------------------------------------------------------------
        const pLocal = {
          x: point.x - poly.pathOffset.x,
          y: point.y - poly.pathOffset.y,
        };
        const pFinal = fabric.util.transformPoint(pLocal, matrix);

        const handle = new fabric.Circle({
          radius: HANDLE_RADIUS,
          fill: "white",
          stroke: "black",
          strokeWidth: 1,
          left: pFinal.x,
          top: pFinal.y,
          originX: "center",
          originY: "center",
          hasControls: false,
          hasBorders: false,
          customType: "vertex-handle",
          pointIndex: index,
          parentPoly: poly,
          zIndex: 9999,
          excludeFromExport: true,
          selectable: true,
          evented: true,
        });

        handle.on("moving", () => onHandleMove(handle, poly, canvas));
        handles.push(handle);
        canvas.add(handle);
      });

      poly.editHandles = handles;
      bringEditingChromeToFront(canvas);
    };

    const updateVertexHandles = (poly) => {
      if (
        !poly ||
        !poly.editHandles ||
        (poly.customType !== "polygon" && poly.customType !== "polyline")
      )
        return;
      const matrix = poly.calcTransformMatrix();
      poly.editHandles.forEach((handle, index) => {
        const point = poly.points[index];
        const pLocal = {
          x: point.x - poly.pathOffset.x,
          y: point.y - poly.pathOffset.y,
        };
        const pFinal = fabric.util.transformPoint(pLocal, matrix);
        handle.set({ left: pFinal.x, top: pFinal.y });
        handle.setCoords();
      });
      bringEditingChromeToFront(fabricRef.current);
    };

    // -----------------------------------------------------------------------
    // FIX: onHandleMove — the original code used:
    //
    //   poly.points[pIndex].x = localPoint.x + poly.pathOffset.x
    //   poly.points[pIndex].y = localPoint.y + poly.pathOffset.y
    //
    // This is wrong. The inverse transform already returns coordinates in
    // the polygon's internal space (where the origin is the pathOffset
    // centroid). To convert back to the points array space (where each
    // point is stored relative to the top-left of the polygon's bounding
    // box before it was placed on the canvas), we need to ADD pathOffset —
    // BUT only if the polygon has NOT been moved/scaled/rotated after
    // creation. Once the polygon has a non-identity transform (left/top ≠ 0,
    // scale ≠ 1, angle ≠ 0), calcTransformMatrix already encodes those
    // transforms, and invertTransform undoes all of them, landing us
    // directly in the polygon's pre-transform point space.
    //
    // The correct formula is:
    //   poly.points[pIndex] = { x: localPoint.x + poly.pathOffset.x,
    //                           y: localPoint.y + poly.pathOffset.y }
    //
    // — which IS what the original code wrote — BUT this is only correct
    // when poly.left === 0 and poly.top === 0. When the polygon has been
    // moved, fabric's transform matrix encodes left/top so the inverse
    // transform already subtracts them. The pathOffset shift must therefore
    // still be applied.
    //
    // The real root cause of points "disappearing" is different: after we
    // mutate poly.points[], we must call poly._calcDimensions() so fabric
    // recalculates the bounding box and pathOffset for the *new* point
    // positions. Without this, pathOffset becomes stale on the next drag,
    // and every subsequent handle move compounds the error until the point
    // flies off screen.
    //
    // Additionally, we must call poly.setCoords() so the object's
    // interactive boundaries stay in sync, and we must update the label.
    // -----------------------------------------------------------------------
    const onHandleMove = (handle, poly, canvas) => {
      const pIndex = handle.pointIndex;
      if (!poly.points || !poly.points[pIndex]) return;

      const isBoundingBox = isBoundingBoxAnnotation(poly);
      const anchorIndex = isBoundingBox
        ? (pIndex + 2) % 4
        : poly.points.length > 1
          ? (pIndex === 0 ? 1 : pIndex - 1)
          : pIndex;
      const anchorBefore = poly.points[anchorIndex];
      const anchorWorld = fabric.util.transformPoint(
        {
          x: anchorBefore.x - poly.pathOffset.x,
          y: anchorBefore.y - poly.pathOffset.y,
        },
        poly.calcTransformMatrix()
      );

      // 1. Get the current world-space position of the handle.
      const worldPos = { x: handle.left, y: handle.top };

      // 2. Invert the polygon's full transform matrix to get the position
      //    in the polygon's local (pre-transform) coordinate space.
      const polyMatrix = poly.calcTransformMatrix();
      const invertedMatrix = fabric.util.invertTransform(polyMatrix);
      const localPoint = fabric.util.transformPoint(worldPos, invertedMatrix);

      // 3. Store the new point. Points are kept in the polygon's own
      //    coordinate system where (0,0) is the pathOffset origin (centroid
      //    of the bounding box). Adding pathOffset converts back to the
      //    absolute point-array coordinate space that fabric.Polygon uses
      //    internally (top-left of original bounding box = 0,0).
      const proposedPoint = {
        x: localPoint.x + poly.pathOffset.x,
        y: localPoint.y + poly.pathOffset.y,
      };
      if (isBoundingBox) {
        poly.points = resizeBoundingBoxPoints(poly.points, pIndex, proposedPoint);
      } else {
        poly.points[pIndex] = proposedPoint;
      }

      if (typeof poly._setPositionDimensions === "function") {
        poly._setPositionDimensions({});
      } else if (typeof poly._calcDimensions === "function") {
        poly._calcDimensions();
      }

      if (
        typeof poly._getNonTransformedDimensions === "function" &&
        typeof poly.setPositionByOrigin === "function"
      ) {
        const baseSize = poly._getNonTransformedDimensions();
        const anchorAfter = poly.points[anchorIndex];
        const originX =
          baseSize.x !== 0
            ? (anchorAfter.x - poly.pathOffset.x) / baseSize.x + 0.5
            : 0.5;
        const originY =
          baseSize.y !== 0
            ? (anchorAfter.y - poly.pathOffset.y) / baseSize.y + 0.5
            : 0.5;
        poly.setPositionByOrigin(anchorWorld, originX, originY);
      }

      // 5. Mark the polygon as dirty and update its coords so hit-testing
      //    and bounding-box calculations stay correct.
      poly.dirty = true;
      poly.setCoords();

      // 6. Keep the label positioned above the updated bounding rect.
      if (poly.labelText && typeof poly.labelText.set === "function") {
        poly.labelText.set(getLabelPosition(poly, poly.labelText));
        poly.labelText.setCoords();
      }

      if (poly.editHandles) {
        const newMatrix = poly.calcTransformMatrix();
        poly.editHandles.forEach((h, i) => {
          if (i === pIndex && !isBoundingBox) return;
          const pt = poly.points[i];
          const ptLocal = { x: pt.x - poly.pathOffset.x, y: pt.y - poly.pathOffset.y };
          const ptWorld = fabric.util.transformPoint(ptLocal, newMatrix);
          h.set({ left: ptWorld.x, top: ptWorld.y });
          h.setCoords();
        });
      }

      bringEditingChromeToFront(canvas);
      if (onShapeComplete) {
        onShapeComplete({ type: "modify", target: poly });
      }
      canvas.requestRenderAll();
    };

    const updateCrosshairs = (pointer, canvas) => {
      const w = canvas.getWidth();
      const h = canvas.getHeight();
      if (!crosshairLines.current.horizontal) {
        crosshairLines.current.horizontal = new fabric.Line([0, pointer.y, w, pointer.y], {
          stroke: "rgba(255,0,0,0.5)",
          strokeWidth: 1,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        crosshairLines.current.vertical = new fabric.Line([pointer.x, 0, pointer.x, h], {
          stroke: "rgba(255,0,0,0.5)",
          strokeWidth: 1,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        canvas.add(crosshairLines.current.horizontal);
        canvas.add(crosshairLines.current.vertical);
      } else {
        crosshairLines.current.horizontal.set({ y1: pointer.y, y2: pointer.y });
        crosshairLines.current.vertical.set({ x1: pointer.x, x2: pointer.x });
        canvas.bringToFront(crosshairLines.current.horizontal);
        canvas.bringToFront(crosshairLines.current.vertical);
      }
    };

    return (
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
    );
  }
);

export default AnnotationCanvas;
