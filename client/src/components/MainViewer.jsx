// annotation/components/MainViewer.jsx
import React from "react";
import NiftiViewer from "../NiftiViewer";
import DicomViewer from "../DicomViewer";
import AnnotationCanvas from "../AnnotationCanvas";

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
  annotationRefs,
  totalSlices
}) => {
  const file = uploadedFiles.find((f) => f.originalName === selectedFileName);
  if (!file) return null;

  // Initialize ref if not exists
  if (!annotationRefs.current[file.originalName]) {
    annotationRefs.current[file.originalName] = React.createRef();
  }

  const isDicom = file.type === "dicom";
  const dicomFiles = isDicom ? uploadedFiles.filter((f) => f.type === "dicom") : [];
  const imageIds = dicomFiles.map((f) => `wadouri:${f.url}`);

  const classification = classificationByFileAndSlice[selectedFileName]?.[currentSlice];
  const borderColor = classification === "positive"
    ? "#16a34a"
    : classification === "negative"
    ? "#dc2626"
    : "#94a3b8";

  const glowColor = classification === "positive"
    ? "rgba(22,163,74,0.3)"
    : classification === "negative"
    ? "rgba(220,38,38,0.3)"
    : "rgba(148,163,184,0.25)";

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          borderRadius: "16px",
          boxShadow: `0 3px 12px rgba(0,0,0,0.08), 0 0 0 2px ${glowColor}`,
          position: "relative",
          border: `1px solid ${borderColor}`,
          transition: "all 0.3s ease",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "max-content",
          height: "max-content",
          padding: "8px",
        }}
      >
        <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
          <div
            style={{
              position: "relative",
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid #e2e8f0",
              background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {isDicom ? (
              <DicomViewer
                imageIds={imageIds}
                windowCenter={windowCenter}
                windowWidth={windowWidth}
                currentSlice={currentSlice}
                onSliceChange={setCurrentSlice}
                setTotalSlices={setTotalSlices}
                zoomLevel={zoomLevel}
                zoomRegion={zoomRegion}
                isZoomMode={isZoomMode}
                viewType={viewType}
                style={{
                  display: "block",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
            ) : (
              <NiftiViewer
                url={file.url}
                windowCenter={windowCenter}
                windowWidth={windowWidth}
                currentSlice={currentSlice}
                onSliceChange={setCurrentSlice}
                setTotalSlices={setTotalSlices}
                isZoomMode={isZoomMode}
                zoomRegion={zoomRegion}
                zoomLevel={zoomLevel}
                viewType={viewType}
                style={{
                  display: "block",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
            )}

            {/* Annotation Layer */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 10,
                pointerEvents: "auto",
              }}
            >
              <AnnotationCanvas
                ref={annotationRefs.current[file.originalName]}
                mode={selectedShape}
                width={500}
                height={500}
                selectedLabel={
                  selectedShape === "rectangle"
                    ? "A"
                    : selectedShape === "ellipse"
                    ? "B"
                    : selectedLabel
                }
                brushColor={brushColor}
                brushSize={brushSize}
                toolChangeId={toolChangeId}
                annotationOpacity={annotationOpacity}
              />
            </div>

            {/* Classification Tag */}
            {classification && (
              <div
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  backgroundColor: borderColor,
                  color: "#fff",
                  padding: "2px 6px",
                  borderRadius: "8px",
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "capitalize",
                  boxShadow: `0 0 5px ${glowColor}`,
                  zIndex: 20,
                  pointerEvents: "none",
                }}
              >
                {classification}
              </div>
            )}
          </div>

          {/* Slice Info Badge */}
          <div
            style={{
              marginTop: "4px",
              fontSize: "12px",
              color: "#1e293b",
              backgroundColor: "#f1f5f9",
              padding: "4px 8px",
              borderRadius: "12px",
              display: "inline-block",
              fontWeight: 500,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              minWidth: "80px",
              textAlign: "center",
              pointerEvents: "none",
              zIndex: 15,
            }}
          >
            Slice {currentSlice + 1} / {isDicom ? imageIds.length : totalSlices}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainViewer;