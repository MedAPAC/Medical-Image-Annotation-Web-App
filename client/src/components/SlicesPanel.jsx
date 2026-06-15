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
    if (!showSlices || !slicesRef.current) return;
    // GUARD: currentSlice can momentarily be undefined/NaN/negative
    // (e.g. right after switching viewType, before totalSlices/currentSlice
    // are reconciled). `querySelector(\`#slice-${currentSlice}\`)` with a
    // non-integer id (like "#slice-NaN" or "#slice-undefined") throws a
    // SyntaxError and crashes the component. Validate first.
    if (
      typeof currentSlice !== "number" ||
      !Number.isFinite(currentSlice) ||
      currentSlice < 0
    ) {
      return;
    }

    try {
      const selected = slicesRef.current.querySelector(`#slice-${currentSlice}`);
      selected?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } catch (err) {
      console.warn("SlicesPanel: failed to scroll to slice", currentSlice, err);
    }
  }, [showSlices, currentSlice, slicesRef]);

  // GUARD: never render a negative/garbage slice count
  const safeTotalSlices = Number.isFinite(totalSlices) && totalSlices > 0 ? totalSlices : 0;

  // Display value for the slider/label — falls back to 0 if currentSlice
  // is momentarily invalid, so the UI never shows "NaN" or crashes.
  const safeCurrentSlice =
    typeof currentSlice === "number" && Number.isFinite(currentSlice)
      ? Math.min(Math.max(currentSlice, 0), Math.max(safeTotalSlices - 1, 0))
      : 0;

  const handleSliderChange = (e) => {
    const raw = Number(e.target.value);
    if (!Number.isFinite(raw)) return; // ignore invalid input (e.g. cleared field)
    const clamped = Math.min(Math.max(raw, 0), Math.max(safeTotalSlices - 1, 0));
    setCurrentSlice(clamped);
  };

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
          {Array.from({ length: safeTotalSlices }, (_, i) => (
            <div
              key={i}
              id={`slice-${i}`}
              onClick={() => {
                const clamped = Math.min(Math.max(i, 0), Math.max(safeTotalSlices - 1, 0));
                setCurrentSlice(clamped);
                setShowSlices(false);
              }}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                background: i === safeCurrentSlice ? "#e0f2fe" : "#fff",
                borderBottom: "1px solid #f1f5f9",
                fontSize: "12px",
                fontWeight: 500,
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#f0f9ff")}
              onMouseOut={(e) =>
                (e.currentTarget.style.background =
                  i === safeCurrentSlice ? "#e0f2fe" : "#fff")
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
          max={Math.max(safeTotalSlices - 1, 0)}
          value={safeCurrentSlice}
          onChange={handleSliderChange}
          disabled={safeTotalSlices <= 1}
          style={{
            width: "100%",
            cursor: safeTotalSlices <= 1 ? "not-allowed" : "pointer",
            height: "6px",
            marginBottom: "6px",
          }}
        />
        <div style={{ fontSize: "11px", color: "#64748b" }}>
          {t("Slice")} {safeCurrentSlice + 1} / {safeTotalSlices}
        </div>
      </div>
    </div>
  );
};

export default SlicesPanel;