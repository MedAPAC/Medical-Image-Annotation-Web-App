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
      mode,
      width,
      height,
      selectedLabel,
      brushColor,
      brushSize,
      toolChangeId,
      annotationOpacity = 1,
      onShapeComplete, // Callback when a shape is finalized
    },
    ref
  ) => {
    const canvasRef = useRef(null);
    const fabricRef = useRef(null);

    // State refs
    const drawingModeRef = useRef(mode); // Internal tracker for mode
    const labelRef = useRef(selectedLabel);
    const isMouseDownRef = useRef(false); 

    // Polygon specific
    const polygonPoints = useRef([]); 
    const activeLine = useRef(null); 
    const activeShape = useRef(null); 
    const pointArray = useRef([]); 

    // Rectangle specific
    const isDrawingBox = useRef(false);
    const boxStart = useRef(null);
    const previewBox = useRef(null);
    const crosshairLines = useRef({ horizontal: null, vertical: null });

    // Constants
    const ANNOTATION_STROKE_WIDTH = 2;
    const HANDLE_RADIUS = 5;
    const HANDLE_FILL = "white";
    const HANDLE_STROKE = "black";
    
    // REDUCED THRESHOLD: 
    // Generates more points closer together for smoother "drawing" feel
    const MIN_DIST_THRESHOLD = 50; 

    // --- Helpers ---
    const getRgba = (color, opacity) => {
      if (!color) return `rgba(100,0,64,${opacity})`;
      if (color.startsWith("rgba"))
        return color.replace(
          /rgba\\(([^,]+),([^,]+),([^,]+),[^)]+\\)/,
          `rgba($1,$2,$3,${opacity})`
        );
      if (color.startsWith("rgb"))
        return color.replace(/rgb\\(([^)]+)\\)/, `rgba($1,${opacity})`);
      if (color.startsWith("#")) {
        let c = color.substring(1).match(/.{1,2}/g);
        if (!c) return `rgba(64,0,64,${opacity})`;
        const r = parseInt(c[0], 16);
        const g = parseInt(c[1], 16);
        const b = parseInt(c[2], 16);
        return `rgba(${r},${g},${b},${opacity})`;
      }
      return color;
    };

    const getColors = () => {
      const fill = getRgba("#add8e6", annotationOpacity);
      const stroke = getRgba(brushColor || "#0066cc", 1);
      return { fill, stroke };
    };

    // --- API ---
    useImperativeHandle(ref, () => ({
      exportAnnotations: () =>
        fabricRef.current?.toJSON(["label", "labelText", "customType"]),
      getSVG: () => fabricRef.current?.toSVG(),
      importAnnotations: (json) => {
        if (fabricRef.current && json) {
          fabricRef.current.loadFromJSON(json, () => {
             // After import, ensure handles are generated for polygons
             fabricRef.current.getObjects().forEach(obj => {
                 if(obj.customType === 'polygon') generatePolygonHandles(obj, fabricRef.current);
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

    // --- Internal Logic ---
    const addLabelToShape = (shape, label) => {
      if (!label || !fabricRef.current) return;

      const text = new fabric.Text(label, {
        left: shape.left,
        top: shape.top - 20,
        fontSize: 14,
        fill: "white",
        backgroundColor: "rgba(0,0,0,0.6)",
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });

      shape.label = label;
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
            drawingModeRef.current === "polygon" &&
            polygonPoints.current.length > 0
          )
            return;
          if (active) removeShapeAndLabel(active, canvas);
        }
        if (e.key === "Enter") {
          if (
            drawingModeRef.current === "polygon" &&
            polygonPoints.current.length > 2
          ) {
            finalizePolygonDrawing();
          }
        }
      };
      window.addEventListener("keydown", handleWindowKey);

      // Canvas Events
      canvas.on("mouse:down", (opt) => handleMouseDown(opt, canvas));
      canvas.on("mouse:move", (opt) => handleMouseMove(opt, canvas));
      canvas.on("mouse:up", (opt) => handleMouseUp(opt, canvas));

      // Selection Events
      // Note: We do NOT remove handles on selection:cleared anymore
      // This keeps points visible after deselecting.
      canvas.on("selection:created", (e) => handleSelection(e.target, canvas));
      canvas.on("selection:updated", (e) => handleSelection(e.target, canvas));
      
      // Sync handles when shape moves
      canvas.on("object:moving", (e) => updatePolygonHandles(e.target));
      canvas.on("object:scaling", (e) => updatePolygonHandles(e.target));
      canvas.on("object:rotating", (e) => updatePolygonHandles(e.target));

      return () => {
        window.removeEventListener("keydown", handleWindowKey);
        canvas.dispose();
      };
    }, []);

    // --- Prop Updates ---
    useEffect(() => {
      // Whenever prop 'mode' changes, we update our internal ref
      drawingModeRef.current = mode;
      
      const canvas = fabricRef.current;
      if (!canvas) return;

      // Cursor logic
      canvas.defaultCursor =
        mode === "rectangle" || mode === "polygon" ? "crosshair" : "default";
      
      canvas.selection = mode !== 'polygon' && mode !== 'rectangle';

      // Brush logic
      canvas.isDrawingMode = mode === "brush";
      if (mode === "brush") {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.color = getRgba(brushColor, annotationOpacity);
        canvas.freeDrawingBrush.width = brushSize || 10;
      } else {
        clearPolygonTemp(canvas);
      }
    }, [mode, brushColor, brushSize, toolChangeId, annotationOpacity]);

    useEffect(() => {
      labelRef.current = selectedLabel;
    }, [selectedLabel]);


    // ==========================================
    //           CORE DRAWING HELPER
    // ==========================================

    const addPolygonPoint = (pointer, canvas) => {
        const { stroke, fill } = getColors();

        polygonPoints.current.push({ x: pointer.x, y: pointer.y });

        // 1. Visual Dot (Temporary)
        const circle = new fabric.Circle({
            radius: 4,
            fill: 'white',
            stroke: '#333',
            strokeWidth: 1,
            left: pointer.x,
            top: pointer.y,
            selectable: false,
            evented: false,
            originX: 'center',
            originY: 'center',
            customType: 'temp-point',
            objectCaching: false 
        });
        canvas.add(circle);
        pointArray.current.push(circle);

        // 2. Visual Polygon Preview
        if (polygonPoints.current.length > 1) {
            const points = polygonPoints.current.map(p => ({ x: p.x, y: p.y }));
            if (activeShape.current) canvas.remove(activeShape.current);
            
            activeShape.current = new fabric.Polygon(points, {
                stroke: stroke,
                strokeWidth: ANNOTATION_STROKE_WIDTH,
                fill: getRgba(fill, 0.3),
                selectable: false,
                evented: false,
                customType: 'temp-polygon',
                objectCaching: false
            });
            canvas.add(activeShape.current);
            activeShape.current.sendToBack(); 
        } 
        
        // 3. Initial Line (if only 1 point)
        if (polygonPoints.current.length === 1) {
             activeLine.current = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
                stroke: stroke,
                strokeWidth: 2,
                strokeDashArray: [5, 5],
                selectable: false,
                evented: false,
                customType: 'temp-line'
            });
            canvas.add(activeLine.current);
        }
    }

    // ==========================================
    //           MOUSE HANDLERS
    // ==========================================

    const handleMouseDown = (opt, canvas) => {
      const mode = drawingModeRef.current;
      
      // Safety: If mode is select (or 'none'), do nothing
      if(mode === 'select' || !mode) return;

      isMouseDownRef.current = true;
      const pointer = canvas.getPointer(opt.e);
      const { stroke, fill } = getColors();

      // Ignore clicks on existing handles or shapes to allow selection/editing
      if (opt.target && 
          opt.target.customType !== 'temp-point' && 
          opt.target.customType !== 'temp-line' && 
          opt.target.customType !== 'temp-polygon') {
          return;
      }

      // --- Polygon Start / Add Point ---
      if (mode === "polygon") {
        canvas.discardActiveObject();
        addPolygonPoint(pointer, canvas);
      }

      // --- Rectangle Start ---
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
    };

    const handleMouseMove = (opt, canvas) => {
      const pointer = canvas.getPointer(opt.e);
      const mode = drawingModeRef.current;

      // --- Polygon Drag-to-Draw ---
      if (mode === "polygon" && polygonPoints.current.length > 0) {
        
        // AUTO-GENERATE POINTS ON DRAG
        if(isMouseDownRef.current) {
            const lastPoint = polygonPoints.current[polygonPoints.current.length - 1];
            // Calculate distance from last point
            const dist = Math.hypot(pointer.x - lastPoint.x, pointer.y - lastPoint.y);
            
            // If dragged far enough, add a new point automatically
            if(dist > MIN_DIST_THRESHOLD) {
                addPolygonPoint(pointer, canvas);
            }
        }

        // Rubber Band Line
        if (activeLine.current) {
          activeLine.current.set({ x2: pointer.x, y2: pointer.y });
        } else {
             // Fallback
             const lastPoint = polygonPoints.current[polygonPoints.current.length - 1];
             const { stroke } = getColors();
             activeLine.current = new fabric.Line([lastPoint.x, lastPoint.y, pointer.x, pointer.y], {
                stroke: stroke,
                strokeWidth: 2,
                strokeDashArray: [5, 5],
                selectable: false,
                evented: false,
                customType: 'temp-line'
            });
            canvas.add(activeLine.current);
        }
        canvas.requestRenderAll();
      }

      // --- Rectangle Resize ---
      if (mode === "rectangle") {
        updateCrosshairs(pointer, canvas);

        if (isDrawingBox.current) {
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
        }
        canvas.requestRenderAll();
      }
    };

    const handleMouseUp = (opt, canvas) => {
      isMouseDownRef.current = false;
      const mode = drawingModeRef.current;

      // --- Rectangle Finalize ---
      if (mode === "rectangle" && isDrawingBox.current) {
        isDrawingBox.current = false;

        if (previewBox.current.width < 5 || previewBox.current.height < 5) {
          canvas.remove(previewBox.current);
          previewBox.current = null;
          return;
        }

        const { stroke, fill } = getColors();
        const rect = new fabric.Rect({
          left: previewBox.current.left,
          top: previewBox.current.top,
          width: previewBox.current.width,
          height: previewBox.current.height,
          fill: fill,
          stroke: stroke,
          strokeWidth: ANNOTATION_STROKE_WIDTH,
          selectable: true,
          customType: "bounding-box",
        });

        canvas.remove(previewBox.current);
        previewBox.current = null;
        
        finishShape(rect, canvas, 'rectangle');
      }
    };

    // ==========================================
    //       FINALIZE & CLEANUP
    // ==========================================

    const finalizePolygonDrawing = () => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      if (polygonPoints.current.length < 3) {
        clearPolygonTemp(canvas);
        return;
      }

      const points = polygonPoints.current.map((p) => ({ x: p.x, y: p.y }));
      const { stroke, fill } = getColors();

      const polygon = new fabric.Polygon(points, {
        stroke: stroke,
        strokeWidth: ANNOTATION_STROKE_WIDTH,
        fill: fill,
        objectCaching: false,
        transparentCorners: false,
        cornerColor: "transparent",
        hasBorders: false,
        hasControls: false, 
        selectable: true,
        customType: "polygon",
      });

      clearPolygonTemp(canvas);
      finishShape(polygon, canvas, 'polygon');
    };
    
    // Shared finish logic
    const finishShape = (shape, canvas, type) => {
        canvas.add(shape);
        addLabelToShape(shape, labelRef.current);
        
        if (type === 'polygon') {
            generatePolygonHandles(shape, canvas);
        }

        canvas.setActiveObject(shape);
        
        // Cleanup UI
        if (crosshairLines.current.horizontal) canvas.remove(crosshairLines.current.horizontal);
        if (crosshairLines.current.vertical) canvas.remove(crosshairLines.current.vertical);
        crosshairLines.current = { horizontal: null, vertical: null };
        
        // --- KEY FEATURE: DISABLE MOUSE / DRAWING MODE ---
        // 1. Internally switch to 'select' immediately so dragging/clicking stops drawing
        drawingModeRef.current = 'select';
        canvas.defaultCursor = 'default';
        canvas.selection = true;
        
        // 2. Notify parent if prop provided
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

    // ==========================================
    //       POLYGON EDITING (HANDLES)
    // ==========================================

    const handleSelection = (target, canvas) => {
      if (!target) return;
      if (target.customType === "polygon") {
        generatePolygonHandles(target, canvas);
      }
    };
    
    const generatePolygonHandles = (polygon, canvas) => {
        if (!polygon || polygon.customType !== 'polygon') return;
        
        // Do not regenerate if already correct (optimization)
        if(polygon.editHandles && polygon.editHandles.length === polygon.points.length) {
            updatePolygonHandles(polygon);
            return;
        }

        // Clean old
        if(polygon.editHandles) {
            polygon.editHandles.forEach(h => canvas.remove(h));
        }

        polygon.hasControls = false;
        polygon.hasBorders = false;
        
        const handles = [];
        const matrix = polygon.calcTransformMatrix();

        polygon.points.forEach((point, index) => {
            const pLocal = { x: point.x - polygon.pathOffset.x, y: point.y - polygon.pathOffset.y };
            const pFinal = fabric.util.transformPoint(pLocal, matrix);

            const handle = new fabric.Circle({
                radius: HANDLE_RADIUS,
                fill: HANDLE_FILL,
                stroke: HANDLE_STROKE,
                strokeWidth: 1,
                left: pFinal.x,
                top: pFinal.y,
                originX: "center",
                originY: "center",
                hasControls: false,
                hasBorders: false,
                customType: "polygon-handle",
                pointIndex: index,
                parentPoly: polygon,
                zIndex: 9999
            });
            
            handle.on('moving', (e) => onHandleMove(handle, polygon, canvas));
            handles.push(handle);
            canvas.add(handle);
        });

        polygon.editHandles = handles;
        polygon.sendToBack(); 
    };

    const updatePolygonHandles = (poly) => {
      if (!poly || !poly.editHandles || poly.customType !== "polygon") return;

      const matrix = poly.calcTransformMatrix();

      poly.editHandles.forEach((handle, index) => {
        const point = poly.points[index];
        const pLocal = {
          x: point.x - poly.pathOffset.x,
          y: point.y - poly.pathOffset.y,
        };
        const pFinal = fabric.util.transformPoint(pLocal, matrix);

        handle.set({
          left: pFinal.x,
          top: pFinal.y,
        });
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
        crosshairLines.current.horizontal = new fabric.Line(
          [0, pointer.y, w, pointer.y],
          {
            stroke: "red",
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
          }
        );
        crosshairLines.current.vertical = new fabric.Line(
          [pointer.x, 0, pointer.x, h],
          {
            stroke: "red",
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
          }
        );
        canvas.add(crosshairLines.current.horizontal);
        canvas.add(crosshairLines.current.vertical);
      } else {
        crosshairLines.current.horizontal.set({ y1: pointer.y, y2: pointer.y });
        crosshairLines.current.vertical.set({ x1: pointer.x, x2: pointer.x });
      }
    };

    return (
      <canvas
        ref={canvasRef}
        style={{ border: "1px solid gray", width: "100%", height: "100%" }}
      />
    );
  }
);

export default AnnotationCanvas;
