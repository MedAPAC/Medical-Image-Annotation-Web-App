// annotation/components/RightPanel.jsx
import React, { useState, useRef } from "react";
import ClassificationPanel from "./ClassificationPanel";
import SlicesPanel from "./SlicesPanel";
import ZoomPanel from "./ZoomPanel";
import HelpPanel from "./HelpPanel";

const RightPanel = ({
  rightPanelOpen,
  t,
  viewType,
  setViewType,
  selectedFileName,
  currentSlice,
  setCurrentSlice,
  classificationByFileAndSlice,
  setClassificationByFileAndSlice,
  inputsByFileAndSlice,
  setInputsByFileAndSlice,
  totalSlices,
  isZoomMode,
  setIsZoomMode,
  zoomLevel,
  setZoomLevel,
  zoomRegion,
  setZoomRegion,
  projectAttributes // NEW PROP: Array of attributes defined in project
}) => {
  const [showSlices, setShowSlices] = useState(false);
  const slicesRef = useRef(null);

  // Helper function for inputs
  // Now we need to be dynamic. We can't just return fixed keys { checkbox, number... }
  // We return the raw object for the current slice.
  const getInputsForCurrent = () => 
    inputsByFileAndSlice[selectedFileName]?.[currentSlice] || {};

  const updateInputsForCurrent = (updates) => {
    setInputsByFileAndSlice((prev) => ({
      ...prev,
      [selectedFileName]: {
        ...(prev[selectedFileName] || {}),
        [currentSlice]: {
          ...(prev[selectedFileName]?.[currentSlice] || {}),
          ...updates,
        },
      },
    }));
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "104px",
        right: rightPanelOpen ? "56px" : "-300px",
        bottom: 0,
        width: "280px",
        backgroundColor: "#ffffff",
        borderLeft: "1px solid #e5e7eb",
        boxShadow: "-4px 0 12px rgba(0,0,0,0.08)",
        overflowY: "auto",
        transition: "right 0.3s ease",
        zIndex: 40,
        padding: "20px 16px",
      }}
    >
      {rightPanelOpen === "classification" && (
        <ClassificationPanel
          t={t}
          viewType={viewType}
          setViewType={setViewType}
          selectedFileName={selectedFileName}
          currentSlice={currentSlice}
          classificationByFileAndSlice={classificationByFileAndSlice}
          setClassificationByFileAndSlice={setClassificationByFileAndSlice}
          getInputsForCurrent={getInputsForCurrent}
          updateInputsForCurrent={updateInputsForCurrent}
          projectAttributes={projectAttributes} // PASS DOWN
        />
      )}

      {rightPanelOpen === "slices" && (
        <SlicesPanel
          t={t}
          showSlices={showSlices}
          setShowSlices={setShowSlices}
          slicesRef={slicesRef}
          totalSlices={totalSlices}
          currentSlice={currentSlice}
          setCurrentSlice={setCurrentSlice}
        />
      )}

      {rightPanelOpen === "zoom" && (
        <ZoomPanel
          t={t}
          isZoomMode={isZoomMode}
          setIsZoomMode={setIsZoomMode}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          setZoomRegion={setZoomRegion}
        />
      )}

      {rightPanelOpen === "help" && (
        <HelpPanel t={t} />
      )}
    </div>
  );
};

export default RightPanel;
