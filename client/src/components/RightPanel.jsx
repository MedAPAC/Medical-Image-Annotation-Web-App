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
      className="right-panel"
      style={{
        position: "fixed",
        top: "104px",
        right: rightPanelOpen ? "56px" : "-320px",
        bottom: 0,
        width: "300px",
        backgroundColor: "#ffffff",
        borderLeft: "1px solid #e2e8f0",
        boxShadow: "-4px 0 16px rgba(0, 0, 0, 0.08)",
        overflowY: "auto",
        transition: "right 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 40,
        padding: "24px 20px",
        scrollbarWidth: "thin",
        scrollbarColor: "#cbd5e0 #f7fafc",
      }}
    >
      {/* Custom scrollbar styling for Webkit browsers */}
      <style>
        {`
          .right-panel::-webkit-scrollbar {
            width: 6px;
          }
          .right-panel::-webkit-scrollbar-track {
            background: #f7fafc;
            border-radius: 3px;
          }
          .right-panel::-webkit-scrollbar-thumb {
            background: #cbd5e0;
            border-radius: 3px;
          }
          .right-panel::-webkit-scrollbar-thumb:hover {
            background: #a0aec0;
          }
        `}
      </style>

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

      {/* Inline styles for panel components */}
      <style>
        {`
          .panel-section {
            margin-bottom: 32px;
            animation: fadeIn 0.2s ease-out;
          }
          
          .panel-header {
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 1px solid #edf2f7;
          }
          
          .panel-title {
            font-size: 18px;
            font-weight: 600;
            color: #2d3748;
            margin: 0 0 4px 0;
            letter-spacing: -0.01em;
          }
          
          .panel-subtitle {
            font-size: 13px;
            color: #718096;
            margin: 0;
            font-weight: 400;
          }
          
          .panel-content {
            position: relative;
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateX(8px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          /* Improve hover states and interactions */
          .right-panel input[type="text"],
          .right-panel input[type="number"],
          .right-panel select,
          .right-panel textarea {
            transition: all 0.15s ease;
            border: 1px solid #e2e8f0;
          }
          
          .right-panel input[type="text"]:focus,
          .right-panel input[type="number"]:focus,
          .right-panel select:focus,
          .right-panel textarea:focus {
            border-color: #4299e1;
            box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
            outline: none;
          }
          
          /* Smooth transitions for all interactive elements */
          .right-panel button {
            transition: all 0.15s ease;
          }
          
          .right-panel button:hover {
            transform: translateY(-1px);
          }
          
          .right-panel button:active {
            transform: translateY(0);
          }
        `}
      </style>
    </div>
  );
};

export default RightPanel;