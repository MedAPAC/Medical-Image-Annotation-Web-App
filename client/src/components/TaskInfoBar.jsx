import React from 'react';
import { Activity, ChevronDown, Files, ListChecks } from 'lucide-react';

const TaskInfoBar = ({ taskData, files, selectedFileName, onFileSelect }) => {
  const progress = Math.min(Math.max(Number(taskData?.progress) || 0, 0), 100);
  const status = String(taskData?.status || 'pending').toLowerCase();
  const statusLabel = status.replace(/_/g, ' ');

  return (
    <div className='task-info-bar'>
      <div className='task-info-identity'>
        <span className='task-info-icon' aria-hidden='true'>
          <ListChecks size={18} />
        </span>
        <div className='task-info-copy'>
          <span className='task-info-label'>Current task</span>
          <strong title={taskData?.name || 'Untitled task'}>
            {taskData?.name || 'Untitled task'}
          </strong>
        </div>
        <span className={`task-status-badge ${status}`}>
          <Activity size={12} />
          {statusLabel}
        </span>
      </div>

      {files?.length > 0 && (
        <label className='task-file-selector'>
          <span className='task-info-icon subtle' aria-hidden='true'>
            <Files size={17} />
          </span>
          <span className='task-file-label'>Study / series</span>
          <span className='task-file-select-wrap'>
            <select
              value={selectedFileName || ''}
              onChange={(event) => onFileSelect(event.target.value)}
              className='task-file-select'
              aria-label='Select medical image file or series'
            >
              {files.map((file, index) => (
                <option
                  key={`${file.annotationKey || file.filename || file.originalName}-${index}`}
                  value={file.annotationKey || file.originalName}
                >
                  {file.displayName || file.originalName}
                </option>
              ))}
            </select>
            <ChevronDown size={15} className='task-file-chevron' />
          </span>
        </label>
      )}

      <div className='task-progress-summary'>
        <div className='task-progress-copy'>
          <span className='task-info-label'>Task progress</span>
          <strong>{progress}%</strong>
          <span>{taskData?.completedItems || 0} of {taskData?.totalItems || 0}</span>
        </div>
        <div
          className='task-progress-track'
          role='progressbar'
          aria-valuemin='0'
          aria-valuemax='100'
          aria-valuenow={progress}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};

export default TaskInfoBar;
