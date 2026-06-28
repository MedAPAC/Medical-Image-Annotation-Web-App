import React from 'react';

const ToolbarRight = ({
  buttons_right: actionButtons,
  buttons: panelButtons,
  rightPanelOpen,
  setRightPanelOpen,
  onSave,
  selectedFileName,
  annotationRefs,
}) => (
  <aside className='annotation-right-toolbar' aria-label='Annotation actions and panels'>
    <div className='annotation-rail-section'>
      <span className='annotation-rail-label'>Actions</span>
      {actionButtons.map(({ id, color, icon: Icon, label, onClick }) => (
        <button
          key={id}
          type='button'
          onClick={() => {
            if (id === 'save') onSave();
            else if (typeof onClick === 'function') onClick(selectedFileName, annotationRefs);
          }}
          className={`annotation-action-button ${id}`}
          style={{ '--action-color': color }}
          title={label}
          data-tooltip={label}
          aria-label={label}
        >
          <span className='annotation-control-icon' aria-hidden='true'>
            <Icon size={20} strokeWidth={2.2} />
          </span>
        </button>
      ))}
    </div>

    <div className='annotation-toolbar-spacer' />
    <div className='annotation-rail-divider' />

    <div className='annotation-rail-section'>
      <span className='annotation-rail-label'>Review</span>
      {panelButtons.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type='button'
          onClick={() => setRightPanelOpen(rightPanelOpen === id ? null : id)}
          className={`annotation-panel-button ${rightPanelOpen === id ? 'active' : ''}`}
          title={label}
          data-tooltip={label}
          aria-label={label}
          aria-expanded={rightPanelOpen === id}
        >
          <span className='annotation-control-icon' aria-hidden='true'>
            <Icon size={20} strokeWidth={2} />
          </span>
        </button>
      ))}
    </div>
  </aside>
);

export default ToolbarRight;
