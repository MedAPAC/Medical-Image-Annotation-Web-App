// annotation/components/TaskInfoBar.jsx
import React from "react";

const TaskInfoBar = ({ taskData }) => {
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
      alignItems: "center"
    }}>
      <div>
        <strong>Task:</strong> {taskData.name} | 
        <strong> Status:</strong> 
        <span style={{ color: getStatusColor(taskData.status), marginLeft: "4px" }}>
          {taskData.status}
        </span>
      </div>
      <div>
        <strong>Progress:</strong> {taskData.progress || 0}% 
        ({taskData.completedItems || 0}/{taskData.totalItems || 0})
      </div>
    </div>
  );
};

export default TaskInfoBar;