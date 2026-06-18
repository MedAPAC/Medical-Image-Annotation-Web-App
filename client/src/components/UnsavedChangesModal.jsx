// annotation/components/UnsavedChangesModal.jsx
import React from "react";

/**
 * Custom modal shown instead of the native browser confirm()/alert()
 * when the user tries to navigate away with unsaved annotations,
 * classifications, or attribute inputs.
 */
const UnsavedChangesModal = ({ open, t, onSaveAndLeave, onLeaveWithoutSaving, onCancel }) => {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "420px",
          padding: "24px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          animation: "uc-fade-in 0.15s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 600, color: "#1e293b" }}>
          {t("Unsaved changes")}
        </h3>
        <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#64748b", lineHeight: 1.5 }}>
          {t("You have unsaved annotations or classifications. If you leave now, your changes will be lost.")}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button
            onClick={onSaveAndLeave}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              background: "#3b82f6",
              color: "#fff",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#2563eb")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#3b82f6")}
          >
            {t("Save & Leave")}
          </button>

          <button
            onClick={onLeaveWithoutSaving}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #fca5a5",
              background: "#fff",
              color: "#dc2626",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#fef2f2")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#fff")}
          >
            {t("Leave without saving")}
          </button>

          <button
            onClick={onCancel}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              background: "#fff",
              color: "#475569",
              fontWeight: 500,
              fontSize: "14px",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#f8fafc")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#fff")}
          >
            {t("Cancel")}
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes uc-fade-in {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
};

export default UnsavedChangesModal;