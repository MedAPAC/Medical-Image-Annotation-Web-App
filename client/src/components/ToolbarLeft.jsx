// annotation/components/ToolbarLeft.jsx
import React from "react";

const ToolbarLeft = ({
  shapes,
  allowedShapeIds = [], 
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
          const isAllowed = allowedShapeIds.includes(name);
          const isSelected = selectedShape === name;

          return (
            <button
              key={name}
              disabled={!isAllowed} 
              onClick={() => {
                if (!isAllowed) return;

                if (isSelected) {
                  // CASE 1: Deselect if already selected
                  setSelectedShape(null);
                  
                  // If we are deselecting the brush, close the brush settings panel if it's open
                  if (name === 'brush' && openSection === 'brush') {
                    setOpenSection(null);
                  }
                } else {
                  // CASE 2: Select new tool
                  setSelectedShape(name);
                  setToolChangeId((prev) => prev + 1);
                  
                  // Auto-close brush settings if switching away from brush to a different tool
                  if (openSection === 'brush' && name !== 'brush') {
                    setOpenSection(null);
                  }
                }
              }}
              title={isAllowed ? (isSelected ? `Deselect ${name}` : name) : "Tool disabled for this project"}
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
                  : isAllowed ? "#fff" : "#f1f5f9", 
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

      {/* Drawer/Panel Toggles Section */}
      {Object.entries(sectionIcons).map(([id, icon]) => {
        
        // Determine if this specific section button should be disabled
        // Specifically for 'brush' settings, ensure 'brush' tool is active
        const isBrushSettings = id === 'brush';
        const isDisabled = isBrushSettings && selectedShape !== 'brush';

        return (
          <button
            key={id}
            disabled={isDisabled} 
            onClick={() => !isDisabled && setOpenSection(openSection === id ? null : id)}
            title={isDisabled ? "Select Brush tool to edit settings" : ""}
            style={{
              width: "48px",
              height: "48px",
              border: "none",
              borderRadius: "12px",
              // Visual feedback: Blue if open, Transparent if closed
              background: openSection === id ? "#e0f2fe" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              // Cursor and Opacity feedback for disabled state
              cursor: isDisabled ? "not-allowed" : "pointer",
              opacity: isDisabled ? 0.3 : 1,
              transition: "all 0.2s",
              padding: 0,
            }}
          >
            <img
              src={icon}
              alt={id}
              style={{
                width: 24,
                height: 24,
                // Logic: Active = Blue, Disabled = Grayscale, Standard = Black/Grey
                filter: openSection === id 
                  ? "invert(34%) sepia(87%) saturate(3390%) hue-rotate(212deg) brightness(95%) contrast(95%)" 
                  : (isDisabled ? "grayscale(100%)" : "none"),
              }}
            />
          </button>
        );
      })}
    </div>
  );
};

export default ToolbarLeft;
