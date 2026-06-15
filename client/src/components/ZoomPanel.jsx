// annotation/components/Panels/ZoomPanel.jsx
import React from "react";

const ZoomPanel = ({
  t,
  isZoomMode,
  setIsZoomMode,
  zoomLevel,
  setZoomLevel,
  zoomRegion,
  setZoomRegion,
}) => {
  const handleReset = () => {
    setZoomLevel(1);
    setZoomRegion(null);
    setIsZoomMode(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Current zoom level readout */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "10px 14px",
        }}
      >
        <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>
          Current zoom
        </span>
        <span
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: zoomLevel > 1 ? "#6366f1" : "#94a3b8",
            minWidth: "40px",
            textAlign: "right",
          }}
        >
          {zoomLevel ? zoomLevel.toFixed(1) : "1.0"}×
        </span>
      </div>

      {/* Manual zoom level slider */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
            Zoom level
          </span>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>1× – 8×</span>
        </div>
        <input
          type="range"
          min={1}
          max={8}
          step={0.1}
          value={zoomLevel || 1}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setZoomLevel(val);
            // When dragging slider down to 1, clear region too
            if (val <= 1) setZoomRegion(null);
          }}
          style={{
            width: "100%",
            accentColor: "#6366f1",
            cursor: "pointer",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            color: "#cbd5e1",
          }}
        >
          <span>1×</span>
          <span>2×</span>
          <span>4×</span>
          <span>8×</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid #f1f5f9" }} />

      {/* Select zoom region button */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
          Region zoom
        </span>
        <button
          onClick={() => setIsZoomMode((prev) => !prev)}
          style={{
            padding: "9px 12px",
            backgroundColor: isZoomMode ? "#fef3c7" : "#eef2ff",
            color: isZoomMode ? "#92400e" : "#4338ca",
            border: `1.5px solid ${isZoomMode ? "#fcd34d" : "#c7d2fe"}`,
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "7px",
            transition: "all 0.15s ease",
          }}
        >
          {/* crosshair icon */}
          <svg
            width="15" height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="1" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="1" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="23" y2="12" />
          </svg>
          {isZoomMode ? "Cancel — click to exit" : "Draw zoom region"}
        </button>
        {isZoomMode && (
          <p
            style={{
              fontSize: "11.5px",
              color: "#78716c",
              margin: 0,
              lineHeight: 1.5,
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "6px",
              padding: "6px 9px",
            }}
          >
            Click and drag on the image to select the region you want to zoom into.
          </p>
        )}
      </div>

      {/* Reset button */}
      <button
        onClick={handleReset}
        disabled={zoomLevel <= 1 && !zoomRegion && !isZoomMode}
        style={{
          padding: "9px 12px",
          backgroundColor:
            zoomLevel <= 1 && !zoomRegion && !isZoomMode ? "#f8fafc" : "#fff",
          color:
            zoomLevel <= 1 && !zoomRegion && !isZoomMode ? "#cbd5e1" : "#475569",
          border: "1.5px solid #e2e8f0",
          borderRadius: "8px",
          cursor:
            zoomLevel <= 1 && !zoomRegion && !isZoomMode
              ? "not-allowed"
              : "pointer",
          fontWeight: 600,
          fontSize: "13px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "7px",
          transition: "all 0.15s ease",
        }}
      >
        {/* reset icon */}
        <svg
          width="13" height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        Reset to 1×
      </button>
    </div>
  );
};

export default ZoomPanel;