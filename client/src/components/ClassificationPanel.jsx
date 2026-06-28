import React from 'react';
import { CheckCircle2, CircleOff, XCircle } from 'lucide-react';

const splitAttributeOptions = (values) => {
  if (Array.isArray(values)) {
    return values.map((option) => String(option).trim()).filter(Boolean);
  }
  return values
    ? String(values).split(/[\n,]/).map((option) => option.trim()).filter(Boolean)
    : [];
};

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
  projectAttributes = [],
}) => {
  const inputs = getInputsForCurrent() || {};
  const currentClassification = (
    classificationByFileAndSlice[selectedFileName]?.[currentSlice] || null
  );

  const setClassification = (classification) => {
    if (classification === 'clear') {
      setClassificationByFileAndSlice((previous) => {
        const updated = { ...(previous[selectedFileName] || {}) };
        delete updated[currentSlice];
        return { ...previous, [selectedFileName]: updated };
      });
      return;
    }

    setClassificationByFileAndSlice((previous) => ({
      ...previous,
      [selectedFileName]: {
        ...(previous[selectedFileName] || {}),
        [currentSlice]: classification,
      },
    }));
  };

  const renderAttribute = (attribute) => {
    const value = inputs[attribute.name];
    const options = splitAttributeOptions(attribute.values);
    const key = attribute.id || attribute.name;

    if (attribute.type === 'checkbox') {
      if (options.length > 0) {
        const selection = Array.isArray(value) ? value : [];
        return (
          <fieldset key={key} className='annotation-attribute-field'>
            <legend className='annotation-attribute-label'>{attribute.name}</legend>
            <div className='annotation-option-grid'>
              {options.map((option) => (
                <label key={option} className='annotation-option'>
                  <input
                    type='checkbox'
                    checked={selection.includes(option)}
                    onChange={(event) => {
                      const nextSelection = event.target.checked
                        ? [...selection, option]
                        : selection.filter((item) => item !== option);
                      updateInputsForCurrent({ [attribute.name]: nextSelection });
                    }}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>
        );
      }

      return (
        <label key={key} className='annotation-option annotation-option-boolean'>
          <input
            type='checkbox'
            checked={Boolean(value)}
            onChange={(event) => updateInputsForCurrent({
              [attribute.name]: event.target.checked,
            })}
          />
          <span>{attribute.name}</span>
        </label>
      );
    }

    if (attribute.type === 'select') {
      return (
        <label key={key} className='annotation-attribute-field'>
          <span className='annotation-attribute-label'>{attribute.name}</span>
          <select
            value={value ?? ''}
            onChange={(event) => updateInputsForCurrent({
              [attribute.name]: event.target.value,
            })}
            className='annotation-panel-input'
          >
            <option value=''>{t('Choose...')}</option>
            {options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      );
    }

    if (attribute.type === 'radio') {
      return (
        <fieldset key={key} className='annotation-attribute-field'>
          <legend className='annotation-attribute-label'>{attribute.name}</legend>
          <div className='annotation-option-grid'>
            {options.map((option) => (
              <label key={option} className='annotation-option'>
                <input
                  type='radio'
                  name={`radio-group-${key}`}
                  value={option}
                  checked={value === option}
                  onChange={(event) => updateInputsForCurrent({
                    [attribute.name]: event.target.value,
                  })}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </fieldset>
      );
    }

    return (
      <label key={key} className='annotation-attribute-field'>
        <span className='annotation-attribute-label'>{attribute.name}</span>
        <input
          type={attribute.type === 'number' ? 'number' : 'text'}
          value={value ?? ''}
          onChange={(event) => updateInputsForCurrent({
            [attribute.name]: event.target.value,
          })}
          className='annotation-panel-input'
        />
      </label>
    );
  };

  const classifications = [
    { id: 'positive', label: 'Positive', icon: CheckCircle2 },
    { id: 'negative', label: 'Negative', icon: XCircle },
    { id: 'clear', label: 'Unclassified', icon: CircleOff },
  ];

  return (
    <div className='classification-panel'>
      <section className='annotation-panel-card'>
        <div className='annotation-panel-card-header'>
          <h4>{t('View plane')}</h4>
        </div>
        <div className='annotation-segmented-control' role='group' aria-label={t('View plane')}>
          {['axial', 'coronal', 'sagittal'].map((view) => (
            <button
              key={view}
              type='button'
              onClick={() => setViewType(view)}
              className={viewType === view ? 'active' : ''}
              aria-pressed={viewType === view}
            >
              {t(view.charAt(0).toUpperCase() + view.slice(1))}
            </button>
          ))}
        </div>
      </section>

      <section className='annotation-panel-card'>
        <div className='annotation-panel-card-header'>
          <h4>{t('Slice classification')}</h4>
          <span>{t('Slice')} {currentSlice + 1}</span>
        </div>
        <div className='classification-actions'>
          {classifications.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type='button'
              onClick={() => setClassification(id)}
              className={[
                'classification-action',
                id,
                currentClassification === id || (id === 'clear' && !currentClassification)
                  ? 'active'
                  : '',
              ].filter(Boolean).join(' ')}
              aria-pressed={currentClassification === id || (id === 'clear' && !currentClassification)}
            >
              <Icon size={16} />
              {t(label)}
            </button>
          ))}
        </div>
      </section>

      <section className='annotation-panel-card'>
        <div className='annotation-panel-card-header'>
          <h4>{t('Structured attributes')}</h4>
          <span>{projectAttributes.length}</span>
        </div>
        <div className='annotation-attribute-list'>
          {projectAttributes.length === 0
            ? <p className='annotation-empty-note'>{t('No attributes configured')}</p>
            : projectAttributes.map(renderAttribute)}
        </div>
      </section>
    </div>
  );
};

export default ClassificationPanel;
