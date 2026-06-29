export const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:5000')
).replace(/\/$/, '');

export const apiUrl = (path) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export const taskFileContentUrl = (taskId, fileId, download = false) => {
  const base = apiUrl(
    `/api/tasks/${encodeURIComponent(taskId)}/files/${encodeURIComponent(fileId)}/content`
  );
  return download ? `${base}?download=1` : base;
};
