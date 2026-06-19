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
  projectAttributes
}) => {
  const [showSlices, setShowSlices] = useState(false);
  const slicesRef = useRef(null);

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
      className={`right-panel ${rightPanelOpen ? "open" : "closed"}`}
      aria-hidden={!rightPanelOpen}
    >
      {rightPanelOpen === "classification" && (
        <div className="panel-section">
          <div className="panel-header">
            <h3 className="panel-title">
              Classification
            </h3>
            {selectedFileName && (
              <p className="panel-subtitle">
                {selectedFileName} • Slice {currentSlice + 1}
              </p>
            )}
          </div>
          <div className="panel-content">
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
              projectAttributes={projectAttributes}
            />
          </div>
        </div>
      )}

      {rightPanelOpen === "slices" && (
        <div className="panel-section">
          <div className="panel-header">
            <h3 className="panel-title">
              Slice Navigation
            </h3>
            <p className="panel-subtitle">
              {totalSlices} total slices
            </p>
          </div>
          <div className="panel-content">
            <SlicesPanel
              t={t}
              showSlices={showSlices}
              setShowSlices={setShowSlices}
              slicesRef={slicesRef}
              totalSlices={totalSlices}
              currentSlice={currentSlice}
              setCurrentSlice={setCurrentSlice}
            />
          </div>
        </div>
      )}

      {rightPanelOpen === "zoom" && (
        <div className="panel-section">
          <div className="panel-header">
            <h3 className="panel-title">
              Zoom Controls
            </h3>
            <p className="panel-subtitle">
              Adjust viewing details
            </p>
          </div>
          <div className="panel-content">
            <ZoomPanel
              t={t}
              isZoomMode={isZoomMode}
              setIsZoomMode={setIsZoomMode}
              zoomLevel={zoomLevel}
              setZoomLevel={setZoomLevel}
              zoomRegion={zoomRegion}
              setZoomRegion={setZoomRegion}
            />
          </div>
        </div>
      )}

      {rightPanelOpen === "help" && (
        <div className="panel-section">
          <div className="panel-header">
            <h3 className="panel-title">
              Help & Guidance
            </h3>
            <p className="panel-subtitle">
              Reference and instructions
            </p>
          </div>
          <div className="panel-content">
            <HelpPanel t={t} />
          </div>
        </div>
      )}
    </div>
  );
};

export default RightPanel;
