// annotation/components/Panels/ClassificationPanel.jsx
import React from "react";

const ClassificationPanel = ({
  t,
  viewType,
  setViewType,
  selectedFileName,
  currentSlice,
  classificationByFileAndSlice,
  setClassificationByFileAndSlice,
  getInputsForCurrent,
  updateInputsForCurrent
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* View Type */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "10px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "14px" }}>
          {t("View Type")}
        </span>
        <div style={{ display: "flex", gap: "6px" }}>
          {["axial", "coronal", "sagittal"].map((view) => {
            const isActive = viewType === view;
            return (
              <button
                key={view}
                onClick={() => setViewType(view)}
                style={{
                  padding: "6px 10px",
                  backgroundColor: isActive ? "#3b82f6" : "#e2e8f0",
                  color: isActive ? "#fff" : "#1e293b",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 500,
                  fontSize: "12px",
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
                {t(view.charAt(0).toUpperCase() + view.slice(1))}
              </button>
            );
          })}
        </div>
      </div>

      {/* Classification */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "10px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "14px" }}>
          {t("Classification")} (Slice {currentSlice + 1}):
        </span>

        {/* Classification Buttons */}
        <div style={{ display: "flex", gap: "6px" }}>
          {["positive", "negative", "clear"].map((cls) => {
            const bgColor = cls === "positive" ? "#059669" : cls === "negative" ? "#dc2626" : "#f59e0b";
            return (
              <button
                key={cls}
                onClick={() => {
                  if (cls === "clear") {
                    setClassificationByFileAndSlice((prev) => {
                      const updated = { ...(prev[selectedFileName] || {}) };
                      delete updated[currentSlice];
                      return { ...prev, [selectedFileName]: updated };
                    });
                  } else {
                    setClassificationByFileAndSlice((prev) => ({
                      ...prev,
                      [selectedFileName]: {
                        ...(prev[selectedFileName] || {}),
                        [currentSlice]: cls,
                      },
                    }));
                  }
                }}
                style={{
                  padding: "6px 10px",
                  backgroundColor: bgColor,
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 500,
                  fontSize: "12px",
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
                {t(cls)}
              </button>
            );
          })}
        </div>

        {/* Additional Inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
          <label style={{ fontSize: "12px", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
            <input
              type="checkbox"
              checked={getInputsForCurrent().checkbox}
              onChange={(e) => updateInputsForCurrent({ checkbox: e.target.checked })}
              style={{ width: "14px", height: "14px", cursor: "pointer" }}
            />
            {t("tumor")}
          </label>

          <label style={{ fontSize: "12px", color: "#1e293b", display: "flex", flexDirection: "column", gap: "4px" }}>
            {t("description")}:
            <input
              type="text"
              value={getInputsForCurrent().text}
              onChange={(e) => updateInputsForCurrent({ text: e.target.value })}
              style={{
                padding: "6px 8px",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                fontSize: "12px",
                outline: "none",
                transition: "border 0.2s",
              }}
              onFocus={(e) => (e.currentTarget.style.border = "1px solid #2563eb")}
              onBlur={(e) => (e.currentTarget.style.border = "1px solid #cbd5e1")}
            />
          </label>

          <label style={{ fontSize: "12px", color: "#1e293b", display: "flex", flexDirection: "column", gap: "4px" }}>
            {t("hemo type")}:
            <select
              value={getInputsForCurrent().select}
              onChange={(e) => updateInputsForCurrent({ select: e.target.value })}
              style={{
                padding: "6px 8px",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
                outline: "none",
                transition: "border 0.2s",
              }}
              onFocus={(e) => (e.currentTarget.style.border = "1px solid #2563eb")}
              onBlur={(e) => (e.currentTarget.style.border = "1px solid #cbd5e1")}
            >
              <option value="">{t("Choose...")}</option>
              <option value="1">IVH</option>
              <option value="2">IPH</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ClassificationPanel;