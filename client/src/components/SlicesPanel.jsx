import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, List, ScanLine } from 'lucide-react';

const SlicesPanel = ({
  t,
  showSlices,
  setShowSlices,
  slicesRef,
  totalSlices,
  currentSlice,
  setCurrentSlice,
}) => {
  const safeTotalSlices = Number.isFinite(totalSlices) && totalSlices > 0
    ? totalSlices
    : 0;
  const safeCurrentSlice = Number.isFinite(currentSlice)
    ? Math.min(Math.max(currentSlice, 0), Math.max(safeTotalSlices - 1, 0))
    : 0;

  useEffect(() => {
    if (!showSlices || !slicesRef.current) return;
    try {
      slicesRef.current
        .querySelector(`#slice-${safeCurrentSlice}`)
        ?.scrollIntoView({ block: 'nearest' });
    } catch (error) {
      console.warn('SlicesPanel: failed to focus current slice', error);
    }
  }, [showSlices, safeCurrentSlice, slicesRef]);

  const goToSlice = (nextSlice) => {
    if (safeTotalSlices <= 0 || !Number.isFinite(nextSlice)) return;
    setCurrentSlice(Math.min(Math.max(Math.round(nextSlice), 0), safeTotalSlices - 1));
  };

  return (
    <div className='slices-panel'>
      <div className='slice-stepper'>
        <button
          type='button'
          onClick={() => goToSlice(safeCurrentSlice - 1)}
          disabled={safeCurrentSlice <= 0}
          aria-label={t('Previous slice')}
          title={t('Previous slice')}
        >
          <ChevronLeft size={18} />
        </button>
        <label>
          <span>{t('Current slice')}</span>
          <div>
            <input
              type='number'
              min='1'
              max={safeTotalSlices || 1}
              value={safeTotalSlices ? safeCurrentSlice + 1 : 0}
              onChange={(event) => goToSlice(Number(event.target.value) - 1)}
              disabled={safeTotalSlices <= 0}
            />
            <strong>/ {safeTotalSlices}</strong>
          </div>
        </label>
        <button
          type='button'
          onClick={() => goToSlice(safeCurrentSlice + 1)}
          disabled={safeCurrentSlice >= safeTotalSlices - 1 || safeTotalSlices <= 0}
          aria-label={t('Next slice')}
          title={t('Next slice')}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <label className='clinical-range-field'>
        <span className='sr-only'>{t('Current slice')}</span>
        <input
          type='range'
          min='0'
          max={Math.max(safeTotalSlices - 1, 0)}
          value={safeCurrentSlice}
          onChange={(event) => goToSlice(Number(event.target.value))}
          disabled={safeTotalSlices <= 1}
        />
        <span className='range-labels'><small>1</small><small>{safeTotalSlices || 1}</small></span>
      </label>

      <button
        type='button'
        onClick={() => setShowSlices((previous) => !previous)}
        disabled={safeTotalSlices <= 0}
        className='slice-picker-button'
        aria-expanded={showSlices}
      >
        <List size={16} />
        {showSlices ? t('Hide slice list') : t('Open slice list')}
      </button>

      {showSlices && (
        <div ref={slicesRef} className='slice-dropdown-list'>
          {Array.from({ length: safeTotalSlices }, (_, index) => (
            <button
              key={index}
              id={`slice-${index}`}
              type='button'
              onClick={() => {
                goToSlice(index);
                setShowSlices(false);
              }}
              className={index === safeCurrentSlice ? 'active' : ''}
            >
              <span className='slice-list-label'><ScanLine size={13} /> {t('Slice')} {index + 1}</span>
              {index === safeCurrentSlice ? <strong>{t('Current')}</strong> : null}
            </button>
          ))}
        </div>
      )}

      <p className='annotation-control-note'>
        {t('Use the left and right arrow keys to move between slices while the viewer is focused.')}
      </p>
    </div>
  );
};

export default SlicesPanel;
