import React from 'react';
import { Crosshair, RotateCcw, ZoomIn } from 'lucide-react';

const ZoomPanel = ({
  t,
  isZoomMode,
  setIsZoomMode,
  zoomLevel,
  setZoomLevel,
  zoomRegion,
  setZoomRegion,
}) => {
  const safeZoomLevel = Number.isFinite(zoomLevel) ? zoomLevel : 1;
  const canReset = safeZoomLevel > 1 || zoomRegion || isZoomMode;

  const handleReset = () => {
    setZoomLevel(1);
    setZoomRegion(null);
    setIsZoomMode(false);
  };

  return (
    <div className='zoom-panel'>
      <section className='annotation-panel-card'>
        <div className='zoom-level-readout'>
          <span className='zoom-level-icon'><ZoomIn size={17} /></span>
          <div>
            <span>{t('Current zoom')}</span>
            <strong>{safeZoomLevel.toFixed(1)}x</strong>
          </div>
        </div>

        <label className='clinical-range-field'>
          <span className='clinical-range-heading'>
            <strong>{t('Magnification')}</strong>
            <output>{safeZoomLevel.toFixed(1)}x</output>
          </span>
          <input
            type='range'
            min='1'
            max='8'
            step='0.1'
            value={safeZoomLevel}
            onChange={(event) => {
              const value = Number(event.target.value);
              setZoomLevel(value);
              if (value <= 1) setZoomRegion(null);
            }}
          />
          <span className='range-labels'><small>1x</small><small>8x</small></span>
        </label>
      </section>

      <section className='annotation-panel-card'>
        <div className='annotation-panel-card-header'>
          <h4>{t('Region zoom')}</h4>
        </div>
        <button
          type='button'
          className={`zoom-region-button ${isZoomMode ? 'active' : ''}`}
          onClick={() => setIsZoomMode((previous) => !previous)}
        >
          <Crosshair size={17} />
          {isZoomMode ? t('Cancel region selection') : t('Draw zoom region')}
        </button>
        <p className='annotation-control-note'>
          {isZoomMode
            ? t('Drag a rectangle over the anatomy you want to inspect.')
            : t('Region zoom pauses drawing until an area is selected.')}
        </p>
      </section>

      <button
        type='button'
        className='drawer-secondary-button'
        onClick={handleReset}
        disabled={!canReset}
      >
        <RotateCcw size={16} />
        {t('Reset to 1x')}
      </button>
    </div>
  );
};

export default ZoomPanel;
