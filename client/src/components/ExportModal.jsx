import React, { useState } from 'react';
import axios from 'axios';

export default function ExportModal({ isOpen, onClose, projectId, taskId, labelOptions = [] }) {
  const [format, setFormat] = useState('YOLO');
  const [includeImages, setIncludeImages] = useState(false);
  const [syncToDrive, setSyncToDrive] = useState(false);
  const [customTemplate, setCustomTemplate] = useState('{{filename}},{{label}},{{x_min}},{{y_min}},{{x_max}},{{y_max}}');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLabels, setSelectedLabels] = useState(labelOptions.map(l => l.name || l.value));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleLabelToggle = (labelName) => {
    setSelectedLabels(prev =>
      prev.includes(labelName)
        ? prev.filter(l => l !== labelName)
        : [...prev, labelName]
    );
  };

  const handleExport = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        projectId,
        taskId,
        format,
        includeImages,
        syncToDrive,
        customTemplate: format === 'CUSTOM' ? customTemplate : undefined,
        filters: {
          status: statusFilter || undefined,
          labels: selectedLabels.length === labelOptions.length ? undefined : selectedLabels
        }
      };

      if (syncToDrive) {
        const response = await axios.post('/api/export/dataset', payload, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setSuccessMsg(response.data.message || 'Export synced to Google Drive!');
      } else {
        const response = await axios.post('/api/export/dataset', payload, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          responseType: 'blob'
        });

        // Trigger browser file download
        const blob = new Blob([response.data], { type: 'application/zip' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${taskId ? 'task' : 'project'}-export-${Date.now()}.zip`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        setSuccessMsg('Download initiated successfully!');
      }
    } catch (err) {
      console.error('Failed to export dataset:', err);
      const errData = err.response?.data;
      setError(errData?.error || 'Failed to generate dataset export. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Inline CSS Styles for robust rendering without Tailwind
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    padding: '16px',
    boxSizing: 'border-box'
  };

  const modalStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    border: '1px solid #cbd5e1',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    boxSizing: 'border-box'
  };

  const headerStyle = {
    padding: '16px 24px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxSizing: 'border-box'
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0
  };

  const closeButtonStyle = {
    color: '#94a3b8',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '24px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '4px',
    lineHeight: 1
  };

  const bodyStyle = {
    padding: '24px',
    overflowY: 'auto',
    maxHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    fontSize: '14px',
    color: '#475569',
    boxSizing: 'border-box'
  };

  const alertStyle = (isError) => ({
    padding: '12px',
    borderRadius: '8px',
    fontSize: '12px',
    border: '1px solid',
    backgroundColor: isError ? '#fef2f2' : '#f0fdf4',
    borderColor: isError ? '#fee2e2' : '#dcfce7',
    color: isError ? '#b91c1c' : '#15803d'
  });

  const formGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  };

  const labelStyle = {
    fontWeight: '600',
    color: '#334155'
  };

  const inputStyle = {
    padding: '10px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    fontSize: '14px',
    color: '#1e293b',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const toggleRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #f1f5f9',
    boxSizing: 'border-box'
  };

  const toggleLabelStyle = {
    fontWeight: '600',
    color: '#1e293b',
    cursor: 'pointer'
  };

  const toggleSubStyle = {
    fontSize: '11px',
    color: '#94a3b8'
  };

  const filterHeadingStyle = {
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginTop: '8px',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '16px',
    margin: '10px 0 4px 0'
  };

  const pillButtonStyle = (isActive) => ({
    padding: '6px 12px',
    borderRadius: '9999px',
    fontSize: '12px',
    border: '1px solid',
    cursor: 'pointer',
    backgroundColor: isActive ? '#eff6ff' : '#f8fafc',
    borderColor: isActive ? '#bfdbfe' : '#e2e8f0',
    color: isActive ? '#1d4ed8' : '#64748b',
    fontWeight: isActive ? '600' : '400',
    transition: 'all 0.2s'
  });

  const footerStyle = {
    padding: '16px 24px',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '12px',
    boxSizing: 'border-box'
  };

  const primaryButtonStyle = {
    padding: '10px 18px',
    backgroundColor: loading ? '#93c5fd' : '#2563eb',
    color: '#ffffff',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    cursor: loading ? 'default' : 'pointer',
    fontSize: '13px',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const secondaryButtonStyle = {
    padding: '10px 18px',
    backgroundColor: 'transparent',
    color: '#475569',
    fontWeight: '500',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px'
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={titleStyle}>Export Dataset</h2>
          <button 
            onClick={onClose}
            style={closeButtonStyle}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          {error && (
            <div style={alertStyle(true)}>
              {error}
            </div>
          )}
          {successMsg && (
            <div style={alertStyle(false)}>
              {successMsg}
            </div>
          )}

          {/* Format Selection */}
          <div style={formGroupStyle}>
            <label htmlFor="exportFormat" style={labelStyle}>Export Format</label>
            <select
              id="exportFormat"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              style={inputStyle}
            >
              <option value="YOLO">YOLO (classes.txt + normalizations)</option>
              <option value="COCO">COCO (JSON categories + annotations)</option>
              <option value="Pascal VOC">Pascal VOC (XML bounded boxes)</option>
              <option value="CUSTOM">Custom Structured Template</option>
            </select>
          </div>

          {/* Custom Template Input */}
          <div style={{
            ...formGroupStyle,
            opacity: format !== 'CUSTOM' ? 0.4 : 1,
            transition: 'opacity 0.2s'
          }}>
            <label htmlFor="customTemplate" style={labelStyle}>Custom Template String</label>
            <textarea
              id="customTemplate"
              value={customTemplate}
              onChange={(e) => setCustomTemplate(e.target.value)}
              placeholder="e.g. {{filename}},{{label}},{{x_min}},{{y_min}},{{x_max}},{{y_max}}"
              rows={2}
              disabled={format !== 'CUSTOM'}
              style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px' }}
            />
            <span style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.3 }}>
              Available placeholders: {"{{filename}}"}, {"{{label}}"}, {"{{x_min}}"}, {"{{y_min}}"}, {"{{x_max}}"}, {"{{y_max}}"}, {"{{width}}"}, {"{{height}}"}, {"{{image_width}}"}, {"{{image_height}}"}
            </span>
          </div>

          {/* Include Images */}
          <div style={toggleRowStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <label htmlFor="includeImages" style={toggleLabelStyle}>Include Raw Medical Images</label>
              <span style={toggleSubStyle}>Include source files (DICOM, NIfTI, PNG) in ZIP package</span>
            </div>
            <input
              id="includeImages"
              type="checkbox"
              checked={includeImages}
              onChange={(e) => setIncludeImages(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
          </div>

          {/* Sync to Drive */}
          <div style={toggleRowStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <label htmlFor="syncToDrive" style={toggleLabelStyle}>Sync Export to Google Drive</label>
              <span style={toggleSubStyle}>Save directly to project exports folder on Google Drive</span>
            </div>
            <input
              id="syncToDrive"
              type="checkbox"
              checked={syncToDrive}
              onChange={(e) => setSyncToDrive(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
          </div>

          {/* Filters Section */}
          <div>
            <h3 style={filterHeadingStyle}>Filters</h3>
            
            {/* Status Filter */}
            <div style={{ ...formGroupStyle, marginTop: '8px' }}>
              <label htmlFor="statusFilter" style={{ ...labelStyle, fontSize: '13px' }}>Filter by Task Status</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ ...inputStyle, padding: '8px 10px', fontSize: '12px' }}
              >
                <option value="">All Tasks</option>
                <option value="completed">Completed only</option>
                <option value="in_progress">In Progress only</option>
              </select>
            </div>

            {/* Labels Filter */}
            {labelOptions.length > 0 && (
              <div style={{ ...formGroupStyle, marginTop: '12px' }}>
                <span style={{ ...labelStyle, fontSize: '13px' }}>Filter by Annotation Labels</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  {labelOptions.map(opt => {
                    const labelName = opt.name || opt.value;
                    const isChecked = selectedLabels.includes(labelName);
                    return (
                      <button
                        key={opt.id || opt.value}
                        type="button"
                        onClick={() => handleLabelToggle(labelName)}
                        style={pillButtonStyle(isChecked)}
                      >
                        {labelName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <button
            onClick={onClose}
            style={secondaryButtonStyle}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            style={primaryButtonStyle}
          >
            {loading ? 'Exporting...' : 'Export Now'}
          </button>
        </div>

      </div>
    </div>
  );
}
