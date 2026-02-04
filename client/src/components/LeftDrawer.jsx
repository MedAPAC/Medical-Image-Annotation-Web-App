// annotation/components/LeftDrawer.jsx
import React from "react";

const LeftDrawer = ({
  openSection,
  windowCenter,
  windowWidth,
  setWindowCenter,
  setWindowWidth,
  annotationOpacity,
  setAnnotationOpacity,
  selectedShape,
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
  t
}) => {
  const handleResetWindow = () => {
    setWindowCenter(null);
    setWindowWidth(null);
  };

  const handleColorChange = (e) => {
    setBrushColor(e.target.value);
  };

  const formatOpacityPercentage = (value) => {
    return `${Math.round(value * 100)}%`;
  };

  return (
    <div className="left-drawer">
      {/* Window Settings Panel */}
      {openSection === "window" && (
        <div className="settings-panel">
          <div className="panel-header">
            <div className="header-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2.5 6.66667H17.5M2.5 13.3333H17.5M4.16667 2.5V17.5M15.8333 2.5V17.5" 
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <rect x="6.66667" y="8.33333" width="6.66667" height="3.33333" 
                      stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <h3 className="panel-title">{t("Window Settings")}</h3>
            <p className="panel-description">Adjust image display parameters</p>
          </div>

          <div className="settings-group">
            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">{t("Window Center")}</span>
                <span className="label-hint">HU units</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="number"
                  className="number-input"
                  value={windowCenter ?? ""}
                  onChange={(e) => setWindowCenter(e.target.value === "" ? null : Number(e.target.value))}
                  placeholder="Auto"
                  step="1"
                  min="0"
                />
                <span className="input-suffix">HU</span>
              </div>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">{t("Window Width")}</span>
                <span className="label-hint">HU units</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="number"
                  className="number-input"
                  value={windowWidth ?? ""}
                  onChange={(e) => setWindowWidth(e.target.value === "" ? null : Number(e.target.value))}
                  placeholder="Auto"
                  step="1"
                  min="0"
                />
                <span className="input-suffix">HU</span>
              </div>
            </div>
          </div>

          <button 
            className="reset-button"
            onClick={handleResetWindow}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="reset-icon">
              <path d="M13.3334 2.66666L13.3334 6.66666L9.33337 6.66666" 
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2.66663 13.3333L2.66663 9.33333L6.66663 9.33333" 
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4.66663 11.3333C5.43922 12.491 6.64565 13.3248 8.02722 13.6646C9.40879 14.0043 10.8656 13.8273 12.125 13.1675C13.3844 12.5077 14.354 11.413 14.8444 10.0995C15.3347 8.78607 15.3126 7.34838 14.782 6.05066M1.33329 4.66666C1.83862 3.35797 2.80961 2.27332 4.06439 1.61533C5.31918 0.95734 6.77146 0.770059 8.15121 1.08475C9.53095 1.39945 10.7409 2.19569 11.5604 3.32176C12.3798 4.44783 12.7527 5.82613 12.608 7.204" 
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Reset to Default
          </button>
        </div>
      )}

      {/* Opacity Panel */}
      {openSection === "opacity" && (
        <div className="settings-panel">
          <div className="panel-header">
            <div className="header-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 17.5C14.1421 17.5 17.5 14.1421 17.5 10C17.5 5.85786 14.1421 2.5 10 2.5C5.85786 2.5 2.5 5.85786 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5Z" 
                      stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 15.8333C13.2217 15.8333 15.8333 13.2217 15.8333 10C15.8333 6.77834 13.2217 4.16667 10 4.16667C6.77834 4.16667 4.16667 6.77834 4.16667 10C4.16667 13.2217 6.77834 15.8333 10 15.8333Z" 
                      stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1"/>
                <path d="M10 14.1667C12.3012 14.1667 14.1667 12.3012 14.1667 10C14.1667 7.69881 12.3012 5.83333 10 5.83333C7.69881 5.83333 5.83333 7.69881 5.83333 10C5.83333 12.3012 7.69881 14.1667 10 14.1667Z" 
                      stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.3"/>
              </svg>
            </div>
            <h3 className="panel-title">{t("Annotation Opacity")}</h3>
            <p className="panel-description">Adjust overlay transparency</p>
          </div>

          <div className="opacity-control">
            <div className="slider-container">
              <input
                type="range"
                className="opacity-slider"
                min="0"
                max="1"
                step="0.01"
                value={annotationOpacity}
                onChange={(e) => setAnnotationOpacity(Number(e.target.value))}
                aria-label="Annotation opacity"
              />
              <div className="slider-visual">
                <div 
                  className="slider-fill" 
                  style={{ width: `${annotationOpacity * 100}%` }}
                />
              </div>
            </div>
            <div className="opacity-value">
              {formatOpacityPercentage(annotationOpacity)}
            </div>
          </div>

          <div className="opacity-presets">
            <button 
              className={`preset-button ${annotationOpacity === 0.25 ? 'preset-active' : ''}`}
              onClick={() => setAnnotationOpacity(0.25)}
              type="button"
            >
              25%
            </button>
            <button 
              className={`preset-button ${annotationOpacity === 0.5 ? 'preset-active' : ''}`}
              onClick={() => setAnnotationOpacity(0.5)}
              type="button"
            >
              50%
            </button>
            <button 
              className={`preset-button ${annotationOpacity === 0.75 ? 'preset-active' : ''}`}
              onClick={() => setAnnotationOpacity(0.75)}
              type="button"
            >
              75%
            </button>
            <button 
              className={`preset-button ${annotationOpacity === 1 ? 'preset-active' : ''}`}
              onClick={() => setAnnotationOpacity(1)}
              type="button"
            >
              100%
            </button>
          </div>
        </div>
      )}

      {/* Brush Settings Panel */}
      {openSection === "brush" && selectedShape === "brush" && (
        <div className="settings-panel">
          <div className="panel-header">
            <div className="header-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 2.5L17.5 7.5L10 15L5 10L12.5 2.5Z" 
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2.5 17.5L5 15" 
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="8.75" cy="11.25" r="1.25" fill="currentColor"/>
              </svg>
            </div>
            <h3 className="panel-title">{t("Brush Settings")}</h3>
            <p className="panel-description">Customize drawing tool</p>
          </div>

          <div className="settings-group">
            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">Brush Color</span>
              </label>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  className="color-picker"
                  value={brushColor}
                  onChange={handleColorChange}
                  aria-label="Brush color"
                />
                <div className="color-preview" style={{ backgroundColor: brushColor }} />
                <span className="color-value">{brushColor.toUpperCase()}</span>
              </div>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">Brush Size</span>
                <span className="label-hint">{brushSize}px</span>
              </label>
              <div className="brush-size-control">
                <div className="slider-container">
                  <input
                    type="range"
                    className="brush-slider"
                    min="1"
                    max="50"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    aria-label="Brush size"
                  />
                  <div className="slider-visual">
                    <div 
                      className="slider-fill" 
                      style={{ width: `${(brushSize - 1) / 49 * 100}%` }}
                    />
                  </div>
                </div>
                <div className="brush-preview">
                  <div 
                    className="brush-dot" 
                    style={{
                      width: `${brushSize}px`,
                      height: `${brushSize}px`,
                      backgroundColor: brushColor
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="brush-presets">
            <div className="presets-label">Quick Sizes</div>
            <div className="preset-grid">
              {[1, 5, 10, 20, 30, 50].map((size) => (
                <button
                  key={size}
                  className={`size-preset ${brushSize === size ? 'size-preset-active' : ''}`}
                  onClick={() => setBrushSize(size)}
                  type="button"
                  aria-label={`Set brush size to ${size}px`}
                >
                  <div 
                    className="preset-dot" 
                    style={{
                      width: `${Math.min(size, 24)}px`,
                      height: `${Math.min(size, 24)}px`,
                      backgroundColor: brushColor
                    }}
                  />
                  <span className="preset-label">{size}px</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Inline Styles */}
      <style jsx>{`
        .left-drawer {
          position: fixed;
          top: 104px;
          left: ${openSection ? "80px" : "-320px"};
          bottom: 0;
          width: 320px;
          background: #ffffff;
          border-right: 1px solid #e2e8f0;
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.08);
          overflow-y: auto;
          z-index: 40;
          transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 24px;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f8fafc;
        }

        .left-drawer::-webkit-scrollbar {
          width: 6px;
        }

        .left-drawer::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 3px;
        }

        .left-drawer::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .left-drawer::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Settings Panel */
        .settings-panel {
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Panel Header */
        .panel-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        .header-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: #eff6ff;
          border-radius: 10px;
          color: #3b82f6;
          margin-bottom: 4px;
        }

        .panel-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
          line-height: 1.3;
        }

        .panel-description {
          font-size: 13px;
          color: #64748b;
          margin: 0;
          line-height: 1.4;
        }

        /* Settings Group */
        .settings-group {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Setting Item */
        .setting-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .setting-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .label-text {
          font-size: 14px;
          font-weight: 500;
          color: #334155;
        }

        .label-hint {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 400;
        }

        /* Input Wrapper */
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .number-input {
          width: 100%;
          padding: 10px 40px 10px 12px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          color: #334155;
          transition: all 0.15s ease;
        }

        .number-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .number-input::placeholder {
          color: #94a3b8;
        }

        .input-suffix {
          position: absolute;
          right: 12px;
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
          pointer-events: none;
        }

        /* Reset Button */
        .reset-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          width: 100%;
          margin-top: 8px;
        }

        .reset-button:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #475569;
        }

        .reset-button:active {
          transform: translateY(1px);
        }

        .reset-icon {
          color: #64748b;
        }

        /* Opacity Control */
        .opacity-control {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 10px;
        }

        .slider-container {
          position: relative;
          flex: 1;
          height: 24px;
          display: flex;
          align-items: center;
        }

        .opacity-slider,
        .brush-slider {
          position: absolute;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          z-index: 2;
        }

        .slider-visual {
          position: absolute;
          width: 100%;
          height: 6px;
          background: #e2e8f0;
          border-radius: 3px;
          overflow: hidden;
          z-index: 1;
        }

        .slider-fill {
          position: absolute;
          height: 100%;
          background: linear-gradient(to right, #3b82f6, #60a5fa);
          border-radius: 3px;
          transition: width 0.15s ease;
        }

        .opacity-value {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          min-width: 48px;
          text-align: center;
        }

        /* Opacity Presets */
        .opacity-presets {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-top: 8px;
        }

        .preset-button {
          padding: 8px 12px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          color: #64748b;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .preset-button:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .preset-active {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #1d4ed8;
          font-weight: 600;
        }

        /* Color Picker */
        .color-picker-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .color-picker {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          padding: 0;
        }

        .color-picker::-webkit-color-swatch-wrapper {
          padding: 0;
        }

        .color-picker::-webkit-color-swatch {
          border: none;
          border-radius: 4px;
        }

        .color-preview {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          border: 2px solid #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .color-value {
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          font-family: 'Monaco', 'Menlo', monospace;
          margin-left: auto;
        }

        /* Brush Size Control */
        .brush-size-control {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .brush-preview {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 40px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .brush-dot {
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: all 0.2s ease;
        }

        /* Brush Presets */
        .brush-presets {
          margin-top: 16px;
        }

        .presets-label {
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          margin-bottom: 12px;
        }

        .preset-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .size-preset {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 12px 8px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .size-preset:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .size-preset-active {
          background: #eff6ff;
          border-color: #3b82f6;
        }

        .preset-dot {
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .preset-label {
          font-size: 11px;
          font-weight: 500;
          color: #64748b;
        }

        .size-preset-active .preset-label {
          color: #1d4ed8;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default LeftDrawer;