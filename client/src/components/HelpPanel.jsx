import React from 'react';
import { Edit3, Files, MousePointer2, Save, ScanLine, Users, ZoomIn } from 'lucide-react';

const HelpPanel = ({ t }) => {
  const guidance = [
    {
      title: 'Draw an annotation',
      icon: Edit3,
      body: 'Choose a geometry, confirm the active label, and draw on the image. Press Enter to finish polygons and polylines.',
      keys: ['Enter'],
    },
    {
      title: 'Refine geometry',
      icon: MousePointer2,
      body: 'Deselect the drawing tool to enter selection mode. Drag vertex handles to refine a polygon or polyline.',
      keys: ['Delete', 'Backspace'],
    },
    {
      title: 'Move through a volume',
      icon: ScanLine,
      body: 'Use the slice panel, range control, or keyboard arrows. The current canvas is retained when the slice changes.',
      keys: ['Left arrow', 'Right arrow'],
    },
    {
      title: 'Change files safely',
      icon: Files,
      body: 'Use the study selector in the task strip. DICOM instances are grouped as one series; NIfTI volumes remain separate.',
    },
    {
      title: 'Inspect fine detail',
      icon: ZoomIn,
      body: 'Open Zoom, select region mode, and drag over the anatomy. Drawing pauses until the zoom region is complete.',
    },
    {
      title: 'Save and collaborate',
      icon: Save,
      body: 'Save commits geometry, classification, and attributes. Unsaved changes are protected before navigation or reload.',
    },
    {
      title: 'Concurrent review',
      icon: Users,
      body: 'Remote saves refresh clean files automatically. Local unsaved work is never silently replaced by a collaborator update.',
    },
  ];

  return (
    <div className='help-guide'>
      {guidance.map(({ title, icon: Icon, body, keys }) => (
        <article className='help-card' key={title}>
          <span className='help-card-icon'><Icon size={17} /></span>
          <div>
            <h4>{t(title)}</h4>
            <p>{t(body)}</p>
            {keys?.length > 0 && (
              <div className='help-shortcuts'>
                {keys.map((key) => <kbd key={key}>{t(key)}</kbd>)}
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
};

export default HelpPanel;
