import React from 'react';
import { AlertTriangle, LogOut, Save, X } from 'lucide-react';

const UnsavedChangesModal = ({
  open,
  t,
  onSaveAndLeave,
  onLeaveWithoutSaving,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      className='unsaved-modal-backdrop'
      role='presentation'
      onClick={onCancel}
    >
      <section
        className='unsaved-modal'
        role='dialog'
        aria-modal='true'
        aria-labelledby='unsaved-modal-title'
        onClick={(event) => event.stopPropagation()}
      >
        <header className='unsaved-modal-header'>
          <span className='unsaved-modal-icon' aria-hidden='true'>
            <AlertTriangle size={20} />
          </span>
          <div>
            <h2 id='unsaved-modal-title'>{t('Unsaved changes')}</h2>
            <p>{t('Your current annotations, classifications, or attributes have not been saved.')}</p>
          </div>
          <button type='button' onClick={onCancel} aria-label={t('Close')} title={t('Close')}>
            <X size={17} />
          </button>
        </header>

        <div className='unsaved-modal-body'>
          <p>{t('Save before leaving to keep this work, or leave without saving to discard it.')}</p>
        </div>

        <footer className='unsaved-modal-actions'>
          <button type='button' className='unsaved-cancel-button' onClick={onCancel}>
            {t('Continue annotating')}
          </button>
          <button type='button' className='unsaved-discard-button' onClick={onLeaveWithoutSaving}>
            <LogOut size={16} />
            {t('Leave without saving')}
          </button>
          <button type='button' className='unsaved-save-button' onClick={onSaveAndLeave}>
            <Save size={16} />
            {t('Save and leave')}
          </button>
        </footer>
      </section>
    </div>
  );
};

export default UnsavedChangesModal;
