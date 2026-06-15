import React from "react";

const ToolbarRight = ({
  buttons_right,
  buttons,
  rightPanelOpen,
  setRightPanelOpen,
  onSave, // Using the function from Annotation.jsx
  selectedFileName,
  annotationRefs
}) => {

  return (
    <div
      style={{
        position: "fixed",
        top: "104px", right: 0, bottom: 0, width: "56px",
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: "12px", padding: "12px 0",
        backgroundColor: "#f9fafb", borderLeft: "1px solid #e5e7eb", zIndex: 50,
      }}
    >
      {buttons_right.map(({ id, color, icon, onClick }) => (
        <button
          key={id}
          onClick={() => {
            if (id === "save") {
              onSave(); // Call the robust save function
            } else if (typeof onClick === "function") {
              onClick(selectedFileName, annotationRefs);
            }
          }}
          style={{
            width: "40px", height: "40px", borderRadius: "8px", border: "none",
            backgroundColor: color, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {icon && <img src={icon} alt={id} style={{ width: "18px", height: "18px" }} />}
        </button>
      ))}

      <div style={{ flexGrow: 1 }} />

      {buttons.map(({ id, icon, isImage }) => {
        // GUARD: if isImage is false but `icon` is not a valid React
        // component (undefined, null, or a string), rendering
        // `<icon size={20} />` throws "Element type is invalid: expected
        // a string... but got: undefined" and crashes the whole app.
        const IconComponent = icon;
        const canRenderAsComponent =
          !isImage &&
          (typeof IconComponent === "function" || typeof IconComponent === "object");

        return (
          <button
            key={id}
            onClick={() => setRightPanelOpen(rightPanelOpen === id ? null : id)}
            style={{
              width: "40px", height: "40px", borderRadius: "8px", border: "none",
              backgroundColor: rightPanelOpen === id ? "#e0f2fe" : "transparent",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {isImage && icon ? (
              <img src={icon} alt={id} style={{ width: 20, height: 20 }} />
            ) : canRenderAsComponent ? (
              <IconComponent size={20} />
            ) : null}
          </button>
        );
      })}
    </div>
  );
};

export default ToolbarRight;