import React, { useRef, useState } from 'react';
import { CircleHelp, Images, Tags, X, ZoomIn, Bot } from 'lucide-react';
import ClassificationPanel from './ClassificationPanel';
import SlicesPanel from './SlicesPanel';
import ZoomPanel from './ZoomPanel';
import HelpPanel from './HelpPanel';
import AssistantPanel from './AssistantPanel';

const PANEL_META = {
  classification: {
    title: 'Classification and attributes',
    description: 'Review the current slice and record structured findings.',
    icon: Tags,
  },
  slices: {
    title: 'Slice navigation',
    description: 'Move through the active volume without leaving the viewer.',
    icon: Images,
  },
  zoom: {
    title: 'Zoom controls',
    description: 'Inspect a region at higher magnification.',
    icon: ZoomIn,
  },
  help: {
    title: 'Help and guidance',
    description: 'Quick reference for annotation and review workflows.',
    icon: CircleHelp,
  },
  assistant: {
    title: 'AI Assistant Chat',
    description: 'Ask questions about guidelines and log tickets.',
    icon: Bot,
  },
};

const RightPanel = ({
  rightPanelOpen,
  setRightPanelOpen,
  t,
  viewType,
  setViewType,
  selectedFileName,
  currentSlice,
  setCurrentSlice,
  classificationByFileAndSlice,
  setClassificationByFileAndSlice,
  inputsByFileAndSlice,
  setInputsByFileAndSlice,
  totalSlices,
  isZoomMode,
  setIsZoomMode,
  zoomLevel,
  setZoomLevel,
  zoomRegion,
  setZoomRegion,
  projectAttributes,
  aiChatMessages,
  handleSendAiChatMessage,
  handleCreateDeveloperTicket,
}) => {
  const [showSlices, setShowSlices] = useState(false);
  const slicesRef = useRef(null);
  const meta = PANEL_META[rightPanelOpen] || PANEL_META.classification;
  const PanelIcon = meta.icon;

  const getInputsForCurrent = () => (
    inputsByFileAndSlice[selectedFileName]?.[currentSlice] || {}
  );

  const updateInputsForCurrent = (updates) => {
    setInputsByFileAndSlice((previous) => ({
      ...previous,
      [selectedFileName]: {
        ...(previous[selectedFileName] || {}),
        [currentSlice]: {
          ...(previous[selectedFileName]?.[currentSlice] || {}),
          ...updates,
        },
      },
    }));
  };

  return (
    <aside
      className={`right-panel ${rightPanelOpen ? 'open' : 'closed'}`}
      aria-hidden={!rightPanelOpen}
      aria-label={t(meta.title)}
    >
      <header className='drawer-header right-drawer-header'>
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
          onClick={() => setRightPanelOpen(null)}
          aria-label={t('Close panel')}
          title={t('Close panel')}
        >
          <X size={17} />
        </button>
      </header>

      <div className='right-panel-context'>
        <span title={selectedFileName || ''}>{selectedFileName || t('No file selected')}</span>
        <strong>{t('Slice')} {currentSlice + 1} / {totalSlices || 0}</strong>
      </div>

      <div className='right-panel-content'>
        {rightPanelOpen === 'classification' && (
          <ClassificationPanel
            t={t}
            viewType={viewType}
            setViewType={setViewType}
            selectedFileName={selectedFileName}
            currentSlice={currentSlice}
            classificationByFileAndSlice={classificationByFileAndSlice}
            setClassificationByFileAndSlice={setClassificationByFileAndSlice}
            getInputsForCurrent={getInputsForCurrent}
            updateInputsForCurrent={updateInputsForCurrent}
            projectAttributes={projectAttributes}
          />
        )}

        {rightPanelOpen === 'slices' && (
          <SlicesPanel
            t={t}
            showSlices={showSlices}
            setShowSlices={setShowSlices}
            slicesRef={slicesRef}
            totalSlices={totalSlices}
            currentSlice={currentSlice}
            setCurrentSlice={setCurrentSlice}
          />
        )}

        {rightPanelOpen === 'zoom' && (
          <ZoomPanel
            t={t}
            isZoomMode={isZoomMode}
            setIsZoomMode={setIsZoomMode}
            zoomLevel={zoomLevel}
            setZoomLevel={setZoomLevel}
            zoomRegion={zoomRegion}
            setZoomRegion={setZoomRegion}
          />
        )}

        {rightPanelOpen === 'help' && <HelpPanel t={t} />}

        {rightPanelOpen === 'assistant' && (
          <AssistantPanel
            t={t}
            messages={aiChatMessages}
            onSubmitMessage={handleSendAiChatMessage}
            onCreateTicket={handleCreateDeveloperTicket}
          />
        )}
      </div>
    </aside>
  );
};

export default RightPanel;
