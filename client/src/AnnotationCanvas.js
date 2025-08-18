import React, {
  useEffect,
  useImperativeHandle,
  forwardRef,
  useRef,
} from "react";
import { fabric } from "fabric";

const AnnotationCanvas = forwardRef(
  (
    { mode, width, height, selectedLabel, brushColor, brushSize, toolChangeId },
    ref
  ) => {
    const canvasRef = useRef(null);
    const fabricRef = useRef(null);
    const drawingModeRef = useRef(null);
    const drawingActiveRef = useRef(false);
    const polygonPoints = useRef([]);
    const polylinePoints = useRef([]);
    const labelRef = useRef(selectedLabel);

    useImperativeHandle(ref, () => ({
      exportAnnotations: () => {
        if (!fabricRef.current) return null;
        return fabricRef.current.toJSON(["label", "labelText"]);
      },
      getSVG: () => fabricRef.current?.toSVG(),
      importAnnotations: (json) => {
        if (fabricRef.current && json) {
          fabricRef.current.loadFromJSON(json, () => {
            fabricRef.current.renderAll();
          });
        }
      },
      clearAnnotations: () => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        canvas.getObjects().forEach((obj) => {
          if (obj.labelText) canvas.remove(obj.labelText);
          canvas.remove(obj);
        });
        canvas.discardActiveObject();
        canvas.requestRenderAll();
      },
      deleteSelected: () => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          if (activeObject.labelText) {
            canvas.remove(activeObject.labelText);
          }
          canvas.remove(activeObject);
          canvas.discardActiveObject();
          canvas.requestRenderAll();
        }
      },
    }));

    useEffect(() => {
      labelRef.current = selectedLabel;
    }, [selectedLabel]);

    useEffect(() => {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        selection: true,
      });
      fabricCanvas.setWidth(width);
      fabricCanvas.setHeight(height);
      fabricRef.current = fabricCanvas;

      fabricCanvas.isDrawingMode = false;
      fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
      fabricCanvas.freeDrawingBrush.color =
        brushColor || "rgba(64, 0, 64, 0.4)";
      fabricCanvas.freeDrawingBrush.width = brushSize || 10;

      const addLabelToShape = (shape, label) => {
        if (!label) return;
        const text = new fabric.Text(label, {
          left: shape.left + 5,
          top: shape.top + 5,
          fontSize: 14,
          fill: "black",
          backgroundColor: "rgba(255,255,255,0.7)",
          selectable: false,
          evented: false,
        });

        shape.label = label;
        shape.labelText = text;

        fabricCanvas.add(text);

        shape.on("moving", () => {
          text.set({ left: shape.left + 5, top: shape.top + 5 });
          fabricCanvas.renderAll();
        });
        shape.on("scaling", () => {
          text.set({ left: shape.left + 5, top: shape.top + 5 });
          fabricCanvas.renderAll();
        });
        shape.on("rotating", () => {
          text.set({ left: shape.left + 5, top: shape.top + 5 });
          fabricCanvas.renderAll();
        });
      };

      const handleClick = (options) => {
        const pointer = fabricCanvas.getPointer(options.e);

        switch (drawingModeRef.current) {
          case "polygon":
            polygonPoints.current.push({ x: pointer.x, y: pointer.y });
            const polygonPreview = new fabric.Polyline(
              polygonPoints.current,
              {
                fill: "rgba(255, 0, 0, 0.3)",
                stroke: "red",
                strokeWidth: 2,
                selectable: false,
                evented: false,
                customType: "polygon-preview",
              }
            );
            fabricCanvas.getObjects().forEach((obj) => {
              if (obj.customType === "polygon-preview")
                fabricCanvas.remove(obj);
            });
            fabricCanvas.add(polygonPreview);
            break;

          case "polyline":
            polylinePoints.current.push({ x: pointer.x, y: pointer.y });
            const polylinePreview = new fabric.Polyline(
              polylinePoints.current,
              {
                fill: null,
                stroke: "blue",
                strokeWidth: 2,
                selectable: false,
                evented: false,
                customType: "polyline-preview",
              }
            );
            fabricCanvas.getObjects().forEach((obj) => {
              if (obj.customType === "polyline-preview")
                fabricCanvas.remove(obj);
            });
            fabricCanvas.add(polylinePreview);
            break;

          case "rectangle":
            const rect = new fabric.Rect({
              left: pointer.x,
              top: pointer.y,
              width: 100,
              height: 60,
              fill: "rgba(0,255,0,0.3)",
              stroke: "green",
              strokeWidth: 2,
              selectable: true,
            });
            fabricCanvas.add(rect);
            addLabelToShape(rect, labelRef.current);
            deactivateDrawing();
            break;

          case "ellipse":
            const ellipse = new fabric.Ellipse({
              left: pointer.x - 50,
              top: pointer.y - 30,
              rx: 50,
              ry: 30,
              fill: "rgba(0,0,255,0.3)",
              stroke: "blue",
              strokeWidth: 2,
              selectable: true,
            });
            fabricCanvas.add(ellipse);
            addLabelToShape(ellipse, labelRef.current);
            deactivateDrawing();
            break;

          case "cuboid":
            const cuboid = new fabric.Rect({
              left: pointer.x,
              top: pointer.y,
              width: 120,
              height: 80,
              fill: "rgba(255,165,0,0.3)",
              stroke: "orange",
              strokeWidth: 2,
              selectable: true,
            });
            fabricCanvas.add(cuboid);
            addLabelToShape(cuboid, labelRef.current);
            deactivateDrawing();
            break;

          default:
            break;
        }
      };

      const handleKey = (e) => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        if (e.key === "Delete" || e.key === "Backspace") {
          const activeObject = canvas.getActiveObject();
          if (activeObject) {
            if (activeObject.labelText) {
              canvas.remove(activeObject.labelText);
            }
            canvas.remove(activeObject);
            canvas.discardActiveObject();
            canvas.requestRenderAll();
          }
        }

        if (e.key === "Enter") {
          if (!drawingActiveRef.current) return;

          canvas.getObjects().forEach((obj) => {
            if (obj.customType?.includes("preview")) {
              canvas.remove(obj);
            }
          });

          if (
            drawingModeRef.current === "polygon" &&
            polygonPoints.current.length > 2
          ) {
            const polygon = new fabric.Polygon(polygonPoints.current, {
              fill: "rgba(255, 0, 0, 0.3)",
              stroke: "red",
              strokeWidth: 2,
              selectable: true,
              customType: "polygon",
            });
            canvas.add(polygon);
            addLabelToShape(polygon, labelRef.current);
            polygonPoints.current = [];
          }

          if (
            drawingModeRef.current === "polyline" &&
            polylinePoints.current.length > 1
          ) {
            const polyline = new fabric.Polyline(polylinePoints.current, {
              fill: null,
              stroke: "blue",
              strokeWidth: 2,
              selectable: true,
              customType: "polyline",
            });
            canvas.add(polyline);
            addLabelToShape(polyline, labelRef.current);
            polylinePoints.current = [];
          }

          canvas.discardActiveObject();
          canvas.requestRenderAll();
          deactivateDrawing();
        }
      };

      const deactivateDrawing = () => {
        drawingActiveRef.current = false;
        drawingModeRef.current = null;
        fabricCanvas.isDrawingMode = false;
      };

      fabricCanvas.on("object:removed", (e) => {
        const obj = e.target;
        if (obj.labelText) {
          fabricCanvas.remove(obj.labelText);
        }
      });

      fabricCanvas.on("path:created", (e) => {
        const path = e.path;
        if (labelRef.current) {
          path.label = labelRef.current;
          addLabelToShape(path, labelRef.current);
        }
      });

      window.addEventListener("keydown", handleKey);
      fabricCanvas.on("mouse:down", handleClick);
      return () => {
        window.removeEventListener("keydown", handleKey);
        fabricCanvas.dispose();
      };
    }, []);

    useEffect(() => {
      if (!fabricRef.current) return;

      const canvas = fabricRef.current;
      canvas.getObjects().forEach((obj) => {
        if (obj.customType?.includes("preview")) {
          canvas.remove(obj);
        }
      });

      // Clear unfinished points
      polygonPoints.current = [];
      polylinePoints.current = [];

      canvas.requestRenderAll();
    }, [toolChangeId]);

    useEffect(() => {
      drawingModeRef.current = mode;
      drawingActiveRef.current = true;
      const fabricCanvas = fabricRef.current;

      if (fabricCanvas) {
        if (mode === "brush") {
          fabricCanvas.isDrawingMode = true;
          fabricCanvas.freeDrawingBrush.color = brushColor || "#ffffff";
          fabricCanvas.freeDrawingBrush.width = brushSize || 10;
        } else {
          fabricCanvas.isDrawingMode = false;
        }
      }
    }, [mode, brushColor, brushSize,toolChangeId]);

    return (
      <canvas
        ref={canvasRef}
        style={{ border: "1px solid gray", cursor: "crosshair" }}
      />
    );
  }
);

export default AnnotationCanvas;
