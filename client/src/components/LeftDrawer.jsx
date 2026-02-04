// annotation/components/LeftDrawer.jsx
import React from "react";

const LeftDrawer = ({
  openSection,
  windowCenter,
  windowWidth,
  setWindowCenter,
  setWindowWidth,
  annotationOpacity,
  setAnnotationOpacity,
  selectedShape,
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
  t
}) => {
  return (
    <div
      style={{
        position: "fixed",
        top: "104px",
        left: openSection ? "80px" : "-280px",
        bottom: 0,
        width: "280px",
        background: "#fff",
        borderRight: "1px solid #e2e8f0",
        boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
        overflowY: "auto",
        zIndex: 40,
        transition: "left 0.3s ease",
        padding: "16px",
      }}
    >
      {/* Window Settings */}
      {openSection === "window" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "12px",
          }}
        >
          <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "14px", textAlign: "center" }}>
            {t("Window Settings")}
          </span>

          {["windowCenter", "windowWidth"].map((key) => (
            <div key={key} style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ fontWeight: 600, color: "#1e293b", fontSize: "14px", marginBottom: "4px" }}>
                {t(key)}
              </label>
              <input
                type="number"
                value={key === "windowCenter" ? windowCenter ?? "" : windowWidth ?? ""}
                onChange={(e) =>
                  key === "windowCenter"
                    ? setWindowCenter(e.target.value === "" ? null : Number(e.target.value))
                    : setWindowWidth(e.target.value === "" ? null : Number(e.target.value))
                }
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
              />
            </div>
          ))}

          <button
            onClick={() => {
              setWindowCenter(null);
              setWindowWidth(null);
            }}
            style={{
              padding: "8px 12px",
              backgroundColor: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "14px",
              transition: "all 0.2s",
              alignSelf: "flex-start",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
          >
            {t("reset")}
          </button>
        </div>
      )}

      {/* Opacity */}
      {openSection === "opacity" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "12px",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "14px", textAlign: "center" }}>
            {t("Opacity")}
          </span>

          <div style={{ display: "flex", alignItems: "center", padding: "8px 12px", backgroundColor: "#fff", borderRadius: "8px", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)", width: "100%" }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={annotationOpacity}
              onChange={(e) => setAnnotationOpacity(Number(e.target.value))}
              style={{
                flex: 1,
                cursor: "pointer",
                accentColor: "#3b82f6",
                height: "6px",
                borderRadius: "4px",
                background: "linear-gradient(to right, #3b82f6, #76a4d8ff)",
                outline: "none",
              }}
            />
            <span style={{ marginLeft: "8px", fontSize: "12px", fontWeight: 500, color: "#1e293b", minWidth: "32px", textAlign: "right" }}>
              {Math.round(annotationOpacity * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Brush Settings */}
      {openSection === "brush" && selectedShape === "brush" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "12px",
          }}
        >
          <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "14px", textAlign: "center" }}>
            {t("Brush Settings")}
          </span>

          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {t("brushColor")}:
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              style={{ cursor: "pointer" }}
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {t("brushSize")}:
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              style={{ flex: 1, cursor: "pointer" }}
            />
            <span style={{ minWidth: "24px", textAlign: "right" }}>{brushSize}</span>
          </label>
        </div>
      )}
    </div>
  );
};

export default LeftDrawer;
