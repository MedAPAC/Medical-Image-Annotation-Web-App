import React from 'react';
import { CheckCircle2, File, FolderUp, UploadCloud } from 'lucide-react';

const FileUploadSection = ({
  files,
  uploadProgress,
  uploadMode,
  setUploadMode,
  handleDrop,
  handleFileChange,
  handleUpload,
}) => (
  <main className='annotation-empty-workspace'>
    <section className='annotation-upload-panel'>
      <div className='annotation-upload-heading'>
        <span className='annotation-upload-icon' aria-hidden='true'>
          <FolderUp size={24} />
        </span>
        <div>
          <h1>Add imaging data</h1>
          <p>This task has no studies yet. Upload a DICOM series or NIfTI volume to begin.</p>
        </div>
      </div>

      <div className='annotation-upload-mode' role='group' aria-label='Medical image format'>
        {[
          { value: 'nifti', label: 'NIfTI volume', detail: '.nii, .nii.gz' },
          { value: 'dicom', label: 'DICOM series', detail: '.dcm files' },
        ].map((option) => (
          <button
            key={option.value}
            type='button'
            className={uploadMode === option.value ? 'active' : ''}
            onClick={() => setUploadMode(option.value)}
            aria-pressed={uploadMode === option.value}
          >
            <strong>{option.label}</strong>
            <span>{option.detail}</span>
          </button>
        ))}
      </div>

      <label
        className='annotation-drop-zone'
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        htmlFor='annotation-file-upload'
      >
        <UploadCloud size={32} aria-hidden='true' />
        <strong>Drop medical images here</strong>
        <span>or select files from this workstation</span>
        <span className='annotation-browse-button'>Browse files</span>
        <input
          type='file'
          id='annotation-file-upload'
          multiple
          onChange={handleFileChange}
        />
      </label>

      {files.length > 0 && (
        <div className='annotation-upload-queue'>
          <div className='annotation-upload-queue-header'>
            <strong>Upload queue</strong>
            <span>{files.length} file{files.length === 1 ? '' : 's'}</span>
          </div>
          <ul>
            {files.map((file, index) => {
              const progress = uploadProgress[file.name];
              return (
                <li key={`${file.name}-${index}`}>
                  <File size={17} aria-hidden='true' />
                  <span className='annotation-upload-file-name'>{file.name}</span>
                  <span className='annotation-upload-file-state'>
                    {progress === 100 ? <CheckCircle2 size={16} /> : null}
                    {progress ? `${progress}%` : 'Ready'}
                  </span>
                </li>
              );
            })}
          </ul>
          <button
            type='button'
            className='annotation-upload-submit'
            onClick={handleUpload}
          >
            <UploadCloud size={17} />
            Upload and open viewer
          </button>
        </div>
      )}
    </section>
  </main>
);

export default FileUploadSection;
