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
    <div className="annotation-left-toolbar" aria-label="Annotation tools">
      {/* Annotation Tools Section */}
      <div className="annotation-tool-group">
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
              className={[
                "annotation-tool-button",
                isSelected ? "active" : "",
                !isAllowed ? "disabled" : "",
              ].filter(Boolean).join(" ")}
            >
              <img
                src={icon}
                alt={name}
                className="annotation-tool-icon"
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
            className={[
              "annotation-section-button",
              openSection === id ? "active" : "",
              isDisabled ? "disabled" : "",
            ].filter(Boolean).join(" ")}
          >
            <img
              src={icon}
              alt={id}
              className="annotation-tool-icon"
            />
          </button>
        );
      })}
    </div>
  );
};

export default ToolbarLeft;
