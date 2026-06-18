// annotation/components/Panels/ClassificationPanel.jsx
import React from "react";

const splitAttributeOptions = (values) => (
  values ? values.split(/[\n,]/).map((option) => option.trim()).filter(Boolean) : []
);

const ClassificationPanel = ({
  t,
  viewType,
  setViewType,
  selectedFileName,
  currentSlice,
  classificationByFileAndSlice,
  setClassificationByFileAndSlice,
  getInputsForCurrent,
  updateInputsForCurrent,
  projectAttributes = []
}) => {
  const inputs = getInputsForCurrent() || {};
  const currentClassification = classificationByFileAndSlice[selectedFileName]?.[currentSlice] || null;

  const setClassification = (classification) => {
    if (classification === "clear") {
      setClassificationByFileAndSlice((prev) => {
        const updated = { ...(prev[selectedFileName] || {}) };
        delete updated[currentSlice];
        return { ...prev, [selectedFileName]: updated };
      });
      return;
    }

    setClassificationByFileAndSlice((prev) => ({
      ...prev,
      [selectedFileName]: {
        ...(prev[selectedFileName] || {}),
        [currentSlice]: classification,
      },
    }));
  };

  const renderAttribute = (attr) => {
    const val = inputs[attr.name];
    const options = splitAttributeOptions(attr.values);

    if (attr.type === "checkbox") {
      if (options.length > 0) {
        const currentSelection = Array.isArray(val) ? val : [];

        return (
          <div key={attr.id || attr.name} className="annotation-attribute-field">
            <span className="annotation-attribute-label">{attr.name}</span>
            <div className="annotation-option-grid">
              {options.map((opt) => (
                <label key={opt} className="annotation-option">
                  <input
                    type="checkbox"
                    checked={currentSelection.includes(opt)}
                    onChange={(e) => {
                      const nextSelection = e.target.checked
                        ? [...currentSelection, opt]
                        : currentSelection.filter((item) => item !== opt);
                      updateInputsForCurrent({ [attr.name]: nextSelection });
                    }}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        );
      }

      return (
        <label key={attr.id || attr.name} className="annotation-option annotation-option-boolean">
          <input
            type="checkbox"
            checked={!!val}
            onChange={(e) => updateInputsForCurrent({ [attr.name]: e.target.checked })}
          />
          <span>{attr.name}</span>
        </label>
      );
    }

    if (attr.type === "select") {
      return (
        <label key={attr.id || attr.name} className="annotation-attribute-field">
          <span className="annotation-attribute-label">{attr.name}</span>
          <select
            value={val || ""}
            onChange={(e) => updateInputsForCurrent({ [attr.name]: e.target.value })}
            className="annotation-panel-input"
          >
            <option value="">{t("Choose...")}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </label>
      );
    }

    if (attr.type === "radio") {
      return (
        <div key={attr.id || attr.name} className="annotation-attribute-field">
          <span className="annotation-attribute-label">{attr.name}</span>
          <div className="annotation-option-grid">
            {options.map((opt) => (
              <label key={opt} className="annotation-option">
                <input
                  type="radio"
                  name={`radio-group-${attr.id || attr.name}`}
                  value={opt}
                  checked={val === opt}
                  onChange={(e) => updateInputsForCurrent({ [attr.name]: e.target.value })}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    return (
      <label key={attr.id || attr.name} className="annotation-attribute-field">
        <span className="annotation-attribute-label">{attr.name}</span>
        <input
          type={attr.type === "number" ? "number" : "text"}
          value={val || ""}
          onChange={(e) => updateInputsForCurrent({ [attr.name]: e.target.value })}
          className="annotation-panel-input"
        />
      </label>
    );
  };

  return (
    <div className="classification-panel">
      <section className="annotation-panel-card">
        <div className="annotation-panel-card-header">
          <h4>{t("View Type")}</h4>
        </div>
        <div className="annotation-segmented-control" role="group" aria-label={t("View Type")}>
          {["axial", "coronal", "sagittal"].map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setViewType(view)}
              className={viewType === view ? "active" : ""}
            >
              {t(view.charAt(0).toUpperCase() + view.slice(1))}
            </button>
          ))}
        </div>
      </section>

      <section className="annotation-panel-card">
        <div className="annotation-panel-card-header">
          <h4>{t("Classification")}</h4>
          <span>{t("Slice")} {currentSlice + 1}</span>
        </div>
        <div className="classification-actions">
          {["positive", "negative", "clear"].map((classification) => (
            <button
              key={classification}
              type="button"
              onClick={() => setClassification(classification)}
              className={[
                "classification-action",
                classification,
                currentClassification === classification ? "active" : "",
              ].filter(Boolean).join(" ")}
            >
              {t(classification)}
            </button>
          ))}
        </div>
      </section>

      <section className="annotation-panel-card">
        <div className="annotation-panel-card-header">
          <h4>{t("Attributes")}</h4>
          <span>{projectAttributes.length}</span>
        </div>
        <div className="annotation-attribute-list">
          {projectAttributes.length === 0 ? (
            <p className="annotation-empty-note">{t("No attributes configured")}</p>
          ) : (
            projectAttributes.map(renderAttribute)
          )}
        </div>
      </section>
    </div>
  );
};

export default ClassificationPanel;
