// annotation/components/ToolbarLeft.jsx
import React from "react";

const ToolbarLeft = ({
  shapes,
  allowedShapeIds = [], // New prop: list of allowed tool names/ids
  selectedShape,
  setSelectedShape,
  setToolChangeId,
  sectionIcons,
  openSection,
  setOpenSection
}) => {
  return (
    <div
      style={{
        position: "fixed",
        top: "104px",
        left: 0,
        bottom: 0,
        width: "56px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        borderRight: "1px solid #e2e8f0",
        padding: "16px 0",
        boxShadow: "0 0 8px rgba(0,0,0,0.1)",
        zIndex: 50,
        gap: "16px",
      }}
    >
      {/* Annotation Tools Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
        {shapes.map(({ name, icon }) => {
          // Check if this specific tool is allowed
          // We assume 'name' here matches the IDs in your allowedShapeIds list (e.g., 'brush', 'rectangle')
          const isAllowed = allowedShapeIds.includes(name);
          const isSelected = selectedShape === name;

          return (
            <button
              key={name}
              disabled={!isAllowed} // Disable interaction
              onClick={() => {
                if (isAllowed) {
                  setSelectedShape(name);
                  setToolChangeId((prev) => prev + 1);
                }
              }}
              title={isAllowed ? name : "Tool disabled for this project"}
              style={{
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "12px",
                // Conditional Border
                border: isSelected 
                  ? "2px solid #2563eb" 
                  : "1px solid #cbd5e1",
                // Conditional Background
                background: isSelected 
                  ? "#eff6ff" 
                  : isAllowed ? "#fff" : "#f1f5f9", // darker grey if disabled
                // Conditional Opacity & Cursor
                opacity: isAllowed ? 1 : 0.5,
                cursor: isAllowed ? "pointer" : "not-allowed",
                transition: "all 0.2s",
                pointerEvents: isAllowed ? "auto" : "none",
              }}
            >
              <img
                src={icon}
                alt={name}
                style={{
                  width: 24,
                  height: 24,
                  // Logic: Selected = Blue, Disabled = Grayscale, Standard = None
                  filter: isSelected 
                    ? "invert(34%) sepia(87%) saturate(3390%) hue-rotate(212deg) brightness(95%) contrast(95%)" 
                    : (!isAllowed ? "grayscale(100%)" : "none"),
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Drawer/Panel Toggles Section (Unchanged logic, just keeping style consistent) */}
      {Object.entries(sectionIcons).map(([id, icon]) => (
        <button
          key={id}
          onClick={() => setOpenSection(openSection === id ? null : id)}
          style={{
            width: "48px",
            height: "48px",
            border: "none",
            borderRadius: "12px",
            background: openSection === id ? "#e0f2fe" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "background 0.2s",
            padding: 0,
          }}
        >
          <img
            src={icon}
            alt={id}
            style={{
              width: 24,
              height: 24,
              filter: openSection === id 
                ? "invert(34%) sepia(87%) saturate(3390%) hue-rotate(212deg) brightness(95%) contrast(95%)" 
                : "none",
            }}
          />
        </button>
      ))}
    </div>
  );
};

export default ToolbarLeft;
