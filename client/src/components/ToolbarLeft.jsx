// annotation/components/ToolbarLeft.jsx
import React from "react";

const ToolbarLeft = ({
  shapes,
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
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
        {shapes.map(({ name, icon }) => {
          return (
            <button
              key={name}
              onClick={() => {
                setSelectedShape(name);
                setToolChangeId((prev) => prev + 1);
              }}
              style={{
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "12px",
                border: selectedShape === name ? "2px solid #2563eb" : "1px solid #cbd5e1",
                background: selectedShape === name ? "#eff6ff" : "#fff",
                transition: "all 0.2s",
              }}
            >
              <img
                src={icon}
                alt={name}
                style={{
                  width: 24,
                  height: 24,
                  filter: selectedShape === name 
                    ? "invert(34%) sepia(87%) saturate(3390%) hue-rotate(212deg) brightness(95%) contrast(95%)" 
                    : "none",
                }}
              />
            </button>
          );
        })}
      </div>

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