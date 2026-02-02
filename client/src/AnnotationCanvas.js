// annotation/components/AnnotationCanvas.js
import React, {
  useEffect,
  useImperativeHandle,
  forwardRef,
  useRef,
} from "react";
import { fabric } from "fabric";

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
    const isDrawingBox = useRef(false);
    const boxStart = useRef(null);
    const previewBox = useRef(null);
    const isDrawingEllipse = useRef(false);
    const ellipseStart = useRef(null);
    const previewEllipse = useRef(null);
    const crosshairLines = useRef({ horizontal: null, vertical: null });

    const ANNOTATION_STROKE_WIDTH = 2;
    const HANDLE_RADIUS = 5;

    // --- Sync Props to Refs ---
    useEffect(() => { drawingModeRef.current = mode; }, [mode]);
    useEffect(() => { labelRef.current = selectedLabel; }, [selectedLabel]);
    useEffect(() => { colorRef.current = brushColor; }, [brushColor]);
    useEffect(() => { opacityRef.current = annotationOpacity; }, [annotationOpacity]);

    // --- Color Helpers (FIXED) ---
    // Use fabric.Color for robust conversion of hex, rgb, rgba, and named colors
    const getColors = () => {
      const colorInput = colorRef.current || "#0066cc";
      const opacity = opacityRef.current !== undefined ? opacityRef.current : 0.5;

      const fColor = new fabric.Color(colorInput);
      
      const fill = fColor.setAlpha(opacity).toRgba();
      const stroke = fColor.setAlpha(1).toRgba(); // Stroke usually opaque

      return { fill, stroke };
    };

    const getBrushColor = () => {
        const { fill } = getColors();
        return fill;
    };

    // --- API Exposed to Parent ---
    useImperativeHandle(ref, () => ({
      exportAnnotations: () => fabricRef.current?.toJSON(["label", "labelText", "customType"]),
      getSVG: () => fabricRef.current?.toSVG(),
      importAnnotations: (json) => {
        if (fabricRef.current && json) {
          fabricRef.current.loadFromJSON(json, () => {
            fabricRef.current.getObjects().forEach((obj) => {
              if (obj.customType === "polygon" || obj.customType === "polyline") {
                generateVertexHandles(obj, fabricRef.current);
              }
            });
            fabricRef.current.renderAll();
          });
        }
      },
      clearAnnotations: () => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        canvas.clear();
        canvas.setBackgroundColor("transparent", canvas.renderAll.bind(canvas));
        polygonPoints.current = [];
      },
      deleteSelected: () => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          removeShapeAndLabel(activeObject, canvas);
        }
      },
    }));

    // --- Internal Helpers ---
    const addLabelToShape = (shape, label) => {
      // Even if label is empty, we allow creation, but text won't show if string is empty
      if (!fabricRef.current) return;

      const labelString = label || ""; // Fallback to empty string

      const text = new fabric.Text(labelString, {
        left: shape.left,
        top: shape.top - 20,
        fontSize: 14,
        fill: "white",
        backgroundColor: "rgba(0,0,0,0.6)",
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });

      shape.label = labelString;
      shape.labelText = text;
      fabricRef.current.add(text);

      const updateLabelPos = () => {
        const bound = shape.getBoundingRect();
        text.set({ left: bound.left, top: bound.top - 20 });
        text.setCoords();
      };

      shape.on("moving", updateLabelPos);
      shape.on("scaling", updateLabelPos);
      shape.on("rotating", updateLabelPos);
      shape.on("modified", updateLabelPos);
    };

    const removeShapeAndLabel = (shape, canvas) => {
      if (shape.labelText) canvas.remove(shape.labelText);
      if (shape.editHandles) shape.editHandles.forEach((h) => canvas.remove(h));
      canvas.remove(shape);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    };

    // --- Initialization ---
    useEffect(() => {
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
          ) return;
          if (active) removeShapeAndLabel(active, canvas);
        }
        if (e.key === "Enter") {
          const isPoly = drawingModeRef.current === "polygon" || drawingModeRef.current === "polyline";
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
      canvas.on("object:moving", (e) => updateVertexHandles(e.target));
      canvas.on("object:scaling", (e) => updateVertexHandles(e.target));
      canvas.on("object:rotating", (e) => updateVertexHandles(e.target));

      return () => {
        window.removeEventListener("keydown", handleWindowKey);
        canvas.dispose();
      };
    }, []);

    // --- Mode/Prop Updates ---
    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const isDrawing = ["rectangle", "polygon", "polyline", "ellipse"].includes(mode);
      
      canvas.defaultCursor = isDrawing ? "crosshair" : "default";
      canvas.selection = !isDrawing;

      // Brush Logic
      canvas.isDrawingMode = mode === "brush";
      if (mode === "brush") {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        // FIX: Ensure brush gets the correct color immediately
        canvas.freeDrawingBrush.color = getBrushColor(); 
        canvas.freeDrawingBrush.width = brushSize || 10;
        canvas.freeDrawingBrush.decimate = 20; 
      } else {
        clearPolygonTemp(canvas);
      }
    }, [mode, brushColor, brushSize, toolChangeId, annotationOpacity]);

    // ==========================================
    //         POLYGON / POLYLINE LOGIC
    // ==========================================
    const addPolygonPoint = (pointer, canvas) => {
      const { stroke, fill } = getColors(); // Dynamic color fetch
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
      });
      canvas.add(circle);
      pointArray.current.push(circle);

      if (polygonPoints.current.length > 1) {
        const points = polygonPoints.current.map((p) => ({ x: p.x, y: p.y }));
        
        if (activeShape.current) canvas.remove(activeShape.current);

        if (mode === "polygon") {
            activeShape.current = new fabric.Polygon(points, {
                stroke: stroke,
                strokeWidth: ANNOTATION_STROKE_WIDTH,
                fill: new fabric.Color(stroke).setAlpha(0.2).toRgba(), // Lighter fill for drawing
                selectable: false,
                evented: false,
                customType: "temp-polygon",
                objectCaching: false,
            });
        } else {
            activeShape.current = new fabric.Polyline(points, {
                stroke: stroke,
                strokeWidth: ANNOTATION_STROKE_WIDTH,
                fill: 'transparent',
                selectable: false,
                evented: false,
                customType: "temp-polyline",
                objectCaching: false,
            });
        }
        canvas.add(activeShape.current);
        activeShape.current.sendToBack();
      }

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
          }
        );
        canvas.add(activeLine.current);
      }
    };

    // ==========================================
    //           MOUSE HANDLERS
    // ==========================================
    const handleMouseDown = (opt, canvas) => {
      const mode = drawingModeRef.current;
      if (mode === "select" || !mode) return;

      isMouseDownRef.current = true;
      const pointer = canvas.getPointer(opt.e);
      const { stroke, fill } = getColors(); // Dynamic color fetch

      if (opt.target && !["temp-point", "temp-line", "temp-polygon", "temp-polyline"].includes(opt.target.customType)) {
        return;
      }

      if (mode === "polygon" || mode === "polyline") {
        canvas.discardActiveObject();
        addPolygonPoint(pointer, canvas);
      }
      else if (mode === "rectangle") {
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
        });
        canvas.add(previewBox.current);
      }
      else if (mode === "ellipse") {
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
            originX: 'center',
            originY: 'center',
            customType: 'preview-ellipse'
        });
        canvas.add(previewEllipse.current);
      }
    };

    const handleMouseMove = (opt, canvas) => {
      const pointer = canvas.getPointer(opt.e);
      const mode = drawingModeRef.current;

      if (['rectangle', 'ellipse'].includes(mode)) {
          updateCrosshairs(pointer, canvas);
      }

      if ((mode === "polygon" || mode === "polyline") && polygonPoints.current.length > 0) {
        if (isMouseDownRef.current) {
          const lastPoint = polygonPoints.current[polygonPoints.current.length - 1];
          const dist = Math.hypot(pointer.x - lastPoint.x, pointer.y - lastPoint.y);
          if (dist > 50) {
            addPolygonPoint(pointer, canvas);
          }
        }

        if (activeLine.current) {
          activeLine.current.set({ x2: pointer.x, y2: pointer.y });
        } else {
            const last = polygonPoints.current[polygonPoints.current.length-1];
            if(last) {
                const { stroke } = getColors();
                activeLine.current = new fabric.Line(
                    [last.x, last.y, pointer.x, pointer.y], 
                    { stroke, strokeDashArray: [5,5], selectable: false }
                );
                canvas.add(activeLine.current);
            }
        }
        canvas.requestRenderAll();
      }

      if (mode === "rectangle" && isDrawingBox.current) {
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

      if (mode === "ellipse" && isDrawingEllipse.current) {
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
        if (previewBox.current.width < 5 || previewBox.current.height < 5) {
          canvas.remove(previewBox.current);
          previewBox.current = null;
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
          const { rx, ry, left, top } = previewEllipse.current;
          
          if(rx < 5 || ry < 5) {
              canvas.remove(previewEllipse.current);
              previewEllipse.current = null;
              return;
          }

          const numPoints = 12; 
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
        clearPolygonTemp(canvas);
        return;
      }

      const points = polygonPoints.current.map((p) => ({ x: p.x, y: p.y }));
      const { stroke, fill } = getColors();
      
      let finalShape;

      if (mode === "polyline") {
        finalShape = new fabric.Polyline(points, {
            stroke,
            strokeWidth: ANNOTATION_STROKE_WIDTH,
            fill: 'transparent', 
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

      clearPolygonTemp(canvas);
      finishShape(finalShape, canvas, mode);
    };

    const finishShape = (shape, canvas, type) => {
      canvas.add(shape);
      addLabelToShape(shape, labelRef.current);

      if (shape.customType === "polygon" || shape.customType === "polyline") {
        generateVertexHandles(shape, canvas);
      }

      canvas.setActiveObject(shape);

      if (crosshairLines.current.horizontal) canvas.remove(crosshairLines.current.horizontal);
      if (crosshairLines.current.vertical) canvas.remove(crosshairLines.current.vertical);
      
      drawingModeRef.current = "select";
      canvas.defaultCursor = "default";
      canvas.selection = true;
      canvas.isDrawingMode = false;

      if (onShapeComplete) {
        onShapeComplete({ type, target: shape });
      }
      canvas.requestRenderAll();
    };

    const clearPolygonTemp = (canvas) => {
      polygonPoints.current = [];
      if (activeShape.current) canvas.remove(activeShape.current);
      if (activeLine.current) canvas.remove(activeLine.current);
      pointArray.current.forEach((c) => canvas.remove(c));
      activeShape.current = null;
      activeLine.current = null;
      pointArray.current = [];
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
      if (poly.editHandles && poly.editHandles.length === poly.points.length) {
        updateVertexHandles(poly);
        return;
      }
      if (poly.editHandles) {
        poly.editHandles.forEach((h) => canvas.remove(h));
      }
      poly.hasControls = false;
      poly.hasBorders = false;

      const handles = [];
      const matrix = poly.calcTransformMatrix();

      poly.points.forEach((point, index) => {
        const pLocal = { x: point.x - poly.pathOffset.x, y: point.y - poly.pathOffset.y };
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
        });

        handle.on("moving", (e) => onHandleMove(handle, poly, canvas));
        handles.push(handle);
        canvas.add(handle);
      });

      poly.editHandles = handles;
      poly.sendToBack();
    };

    const updateVertexHandles = (poly) => {
      if (!poly || !poly.editHandles || (poly.customType !== "polygon" && poly.customType !== "polyline")) return;
      const matrix = poly.calcTransformMatrix();
      poly.editHandles.forEach((handle, index) => {
        const point = poly.points[index];
        const pLocal = { x: point.x - poly.pathOffset.x, y: point.y - poly.pathOffset.y };
        const pFinal = fabric.util.transformPoint(pLocal, matrix);
        handle.set({ left: pFinal.x, top: pFinal.y });
        handle.setCoords();
      });
    };

    const onHandleMove = (handle, poly, canvas) => {
      const pIndex = handle.pointIndex;
      const polyMatrix = poly.calcTransformMatrix();
      const invertedMatrix = fabric.util.invertTransform(polyMatrix);
      const pointer = { x: handle.left, y: handle.top };
      const localPoint = fabric.util.transformPoint(pointer, invertedMatrix);

      poly.points[pIndex].x = localPoint.x + poly.pathOffset.x;
      poly.points[pIndex].y = localPoint.y + poly.pathOffset.y;

      if (poly.labelText) {
        const bound = poly.getBoundingRect();
        poly.labelText.set({ left: bound.left, top: bound.top - 20 });
      }
      poly.dirty = true;
      canvas.requestRenderAll();
    };

    const updateCrosshairs = (pointer, canvas) => {
      const w = canvas.getWidth();
      const h = canvas.getHeight();
      if (!crosshairLines.current.horizontal) {
        crosshairLines.current.horizontal = new fabric.Line([0, pointer.y, w, pointer.y], { stroke: "red", strokeDashArray: [5, 5], selectable: false, evented: false });
        crosshairLines.current.vertical = new fabric.Line([pointer.x, 0, pointer.x, h], { stroke: "red", strokeDashArray: [5, 5], selectable: false, evented: false });
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
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%" }}
      />
    );
  }
);

export default AnnotationCanvas;
