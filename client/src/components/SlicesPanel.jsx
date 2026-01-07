// annotation/components/Panels/SlicesPanel.jsx
import React, { useEffect } from "react";

const SlicesPanel = ({
  t,
  showSlices,
  setShowSlices,
  slicesRef,
  totalSlices,
  currentSlice,
  setCurrentSlice
}) => {
  useEffect(() => {
    if (showSlices && slicesRef.current) {
      const selected = slicesRef.current.querySelector(`#slice-${currentSlice}`);
      selected?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [showSlices, currentSlice, slicesRef]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", position: "relative" }}>
      <button
        onClick={() => setShowSlices((prev) => !prev)}
        style={{
          padding: "6px 10px",
          backgroundColor: "#3b82f6",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: 500,
          fontSize: "13px",
          transition: "background 0.2s",
          width: "100%",
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
      >
        {t("Choose a Slice")}
      </button>

      {showSlices && (
        <div
          ref={slicesRef}
          style={{
            position: "absolute",
            top: "105%",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            maxHeight: "250px",
            overflowY: "auto",
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          }}
        >
          {Array.from({ length: totalSlices }, (_, i) => (
            <div
              key={i}
              id={`slice-${i}`}
              onClick={() => {
                const clamped = Math.min(i, totalSlices - 1);
                setCurrentSlice(clamped);
                setShowSlices(false);
              }}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                background: i === currentSlice ? "#e0f2fe" : "#fff",
                borderBottom: "1px solid #f1f5f9",
                fontSize: "12px",
                fontWeight: 500,
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#f0f9ff")}
              onMouseOut={(e) =>
                (e.currentTarget.style.background =
                  i === currentSlice ? "#e0f2fe" : "#fff")
              }
            >
              Slice {i + 1}
            </div>
          ))}
        </div>
      )}

      <div style={{ width: "90%", margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <input
          type="range"
          min={0}
          max={Math.max(totalSlices - 1, 0)}
          value={currentSlice}
          onChange={(e) => setCurrentSlice(Number(e.target.value))}
          style={{
            width: "100%",
            cursor: "pointer",
            height: "6px",
            marginBottom: "6px",
          }}
        />
        <div style={{ fontSize: "11px", color: "#64748b" }}>
          {t("Slice")} {currentSlice + 1} / {totalSlices}
        </div>
      </div>
    </div>
  );
};

export default SlicesPanel;