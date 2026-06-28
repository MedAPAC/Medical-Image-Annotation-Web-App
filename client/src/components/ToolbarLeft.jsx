import React from 'react';

const ToolbarLeft = ({
  shapes,
  allowedShapeIds = [],
  selectedShape,
  setSelectedShape,
  setToolChangeId,
  sectionIcons,
  openSection,
  setOpenSection,
}) => {
  const handleToolSelect = (name) => {
    const isSelected = selectedShape === name;
    if (isSelected) {
      setSelectedShape(null);
      if (name === 'brush' && openSection === 'brush') setOpenSection(null);
      return;
    }

    setSelectedShape(name);
    setToolChangeId((previous) => previous + 1);
    if (openSection === 'brush' && name !== 'brush') setOpenSection(null);
  };

  return (
    <aside className='annotation-left-toolbar' aria-label='Annotation tools'>
      <div className='annotation-rail-section'>
        <span className='annotation-rail-label'>Draw</span>
        <div className='annotation-tool-group'>
          {shapes.map(({ name, label, icon: Icon, shortcut }) => {
            const isAllowed = allowedShapeIds.includes(name);
            const isSelected = selectedShape === name;
            const tooltip = isAllowed
              ? `${isSelected ? 'Deselect' : 'Select'} ${label}`
              : `${label} is not configured for this project`;

            return (
              <button
                key={name}
                type='button'
                disabled={!isAllowed}
                onClick={() => isAllowed && handleToolSelect(name)}
                title={tooltip}
                data-tooltip={tooltip}
                aria-label={tooltip}
                aria-pressed={isSelected}
                className={[
                  'annotation-tool-button',
                  isSelected ? 'active' : '',
                  !isAllowed ? 'disabled' : '',
                ].filter(Boolean).join(' ')}
              >
                <span className='annotation-control-icon' aria-hidden='true'>
                  <Icon size={20} strokeWidth={2} />
                </span>
                <kbd>{shortcut}</kbd>
              </button>
            );
          })}
        </div>
      </div>

      <div className='annotation-rail-divider' />

      <div className='annotation-rail-section'>
        <span className='annotation-rail-label'>Display</span>
        {Object.entries(sectionIcons).map(([id, config]) => {
          const Icon = config.icon;
          const isDisabled = id === 'brush' && selectedShape !== 'brush';
          const tooltip = isDisabled ? 'Select the Brush tool first' : config.label;

          return (
            <button
              key={id}
              type='button'
              disabled={isDisabled}
              onClick={() => !isDisabled && setOpenSection(openSection === id ? null : id)}
              title={tooltip}
              data-tooltip={tooltip}
              aria-label={tooltip}
              aria-expanded={openSection === id}
              className={[
                'annotation-section-button',
                openSection === id ? 'active' : '',
                isDisabled ? 'disabled' : '',
              ].filter(Boolean).join(' ')}
            >
              <span className='annotation-control-icon' aria-hidden='true'>
                <Icon size={20} strokeWidth={2} />
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default ToolbarLeft;
