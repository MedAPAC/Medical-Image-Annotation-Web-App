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

  const safeTotalSlices = Number.isFinite(totalSlices) && totalSlices > 0 ? totalSlices : 0;
  const safeCurrentSlice =
    typeof currentSlice === "number" && Number.isFinite(currentSlice)
      ? Math.min(Math.max(currentSlice, 0), Math.max(safeTotalSlices - 1, 0))
      : 0;
  const displaySlice = safeTotalSlices > 0 ? safeCurrentSlice + 1 : 0;

  const handleSliderChange = (e) => {
    if (safeTotalSlices <= 0) return;
    const raw = Number(e.target.value);
    if (!Number.isFinite(raw)) return;
    setCurrentSlice(Math.min(Math.max(raw, 0), Math.max(safeTotalSlices - 1, 0)));
  };

  return (
    <div className="slices-panel">
      <div className="slice-readout">
        <span>{t("Current slice")}</span>
        <strong>{displaySlice} / {safeTotalSlices}</strong>
      </div>

      <button
        type="button"
        onClick={() => setShowSlices((prev) => !prev)}
        disabled={safeTotalSlices <= 0}
        className="slice-picker-button"
      >
        {showSlices ? t("Hide slices") : t("Choose a Slice")}
      </button>

      {showSlices && (
        <div ref={slicesRef} className="slice-dropdown-list">
          {Array.from({ length: safeTotalSlices }, (_, i) => (
            <button
              key={i}
              id={`slice-${i}`}
              type="button"
              onClick={() => {
                setCurrentSlice(Math.min(Math.max(i, 0), Math.max(safeTotalSlices - 1, 0)));
                setShowSlices(false);
              }}
              className={i === safeCurrentSlice ? "active" : ""}
            >
              <span>{t("Slice")} {i + 1}</span>
            </button>
          ))}
        </div>
      )}

      <div className="slice-slider-control">
        <input
          type="range"
          min={0}
          max={Math.max(safeTotalSlices - 1, 0)}
          value={safeCurrentSlice}
          onChange={handleSliderChange}
          disabled={safeTotalSlices <= 1}
        />
        <div className="slice-slider-labels">
          <span>1</span>
          <span>{safeTotalSlices || 1}</span>
        </div>
      </div>
    </div>
  );
};

export default SlicesPanel;
