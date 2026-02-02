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
  updateInputsForCurrent,
  projectAttributes = [] 
}) => {
  // Helper to get current inputs safe object
  const inputs = getInputsForCurrent() || {};

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

        {/* Classification Buttons (Primary Status) */}
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

        {/* Dynamic Attributes Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
          {projectAttributes.length === 0 ? (
            <div style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>
              {t("No attributes configured")}
            </div>
          ) : (
            projectAttributes.map((attr) => {
              const val = inputs[attr.name]; // Can be undefined, which represents "no selection"
              
              // 1. Checkbox Type (Multi-Select or Single Boolean)
              if (attr.type === 'checkbox') {
                const options = attr.values ? attr.values.split(/[\n,]/).map(o => o.trim()).filter(Boolean) : [];
                
                // Case A: Multi-Select Checkboxes (User provided values: "A, B, C")
                if (options.length > 0) {
                  // Ensure current value is an array, default to empty array if not
                  const currentSelection = Array.isArray(val) ? val : [];

                  return (
                    <div key={attr.id} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "12px", color: "#1e293b", fontWeight: 500 }}>{attr.name} (Select multiple):</span>
                      {/* Changed from flexDirection: column to row + flexWrap */}
                      <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "12px", paddingLeft: "4px" }}>
                        {options.map((opt) => (
                          <label key={opt} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#334155", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={currentSelection.includes(opt)}
                              onChange={(e) => {
                                let newSelection;
                                if (e.target.checked) {
                                  // Add to array
                                  newSelection = [...currentSelection, opt];
                                } else {
                                  // Remove from array
                                  newSelection = currentSelection.filter(item => item !== opt);
                                }
                                updateInputsForCurrent({ [attr.name]: newSelection });
                              }}
                              style={{ width: "14px", height: "14px", cursor: "pointer" }}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }
                
                // Case B: Single Boolean Checkbox (No values provided)
                return (
                  <label key={attr.id} style={{ fontSize: "12px", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={!!val}
                      onChange={(e) => updateInputsForCurrent({ [attr.name]: e.target.checked })}
                      style={{ width: "14px", height: "14px", cursor: "pointer" }}
                    />
                    {attr.name}
                  </label>
                );
              }

              // 2. Select Type (Dropdown)
              if (attr.type === 'select') {
                const options = attr.values ? attr.values.split(/[\n,]/).map(o => o.trim()).filter(Boolean) : [];
                return (
                  <label key={attr.id} style={{ fontSize: "12px", color: "#1e293b", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {attr.name}:
                    <select
                      value={val || ""} // Default to empty string if undefined
                      onChange={(e) => updateInputsForCurrent({ [attr.name]: e.target.value })}
                      style={{
                        padding: "6px 8px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "12px",
                        cursor: "pointer",
                        outline: "none",
                        transition: "border 0.2s",
                        backgroundColor: "#fff"
                      }}
                      onFocus={(e) => (e.currentTarget.style.border = "1px solid #2563eb")}
                      onBlur={(e) => (e.currentTarget.style.border = "1px solid #cbd5e1")}
                    >
                      <option value="">{t("Choose...")}</option>
                      {options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </label>
                );
              }

              // 3. Radio Type (Single Selection Group)
              if (attr.type === 'radio') {
                const options = attr.values ? attr.values.split(/[\n,]/).map(o => o.trim()).filter(Boolean) : [];
                return (
                  <div key={attr.id} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "12px", color: "#1e293b", fontWeight: 500 }}>{attr.name} (Select one):</span>
                    {/* Changed from flexDirection: column to row + flexWrap */}
                    <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "12px", paddingLeft: "4px" }}>
                      {options.map((opt) => (
                        <label key={opt} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#334155", cursor: "pointer" }}>
                          <input
                            type="radio"
                            name={`radio-group-${attr.id}`} // Unique name ensures only one selected per attribute group
                            value={opt}
                            checked={val === opt} // Will be false if val is undefined/empty
                            onChange={(e) => updateInputsForCurrent({ [attr.name]: e.target.value })}
                            style={{ margin: 0, cursor: "pointer" }}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              }

              // 4. Text or Number Type (Default)
              return (
                <label key={attr.id} style={{ fontSize: "12px", color: "#1e293b", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {attr.name}:
                  <input
                    type={attr.type === 'number' ? 'number' : 'text'}
                    value={val || ""}
                    onChange={(e) => updateInputsForCurrent({ [attr.name]: e.target.value })}
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
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassificationPanel;