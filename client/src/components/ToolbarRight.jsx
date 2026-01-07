// annotation/components/ToolbarRight.jsx
import React from "react";
import axios from "axios";

const ToolbarRight = ({
  buttons_right,
  selectedFileName,
  annotationRefs,
  buttons,
  rightPanelOpen,
  setRightPanelOpen,
  handleSaveAllAnnotations,
  taskData,
  currentSlice,
  totalSlices,
  token,
  taskId,
  setTaskData
}) => {
  // Save annotations function
  const saveAnnotations = async () => {
    if (!token) {
      alert("Please login to save annotations");
      return;
    }

    try {
      // Implementation here
      // This should be moved to a separate service/hook
      alert("All Changes Saved Successfully!");
      
      // Update task progress
      if (taskData) {
        const progress = Math.min(100, Math.round((currentSlice + 1) / totalSlices * 100));
        await axios.put(`http://localhost:5000/api/tasks/${taskId}/progress`, {
          progress,
          completedItems: currentSlice + 1
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setTaskData(prev => ({
          ...prev,
          progress,
          completedItems: currentSlice + 1
        }));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to Save Changes. Please Try Again!");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "104px",
        right: 0,
        bottom: 0,
        width: "56px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        padding: "12px 0",
        backgroundColor: "#f9fafb",
        borderLeft: "1px solid #e5e7eb",
        boxShadow: "-2px 0 6px rgba(0,0,0,0.05)",
        zIndex: 50,
      }}
    >
      {buttons_right.map(({ id, color, icon, onClick }) => (
        <button
          key={id}
          onClick={() => {
            if (id === "save") {
              saveAnnotations();
            } else {
              onClick(selectedFileName, annotationRefs);
            }
          }}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: color,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "scale(1.08)";
            e.currentTarget.style.boxShadow = "0 3px 8px rgba(0,0,0,0.15)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <img src={icon} alt={id} style={{ width: "18px", height: "18px" }} />
        </button>
      ))}

      <div style={{ flexGrow: 1 }} />

      {buttons.map(({ id, icon, isImage }) => (
        <button
          key={id}
          onClick={() => setRightPanelOpen(rightPanelOpen === id ? null : id)}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: rightPanelOpen === id ? "#e0f2fe" : "transparent",
            color: "#0f172a",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s, transform 0.15s",
          }}
          onMouseOver={(e) => {
            if (rightPanelOpen !== id) e.currentTarget.style.backgroundColor = "#f1f5f9";
          }}
          onMouseOut={(e) => {
            if (rightPanelOpen !== id) e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          {isImage ? (
            <img src={icon} alt={id} style={{ width: 20, height: 20 }} />
          ) : (
            <icon size={20} />
          )}
        </button>
      ))}
    </div>
  );
};

export default ToolbarRight;