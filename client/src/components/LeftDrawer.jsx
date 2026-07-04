import React from 'react';
import {
  Check,
  Layers3,
  Paintbrush,
  RotateCcw,
  SlidersHorizontal,
  Tags,
  X,
  CircleDot,
  Wand2,
  Download,
} from 'lucide-react';

const PANEL_META = {
  labels: {
    title: 'Active label',
    description: 'Choose the finding applied to new annotations.',
    icon: Tags,
  },
  window: {
    title: 'Windowing',
    description: 'Adjust image contrast using center and width.',
    icon: SlidersHorizontal,
  },
  opacity: {
    title: 'Overlay opacity',
    description: 'Balance annotation visibility against anatomy.',
    icon: Layers3,
  },
  brush: {
    title: 'Brush settings',
    description: 'Set the color and diameter of the active brush.',
    icon: Paintbrush,
  },
  ai: {
    title: 'Semi-Supervised AI',
    description: 'Configure interactive prompts and model inference settings.',
    icon: CircleDot,
  },
};

const LeftDrawer = ({
  openSection,
  setOpenSection,
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
  selectedLabel,
  setSelectedLabel,
  labelOptions = [],
  t,
  activeAIModel,
  setActiveAIModel,
  enabledAIPromptTypes,
  setEnabledAIPromptTypes,
  aiTextPrompt,
  setAiTextPrompt,
  aiPromptIsPositive,
  setAiPromptIsPositive,
  onRunAIInference,
  onClearAIPrompts,
  onConvertPolygonToMask,
  onConvertMaskToPolygon,
  onExportDataset,
}) => {
  const meta = PANEL_META[openSection] || PANEL_META.labels;
  const PanelIcon = meta.icon;

  return (
    <aside
      className={`left-drawer ${openSection ? 'open' : 'closed'}`}
      aria-hidden={!openSection}
      aria-label={t(meta.title)}
    >
      <header className='drawer-header'>
        <span className='drawer-header-icon' aria-hidden='true'>
          <PanelIcon size={19} />
        </span>
        <div className='drawer-heading-copy'>
          <h2>{t(meta.title)}</h2>
          <p>{t(meta.description)}</p>
        </div>
        <button
          type='button'
          className='drawer-close-button'
          onClick={() => setOpenSection(null)}
          aria-label={t('Close settings')}
          title={t('Close settings')}
        >
          <X size={17} />
        </button>
      </header>

      <div className='drawer-content'>
        {openSection === 'labels' && (
          <section className='drawer-section'>
            <div className='drawer-section-heading'>
              <span>{t('Available labels')}</span>
              <strong>{labelOptions.length}</strong>
            </div>
            {labelOptions.length === 0 ? (
              <div className='drawer-empty-state'>
                <Tags size={22} />
                <strong>{t('No labels for this tool')}</strong>
                <p>{t('Choose another drawing tool or configure labels in the project.')}</p>
              </div>
            ) : (
              <div className='annotation-label-list' role='radiogroup' aria-label={t('Active label')}>
                {labelOptions.map((option) => {
                  const isActive = selectedLabel === option.value;
                  return (
                    <button
                      type='button'
                      key={option.value}
                      className={`annotation-label-option ${isActive ? 'active' : ''}`}
                      onClick={() => setSelectedLabel(option.value)}
                      role='radio'
                      aria-checked={isActive}
                    >
                      <span
                        className='annotation-label-swatch'
                        style={{ backgroundColor: option.color || '#2563eb' }}
                      />
                      <span className='annotation-label-copy'>
                        <strong>{option.label || option.value}</strong>
                        <small>{option.type || selectedShape || t('Annotation')}</small>
                      </span>
                      <span className='annotation-label-check' aria-hidden='true'>
                        {isActive ? <Check size={15} /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {openSection === 'window' && (
          <section className='drawer-section'>
            <div className='clinical-field-grid'>
              <label className='clinical-field'>
                <span>
                  <strong>{t('Window center')}</strong>
                  <small>HU</small>
                </span>
                <div className='clinical-number-input'>
                  <input
                    type='number'
                    value={windowCenter ?? ''}
                    onChange={(event) => setWindowCenter(
                      event.target.value === '' ? null : Number(event.target.value)
                    )}
                    placeholder={t('Auto')}
                    step='1'
                  />
                  <span>HU</span>
                </div>
              </label>

              <label className='clinical-field'>
                <span>
                  <strong>{t('Window width')}</strong>
                  <small>HU</small>
                </span>
                <div className='clinical-number-input'>
                  <input
                    type='number'
                    value={windowWidth ?? ''}
                    onChange={(event) => setWindowWidth(
                      event.target.value === '' ? null : Math.max(Number(event.target.value), 1)
                    )}
                    placeholder={t('Auto')}
                    step='1'
                    min='1'
                  />
                  <span>HU</span>
                </div>
              </label>
            </div>

            <button
              type='button'
              className='drawer-secondary-button'
              onClick={() => {
                setWindowCenter(null);
                setWindowWidth(null);
              }}
            >
              <RotateCcw size={16} />
              {t('Reset automatic windowing')}
            </button>
          </section>
        )}

        {openSection === 'opacity' && (
          <section className='drawer-section'>
            <div className='drawer-value-readout'>
              <span>{t('Current opacity')}</span>
              <strong>{Math.round(annotationOpacity * 100)}%</strong>
            </div>
            <label className='clinical-range-field'>
              <span className='sr-only'>{t('Annotation opacity')}</span>
              <input
                type='range'
                min='0.1'
                max='1'
                step='0.05'
                value={annotationOpacity}
                onChange={(event) => setAnnotationOpacity(Number(event.target.value))}
              />
              <span className='range-labels'><small>10%</small><small>100%</small></span>
            </label>
            <div className='drawer-preset-grid'>
              {[0.25, 0.5, 0.75, 1].map((value) => (
                <button
                  key={value}
                  type='button'
                  className={annotationOpacity === value ? 'active' : ''}
                  onClick={() => setAnnotationOpacity(value)}
                >
                  {Math.round(value * 100)}%
                </button>
              ))}
            </div>
          </section>
        )}

        {openSection === 'brush' && selectedShape === 'brush' && (
          <section className='drawer-section'>
            <label className='clinical-field'>
              <span><strong>{t('Brush color')}</strong></span>
              <div className='clinical-color-field'>
                <input
                  type='color'
                  value={brushColor}
                  onChange={(event) => setBrushColor(event.target.value)}
                  aria-label={t('Brush color')}
                />
                <span className='clinical-color-swatch' style={{ backgroundColor: brushColor }} />
                <code>{brushColor.toUpperCase()}</code>
              </div>
            </label>

            <label className='clinical-range-field'>
              <span className='clinical-range-heading'>
                <strong>{t('Brush diameter')}</strong>
                <output>{brushSize}px</output>
              </span>
              <input
                type='range'
                min='1'
                max='50'
                value={brushSize}
                onChange={(event) => setBrushSize(Number(event.target.value))}
              />
              <span className='range-labels'><small>1px</small><small>50px</small></span>
            </label>

            <div className='brush-size-preview' aria-label={`${brushSize}px brush preview`}>
              <span
                style={{
                  width: `${brushSize}px`,
                  height: `${brushSize}px`,
                  backgroundColor: brushColor,
                }}
              />
            </div>

            <div className='drawer-preset-grid brush-presets'>
              {[3, 5, 10, 20, 35, 50].map((size) => (
                <button
                  key={size}
                  type='button'
                  className={brushSize === size ? 'active' : ''}
                  onClick={() => setBrushSize(size)}
                >
                  {size}px
                </button>
              ))}
            </div>
          </section>
        )}

        {openSection === 'ai' && (
          <section className='drawer-section'>
            <div className='drawer-section-heading'>
              <span>{t('Active Model')}</span>
            </div>
            <select
              value={activeAIModel || 'mock'}
              onChange={(e) => setActiveAIModel(e.target.value)}
              className='clinical-select'
              style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #475569', marginBottom: '16px' }}
            >
              <option value='mock'>Mock Inference Model</option>
              <option value='sam'>Segment Anything Model (SAM)</option>
              <option value='dino'>Grounding DINO (Text-guided)</option>
            </select>

            <div className='drawer-section-heading' style={{ marginTop: '12px' }}>
              <span>{t('Configured Prompt Modes')}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {['point', 'box', 'text'].map((type) => {
                const isEnabled = enabledAIPromptTypes.includes(type);
                return (
                  <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type='checkbox'
                      checked={isEnabled}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEnabledAIPromptTypes([...enabledAIPromptTypes, type]);
                        } else {
                          setEnabledAIPromptTypes(enabledAIPromptTypes.filter((t) => t !== type));
                        }
                      }}
                      style={{ accentColor: '#2563eb' }}
                    />
                    <span style={{ textTransform: 'capitalize' }}>{type} prompt</span>
                  </label>
                );
              })}
            </div>

            {enabledAIPromptTypes.includes('point') && (
              <>
                <div className='drawer-section-heading' style={{ marginTop: '12px' }}>
                  <span>{t('AI Click Type')}</span>
                </div>
                <div className='drawer-preset-grid' style={{ marginBottom: '16px' }}>
                  <button
                    type='button'
                    className={aiPromptIsPositive ? 'active' : ''}
                    onClick={() => setAiPromptIsPositive(true)}
                    style={{ backgroundColor: aiPromptIsPositive ? '#4caf50' : 'transparent', color: '#fff' }}
                  >
                    Positive (+)
                  </button>
                  <button
                    type='button'
                    className={!aiPromptIsPositive ? 'active' : ''}
                    onClick={() => setAiPromptIsPositive(false)}
                    style={{ backgroundColor: !aiPromptIsPositive ? '#f44336' : 'transparent', color: '#fff' }}
                  >
                    Negative (-)
                  </button>
                </div>
              </>
            )}

            {enabledAIPromptTypes.includes('text') && (
              <>
                <label className='clinical-field' style={{ marginBottom: '16px' }}>
                  <span><strong>{t('Text Prompt')}</strong></span>
                  <input
                    type='text'
                    value={aiTextPrompt || ''}
                    onChange={(e) => setAiTextPrompt(e.target.value)}
                    placeholder='e.g. lung nodule'
                    className='clinical-input'
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #475569' }}
                  />
                </label>
              </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              <button
                type='button'
                className='drawer-secondary-button'
                onClick={onRunAIInference}
                style={{ width: '100%', display: 'flex', justifyContext: 'center', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: '#2563eb', color: '#fff', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
              >
                <Wand2 size={16} />
                {t('Run AI Inference')}
              </button>

              <button
                type='button'
                className='drawer-secondary-button'
                onClick={onClearAIPrompts}
                style={{ width: '100%', display: 'flex', justifyContext: 'center', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '4px', border: '1px solid #475569', color: '#cbd5e1', cursor: 'pointer', backgroundColor: 'transparent' }}
              >
                {t('Clear AI Prompts')}
              </button>
            </div>

            <div className='drawer-section-heading' style={{ marginTop: '16px' }}>
              <span>{t('Format Conversion')}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type='button'
                className='drawer-secondary-button'
                onClick={onConvertPolygonToMask}
                style={{ width: '100%', display: 'flex', justifyContext: 'center', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '4px', border: '1px solid #475569', color: '#cbd5e1', cursor: 'pointer', backgroundColor: 'transparent' }}
              >
                {t('Convert Polygon to Mask')}
              </button>
              <button
                type='button'
                className='drawer-secondary-button'
                onClick={onConvertMaskToPolygon}
                style={{ width: '100%', display: 'flex', justifyContext: 'center', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '4px', border: '1px solid #475569', color: '#cbd5e1', cursor: 'pointer', backgroundColor: 'transparent' }}
              >
                {t('Convert Mask to Polygon')}
              </button>
              <button
                type='button'
                className='drawer-secondary-button'
                onClick={onExportDataset}
                style={{ width: '100%', display: 'flex', justifyContext: 'center', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '4px', border: 'none', color: '#fff', cursor: 'pointer', backgroundColor: '#2563eb', marginTop: '8px' }}
              >
                <Download size={16} />
                {t('Export Annotations')}
              </button>
            </div>
          </section>
        )}
      </div>
    </aside>
  );
};

export default LeftDrawer;
