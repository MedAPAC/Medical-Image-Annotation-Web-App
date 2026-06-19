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
    <div className="annotation-right-toolbar" aria-label="Annotation actions and panels">
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
          className={`annotation-action-button ${id}`}
          style={{ "--action-color": color }}
          title={id === "save" ? "Save annotations" : id === "clearAll" ? "Clear all annotations" : "Delete selected annotation"}
        >
          {icon && <img src={icon} alt={id} className="annotation-action-icon" />}
        </button>
      ))}

      <div className="annotation-toolbar-spacer" />

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
            className={`annotation-panel-button ${rightPanelOpen === id ? "active" : ""}`}
            title={`Open ${id}`}
          >
            {isImage && icon ? (
              <img src={icon} alt={id} className="annotation-panel-icon" />
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
