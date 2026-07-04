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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Export Dataset</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-medium"
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-5 text-sm text-gray-700">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-xs">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg border border-green-100 text-xs">
              {successMsg}
            </div>
          )}

          {/* Format Selection */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="exportFormat" className="font-semibold text-gray-700">Export Format</label>
            <select
              id="exportFormat"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="YOLO">YOLO (classes.txt + normalizations)</option>
              <option value="COCO">COCO (JSON categories + annotations)</option>
              <option value="Pascal VOC">Pascal VOC (XML bounded boxes)</option>
              <option value="CUSTOM">Custom Structured Template</option>
            </select>
          </div>

          {/* Custom Template Input */}
          <div className={`flex flex-col gap-1.5 transition-all duration-200 ${format !== 'CUSTOM' ? 'opacity-40' : ''}`}>
            <label htmlFor="customTemplate" className="font-semibold text-gray-700">Custom Template String</label>
            <textarea
              id="customTemplate"
              value={customTemplate}
              onChange={(e) => setCustomTemplate(e.target.value)}
              placeholder="e.g. {{filename}},{{label}},{{x_min}},{{y_min}},{{x_max}},{{y_max}}"
              rows={2}
              disabled={format !== 'CUSTOM'}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-xs"
            />
            <span className="text-[10px] text-gray-400 leading-tight">
              Available placeholders: {"{{filename}}"}, {"{{label}}"}, {"{{x_min}}"}, {"{{y_min}}"}, {"{{x_max}}"}, {"{{y_max}}"}, {"{{width}}"}, {"{{height}}"}, {"{{image_width}}"}, {"{{image_height}}"}
            </span>
          </div>

          {/* Include Images */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100/50 transition-colors">
            <div className="flex flex-col gap-0.5">
              <label htmlFor="includeImages" className="font-semibold text-gray-800 cursor-pointer">Include Raw Medical Images</label>
              <span className="text-[11px] text-gray-400">Include source files (DICOM, NIfTI, PNG) in ZIP package</span>
            </div>
            <input
              id="includeImages"
              type="checkbox"
              checked={includeImages}
              onChange={(e) => setIncludeImages(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
          </div>

          {/* Sync to Drive */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100/50 transition-colors">
            <div className="flex flex-col gap-0.5">
              <label htmlFor="syncToDrive" className="font-semibold text-gray-800 cursor-pointer">Sync Export to Google Drive</label>
              <span className="text-[11px] text-gray-400">Save directly to project exports folder on Google Drive</span>
            </div>
            <input
              id="syncToDrive"
              type="checkbox"
              checked={syncToDrive}
              onChange={(e) => setSyncToDrive(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
          </div>

          {/* Filters Section */}
          <div className="border-t border-gray-100 pt-4 space-y-4">
            <h3 className="font-semibold text-gray-800 text-xs uppercase tracking-wider">Filters</h3>
            
            {/* Status Filter */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="statusFilter" className="font-medium text-gray-700">Filter by Task Status</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs"
              >
                <option value="">All Tasks</option>
                <option value="completed">Completed only</option>
                <option value="in_progress">In Progress only</option>
              </select>
            </div>

            {/* Labels Filter */}
            {labelOptions.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="font-medium text-gray-700">Filter by Annotation Labels</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {labelOptions.map(opt => {
                    const labelName = opt.name || opt.value;
                    const isChecked = selectedLabels.includes(labelName);
                    return (
                      <button
                        key={opt.id || opt.value}
                        type="button"
                        onClick={() => handleLabelToggle(labelName)}
                        className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                          isChecked 
                            ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' 
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
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
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 font-medium rounded-lg transition-all text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all text-xs disabled:bg-blue-400 cursor-pointer"
          >
            {loading ? 'Exporting...' : 'Export Now'}
          </button>
        </div>

      </div>
    </div>
  );
}
