// annotation/components/TaskInfoBar.jsx
import React from "react";
import { FileText, ChevronDown } from "lucide-react";

const TaskInfoBar = ({ taskData, files, selectedFileName, onFileSelect }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#059669';
      case 'in_progress': return '#2563eb';
      default: return '#f59e0b';
    }
  };

  return (
    <div className="task-info-bar">
      {/* LEFT: Task Info */}
      <div className="task-info-meta">
        <div className="task-info-name">
          <span className="task-info-label">Task</span>
          <strong>{taskData.name}</strong>
        </div>
        <div className="task-info-divider" />
        <div className="task-info-status-wrap">
          <span className="task-info-label">Status</span>
          <span
            className="task-info-status"
            style={{ color: getStatusColor(taskData.status) }}
          >
            {taskData.status}
          </span>
        </div>
      </div>

      {/* CENTER: File Selector */}
      {files && files.length > 0 && (
        <div className="task-file-selector">
            <FileText size={16} />
            <span className="task-info-label">Current file</span>
            <div className="task-file-select-wrap">
                <select
                    value={selectedFileName || ""}
                    onChange={(e) => onFileSelect(e.target.value)}
                    className="task-file-select"
                >
                    {files.map((file, index) => (
                        <option
                            key={`${file.annotationKey || file.filename || file.originalName}-${index}`}
                            value={file.annotationKey || file.originalName}
                        >
                            {file.displayName || file.originalName}
                        </option>
                    ))}
                </select>
                <ChevronDown size={15} className="task-file-chevron" />
            </div>
        </div>
      )}

      {/* RIGHT: Progress */}
      <div className="task-info-progress">
        <span className="task-info-label">Progress</span>
        <strong>{taskData.progress || 0}%</strong>
        <span>
            ({taskData.completedItems || 0}/{taskData.totalItems || 0})
        </span>
      </div>
    </div>
  );
};

export default TaskInfoBar;
