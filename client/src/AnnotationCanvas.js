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
      toolChangeId, // Triggers when tool button is clicked
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

    // --- DYNAMIC OPACITY & COLOR UPDATE ---
    // This effect fixes the issue where opacity slider didn't affect active objects or the brush
    useEffect(() => {
      opacityRef.current = annotationOpacity;
      colorRef.current = brushColor;

      const canvas = fabricRef.current;
      if (!canvas) return;

      const { fill, stroke } = getColors();

      // 1. Update Brush Settings immediately
      if (canvas.freeDrawingBrush) {
        // The brush uses the 'fill' (color + opacity) for its stroke style in this context
        canvas.freeDrawingBrush.color = fill; 
      }

      // 2. Update Currently Selected Object
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        // If it's a standard shape (Polygon, Rect, Ellipse)
        // In your code, brush strokes are converted to Polygons, so this covers them too.
        if (
             activeObject.type === 'polygon' || 
             activeObject.type === 'rect' || 
             activeObject.type === 'ellipse' || 
             activeObject.customType === 'polygon'
        ) {
           activeObject.set({ fill: fill, stroke: stroke });
        } 
        // Fallback for standard paths if they exist
        else if (activeObject.type === 'path' || activeObject.customType === 'path') {
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
        }
        return fabricRef.current?.toJSON(["label", "labelText", "customType"]);
      },
      getSVG: () => fabricRef.current?.toSVG(),
      importAnnotations: (json) => {
        const canvas = fabricRef.current;
        if (canvas && json) {
          cleanupTempObjects(canvas);
          canvas.loadFromJSON(json, () => {
            const objects = canvas.getObjects().slice();
            // Clean up artifacts from import
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
            // Regenerate handles/labels
            canvas.getObjects().forEach((obj) => {
              if (obj.customType === "polygon" || obj.customType === "polyline") {
                generateVertexHandles(obj, canvas);
              }
              if (obj.label) {
                addLabelToShape(obj, obj.label);
              }
            });
            canvas.renderAll();
          });
        }
      },
      clearAnnotations: () => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        canvas.clear();
        canvas.setBackgroundColor("transparent", canvas.renderAll.bind(canvas));
        cleanupTempObjects(canvas);
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
      // 1. Reset Logic flags
      polygonPoints.current = [];
      pointArray.current = [];
      activeLine.current = null;
      activeShape.current = null;
      isDrawingBox.current = false;
      isDrawingEllipse.current = false;
      boxStart.current = null;
      ellipseStart.current = null;
      isMouseDownRef.current = false;

      // 2. Deselect everything to prevent ghost handles or active object conflicts
      canvas.discardActiveObject();

      // 3. Define EXACTLY what to remove
      const tempTypes = new Set([
        "temp-point", 
        "temp-line", 
        "temp-polygon", 
        "temp-polyline", 
        "preview-box", 
        "preview-ellipse", 
        "vertex-handle" 
      ]);

      // 4. Remove temporary objects
      const objects = canvas.getObjects();
      for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        if (obj.customType && tempTypes.has(obj.customType)) {
          canvas.remove(obj);
        }
      }
      
      // 5. Clear Crosshairs
      if (crosshairLines.current.horizontal) {
          canvas.remove(crosshairLines.current.horizontal);
          canvas.remove(crosshairLines.current.vertical);
          crosshairLines.current = { horizontal: null, vertical: null };
      }

      canvas.requestRenderAll();
    };

    // --- Internal Helpers ---
    const addLabelToShape = (shape, label) => {
      if (!fabricRef.current) return;
      const labelString = label || "";

      if (shape.labelText && typeof shape.labelText.set === "function") {
        fabricRef.current.remove(shape.labelText);
      }

      const bound = shape.getBoundingRect();
      const text = new fabric.Text(labelString, {
        left: bound.left,
        top: bound.top - 20,
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
        if (!text || typeof text.set !== "function") return;
        const b = shape.getBoundingRect();
        text.set({ left: b.left, top: b.top - 20 });
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
          )
            return;
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
      
      // Selection Handlers
      canvas.on("selection:created", (e) => handleSelection(e.target, canvas));
      canvas.on("selection:updated", (e) => handleSelection(e.target, canvas));
      canvas.on("selection:cleared", () => {
        // Remove handles when deselecting
        const objects = canvas.getObjects();
        for (let i = objects.length - 1; i >= 0; i--) {
          if (objects[i].customType === "vertex-handle") {
            canvas.remove(objects[i]);
          }
        }
      });

      canvas.on("object:moving", (e) => updateVertexHandles(e.target));
      canvas.on("object:scaling", (e) => updateVertexHandles(e.target));
      canvas.on("object:rotating", (e) => updateVertexHandles(e.target));

      return () => {
        window.removeEventListener("keydown", handleWindowKey);
        canvas.dispose();
      };
    }, []);

    // --- Mode/Tool Change Effect ---
    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      // 1. Strict Cleanup: removes only temps, deselects current object
      cleanupTempObjects(canvas);

      // 2. Update Ref
      drawingModeRef.current = mode;

      // 3. Configure Canvas
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
    }, [mode, brushSize, toolChangeId]); // Removed brushColor/opacity here as they are handled in the dynamic effect above

    // ==========================================
    //         POLYGON / POLYLINE LOGIC
    // ==========================================
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

      // Rubber band line
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

      // Fill preview
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

    // ==========================================
    //           MOUSE HANDLERS
    // ==========================================
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
          customType: "polygon", // Explicit custom type
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

      const points = polygonPoints.current.map((p) => ({ x: p.x, y: p.y }));
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

    // ==========================================
    //           FINISH SHAPE (Resets to Select)
    // ==========================================
    const finishShape = (shape, canvas, type) => {
      canvas.add(shape);
      addLabelToShape(shape, labelRef.current);

      if (shape.customType === "polygon" || shape.customType === "polyline") {
        generateVertexHandles(shape, canvas);
      }

      // --- CRITICAL: Reset to Select Mode ---
      // This stops continuous drawing. To draw again, user must re-select tool.
      drawingModeRef.current = 'select';
      canvas.defaultCursor = "default";
      canvas.selection = true;
      canvas.isDrawingMode = false;
      
      canvas.setActiveObject(shape);

      if (onShapeComplete) {
        onShapeComplete({ type, target: shape });
      }

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
          excludeFromExport: true,
        });

        handle.on("moving", (e) => onHandleMove(handle, poly, canvas));
        handles.push(handle);
        canvas.add(handle);
      });

      poly.editHandles = handles;
      handles.forEach((h) => h.bringToFront());
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

      if (poly.labelText && typeof poly.labelText.set === "function") {
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
