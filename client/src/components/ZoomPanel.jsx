// annotation/components/Panels/ZoomPanel.jsx
import React from "react";

const ZoomPanel = ({
  t,
  isZoomMode,
  setIsZoomMode,
  zoomLevel,
  setZoomLevel,
  setZoomRegion
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", position: "relative" }}>
      <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "14px", textAlign: "center", width: "100%" }}>
        {t("Zoom Controls")}
      </span>

      <button
        onClick={() => setIsZoomMode((prev) => !prev)}
        style={{
          padding: "6px 10px",
          backgroundColor: isZoomMode ? "#f59e0b" : "#6366f1",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: 500,
          fontSize: "13px",
          transition: "transform 0.1s, box-shadow 0.2s",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {isZoomMode ? t("Cancel Zoom") : t("Select Zoom Area")}
      </button>

      <button
        onClick={() => {
          setZoomLevel(1);
          setZoomRegion(null);
          setIsZoomMode(false);
        }}
        style={{
          padding: "6px 10px",
          backgroundColor: "#64748b",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: 500,
          fontSize: "13px",
          transition: "transform 0.1s, box-shadow 0.2s",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {t("Reset Zoom")}
      </button>
    </div>
  );
};

export default ZoomPanel;