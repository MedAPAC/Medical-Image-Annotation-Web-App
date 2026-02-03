// annotation/components/TaskInfoBar.jsx
import React from "react";
import { FileText, ChevronDown } from "lucide-react"; // Assuming you have lucide-react, otherwise remove icons

const TaskInfoBar = ({ taskData, files, selectedFileName, onFileSelect }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#059669';
      case 'in_progress': return '#2563eb';
      default: return '#f59e0b';
    }
  };

  return (
    <div style={{
      padding: "8px 16px",
      backgroundColor: "#f1f5f9",
      borderBottom: "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "16px"
    }}>
      {/* LEFT: Task Info */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div>
            <strong>Task:</strong> {taskData.name} 
        </div>
        <div style={{ borderLeft: "1px solid #cbd5e1", height: "16px" }}></div>
        <div>
            <strong>Status:</strong> 
            <span style={{ color: getStatusColor(taskData.status), marginLeft: "4px", fontWeight: "bold" }}>
            {taskData.status}
            </span>
        </div>
      </div>

      {/* CENTER: File Selector */}
      {files && files.length > 0 && (
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <span style={{ marginRight: "8px", fontSize: "14px", color: "#64748b", fontWeight: "500" }}>
                    Current File:
                </span>
                <select
                    value={selectedFileName || ""}
                    onChange={(e) => onFileSelect(e.target.value)}
                    style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#fff",
                        color: "#334155",
                        fontSize: "14px",
                        fontWeight: "500",
                        cursor: "pointer",
                        outline: "none",
                        minWidth: "200px"
                    }}
                >
                    {files.map((file, index) => (
                        <option key={`${file.filename}-${index}`} value={file.originalName}>
                            {file.originalName}
                        </option>
                    ))}
                </select>
            </div>
        </div>
      )}

      {/* RIGHT: Progress */}
      <div>
        <strong>Progress:</strong> {taskData.progress || 0}% 
        <span style={{ color: "#64748b", marginLeft: "4px" }}>
            ({taskData.completedItems || 0}/{taskData.totalItems || 0})
        </span>
      </div>
    </div>
  );
};

export default TaskInfoBar;
