const fs = require("fs");
const path = require("path");

const { readSecret } = require('../config/secrets');

const createGoogleDriveService = ({ collections, ObjectId, port, makeRequestError, tokenCipher }) => {
const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email'
];

const GOOGLE_DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const GOOGLE_DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

const getGoogleDriveConfig = () => ({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: readSecret('GOOGLE_CLIENT_SECRET'),
  redirectUri: process.env.GOOGLE_REDIRECT_URI || `http://localhost:${port}/api/integrations/google-drive/callback`
});

const isGoogleDriveConfigured = () => {
  const config = getGoogleDriveConfig();
  return Boolean(config.clientId && config.clientSecret && config.redirectUri);
};

const sanitizeDriveName = (value, fallback = 'untitled') => {
  const cleaned = String(value || fallback)
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || fallback;
};

const extractDriveFolderId = (input) => {
  if (!input) return '';
  const value = String(input).trim();
  const folderMatch = value.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return folderMatch[1];
  const idParamMatch = value.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch) return idParamMatch[1];
  return value;
};

const makeDriveError = async (response, fallbackMessage = 'Google Drive request failed') => {
  const text = await response.text().catch(() => '');
  let message = fallbackMessage;
  try {
    const parsed = JSON.parse(text);
    message = parsed.error?.message || parsed.error_description || message;
  } catch {
    if (text) message = text;
  }

  return makeRequestError(message, response.status || 500);
};

const parseGoogleJsonResponse = async (response) => {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
};

const getStoredGoogleDriveConnection = async (userId) => {
  if (!collections.googleDriveConnectionsCollection) return null;
  const connection = await collections.googleDriveConnectionsCollection.findOne({ userId: String(userId) });
  if (!connection) return null;
  return {
    ...connection,
    accessToken: tokenCipher.decrypt(connection.accessToken),
    refreshToken: tokenCipher.decrypt(connection.refreshToken),
  };
};

const refreshGoogleAccessToken = async (connection) => {
  if (!connection?.refreshToken) {
    throw makeRequestError('Google Drive is not connected for this user.', 400);
  }

  if (!isGoogleDriveConfigured()) {
    throw makeRequestError('Google Drive is not configured on the server.', 500);
  }

  const config = getGoogleDriveConfig();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: connection.refreshToken,
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) {
    throw await makeDriveError(response, 'Failed to refresh Google Drive access.');
  }

  const tokenData = await parseGoogleJsonResponse(response);
  const expiresAt = new Date(Date.now() + Math.max((tokenData.expires_in || 3600) - 60, 60) * 1000);

  await collections.googleDriveConnectionsCollection.updateOne(
    { userId: connection.userId },
    {
      $set: {
        accessToken: tokenCipher.encrypt(tokenData.access_token),
        expiresAt,
        updatedAt: new Date()
      }
    }
  );

  return tokenData.access_token;
};

const getGoogleAccessToken = async (userId) => {
  const connection = await getStoredGoogleDriveConnection(userId);
  if (!connection) {
    throw makeRequestError('Google Drive is not connected for this user.', 400);
  }

  const expiresAt = connection.expiresAt ? new Date(connection.expiresAt).getTime() : 0;
  if (connection.accessToken && expiresAt > Date.now() + 60000) {
    return connection.accessToken;
  }

  return refreshGoogleAccessToken(connection);
};

const googleDriveRawFetch = async (userId, url, options = {}, retry = true) => {
  const accessToken = await getGoogleAccessToken(userId);
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${accessToken}`
  };

  const fetchOptions = {
    ...options,
    headers
  };

  if (options.body) {
    fetchOptions.duplex = 'half';
  }

  const response = await fetch(url, fetchOptions);
  if (response.status === 401 && retry) {
    const connection = await getStoredGoogleDriveConnection(userId);
    await refreshGoogleAccessToken(connection);
    return googleDriveRawFetch(userId, url, options, false);
  }

  return response;
};

const googleDriveJsonFetch = async (userId, url, options = {}, fallbackMessage) => {
  const response = await googleDriveRawFetch(userId, url, options);
  if (!response.ok) {
    throw await makeDriveError(response, fallbackMessage);
  }
  return parseGoogleJsonResponse(response);
};

const googleDriveCreateFolder = async (userId, { name, parentId }) => {
  const metadata = {
    name: sanitizeDriveName(name, 'folder'),
    mimeType: 'application/vnd.google-apps.folder'
  };

  if (parentId) {
    metadata.parents = [parentId];
  }

  return googleDriveJsonFetch(
    userId,
    `${GOOGLE_DRIVE_API_BASE}/files?fields=id,name,webViewLink`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify(metadata)
    },
    'Failed to create Google Drive folder.'
  );
};

const googleDriveGetFile = async (userId, fileId, fields = 'id,name,mimeType,webViewLink') => {
  return googleDriveJsonFetch(
    userId,
    `${GOOGLE_DRIVE_API_BASE}/files/${encodeURIComponent(fileId)}?fields=${encodeURIComponent(fields)}&supportsAllDrives=true`,
    { method: 'GET' },
    'Failed to read Google Drive file metadata.'
  );
};

const escapeDriveQueryValue = (value) => String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const googleDriveFindChildByName = async (userId, parentId, name, mimeType) => {
  const clauses = [
    `'${escapeDriveQueryValue(parentId)}' in parents`,
    `name = '${escapeDriveQueryValue(name)}'`,
    'trashed = false'
  ];

  if (mimeType) {
    clauses.push(`mimeType = '${escapeDriveQueryValue(mimeType)}'`);
  }

  const params = new URLSearchParams({
    q: clauses.join(' and '),
    fields: 'files(id,name,mimeType,webViewLink)',
    pageSize: '1',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true'
  });

  const result = await googleDriveJsonFetch(
    userId,
    `${GOOGLE_DRIVE_API_BASE}/files?${params.toString()}`,
    { method: 'GET' },
    'Failed to search Google Drive folder.'
  );

  return result.files?.[0] || null;
};

const ensureDriveChildFolder = async (userId, parentId, name) => {
  const safeName = sanitizeDriveName(name, 'folder');
  const existingFolder = await googleDriveFindChildByName(
    userId,
    parentId,
    safeName,
    'application/vnd.google-apps.folder'
  );

  if (existingFolder) return existingFolder;
  return googleDriveCreateFolder(userId, { name: safeName, parentId });
};

const startGoogleResumableUpload = async (userId, { fileId, name, parentId, mimeType, size }) => {
  const metadata = { name: sanitizeDriveName(name, 'backup-file') };
  if (!fileId && parentId) {
    metadata.parents = [parentId];
  }

  const method = fileId ? 'PATCH' : 'POST';
  const endpoint = fileId
    ? `${GOOGLE_DRIVE_UPLOAD_BASE}/files/${encodeURIComponent(fileId)}?uploadType=resumable&fields=id,name,webViewLink`
    : `${GOOGLE_DRIVE_UPLOAD_BASE}/files?uploadType=resumable&fields=id,name,webViewLink`;

  const response = await googleDriveRawFetch(userId, endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': String(size)
    },
    body: JSON.stringify(metadata)
  });

  if (!response.ok) {
    throw await makeDriveError(response, 'Failed to start Google Drive upload.');
  }

  const sessionUrl = response.headers.get('location');
  if (!sessionUrl) {
    throw makeRequestError('Google Drive did not return an upload session URL.', 502);
  }

  return sessionUrl;
};

const uploadContentToDrive = async (userId, { fileId, parentId, name, mimeType, content }) => {
  const body = Buffer.isBuffer(content) ? content : Buffer.from(String(content));
  const sessionUrl = await startGoogleResumableUpload(userId, {
    fileId,
    parentId,
    name,
    mimeType,
    size: body.length
  });

  const response = await googleDriveRawFetch(userId, sessionUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType,
      'Content-Length': String(body.length)
    },
    body
  });

  if (!response.ok) {
    throw await makeDriveError(response, 'Failed to upload content to Google Drive.');
  }

  return parseGoogleJsonResponse(response);
};

const uploadFilePathToDrive = async (userId, { fileId, parentId, name, mimeType, filePath }) => {
  const stats = await fs.promises.stat(filePath);
  const sessionUrl = await startGoogleResumableUpload(userId, {
    fileId,
    parentId,
    name,
    mimeType,
    size: stats.size
  });

  const response = await googleDriveRawFetch(userId, sessionUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType || 'application/octet-stream',
      'Content-Length': String(stats.size)
    },
    body: fs.createReadStream(filePath)
  });

  if (!response.ok) {
    throw await makeDriveError(response, 'Failed to upload file to Google Drive.');
  }

  return parseGoogleJsonResponse(response);
};

const upsertJsonFileInDrive = async (userId, parentId, name, payload) => {
  const safeName = sanitizeDriveName(name, 'export.json');
  const existingFile = await googleDriveFindChildByName(userId, parentId, safeName, 'application/json');
  return uploadContentToDrive(userId, {
    fileId: existingFile?.id,
    parentId,
    name: safeName,
    mimeType: 'application/json',
    content: JSON.stringify(payload, null, 2)
  });
};

const getDriveBackupActorId = (project) => String(project?.driveBackup?.connectedBy || project?.userId || '');

const ensureProjectDriveBackupFolders = async (project) => {
  if (!project?.driveBackup?.enabled || !project.driveBackup.folderId) {
    return null;
  }

  const connectedBy = getDriveBackupActorId(project);
  if (!connectedBy) {
    throw makeRequestError('Project Drive backup does not have a connected owner.', 400);
  }

  const currentSubfolders = project.driveBackup.subfolders || {};
  const nextSubfolders = { ...currentSubfolders };

  const filesFolder = currentSubfolders.files
    ? { id: currentSubfolders.files }
    : await ensureDriveChildFolder(connectedBy, project.driveBackup.folderId, 'files');
  nextSubfolders.files = filesFolder.id;

  const annotationsFolder = currentSubfolders.annotations
    ? { id: currentSubfolders.annotations }
    : await ensureDriveChildFolder(connectedBy, project.driveBackup.folderId, 'annotations');
  nextSubfolders.annotations = annotationsFolder.id;

  const exportsFolder = currentSubfolders.exports
    ? { id: currentSubfolders.exports }
    : await ensureDriveChildFolder(connectedBy, project.driveBackup.folderId, 'exports');
  nextSubfolders.exports = exportsFolder.id;

  const changed = Object.keys(nextSubfolders).some(
    key => nextSubfolders[key] !== currentSubfolders[key]
  );

  if (changed) {
    await collections.projectsCollection.updateOne(
      { _id: project._id },
      {
        $set: {
          'driveBackup.subfolders': nextSubfolders,
          'driveBackup.updatedAt': new Date()
        }
      }
    );
  }

  return {
    ...project.driveBackup,
    subfolders: nextSubfolders
  };
};

const isDriveBackupEnabled = (project) => Boolean(
  project?.driveBackup?.enabled &&
  project.driveBackup.folderId &&
  getDriveBackupActorId(project)
);

const getProjectDriveBackupStatus = (project) => ({
  enabled: Boolean(project?.driveBackup?.enabled),
  folderId: project?.driveBackup?.folderId || '',
  folderName: project?.driveBackup?.folderName || '',
  folderWebViewLink: project?.driveBackup?.folderWebViewLink || '',
  connectedEmail: project?.driveBackup?.connectedEmail || '',
  updatedAt: project?.driveBackup?.updatedAt || null,
  lastSyncAt: project?.driveBackup?.lastSyncAt || null,
  lastSyncSummary: project?.driveBackup?.lastSyncSummary || null,
  lastError: project?.driveBackup?.lastError || ''
});

const backupTaskFileToDrive = async (project, task, file) => {
  if (!isDriveBackupEnabled(project) || !file?.path) {
    return null;
  }

  const connectedBy = getDriveBackupActorId(project);
  const driveBackup = await ensureProjectDriveBackupFolders(project);
  const taskFolder = await ensureDriveChildFolder(
    connectedBy,
    driveBackup.subfolders.files,
    `${task._id}-${sanitizeDriveName(task.name, 'task')}`
  );

  const absolutePath = path.resolve(file.path);
  const driveFile = await uploadFilePathToDrive(connectedBy, {
    parentId: taskFolder.id,
    name: file.originalName || file.filename,
    mimeType: file.mimetype || 'application/octet-stream',
    filePath: absolutePath
  });

  const fileDriveBackup = {
    status: 'uploaded',
    fileId: driveFile.id,
    webViewLink: driveFile.webViewLink || '',
    folderId: taskFolder.id,
    uploadedAt: new Date()
  };

  await collections.tasksCollection.updateOne(
    { _id: task._id, 'files._id': file._id },
    { $set: { 'files.$.driveBackup': fileDriveBackup } }
  );

  return fileDriveBackup;
};

const backupAnnotationSnapshotToDrive = async ({
  taskId,
  filename,
  sliceData,
  updatedAt,
  integrityHash,
  user,
}) => {
  if (!collections.tasksCollection || !collections.projectsCollection) return null;

  const task = await collections.tasksCollection.findOne({ _id: new ObjectId(taskId) });
  if (!task?.projectId) return null;

  const project = await collections.projectsCollection.findOne({ _id: new ObjectId(task.projectId) });
  if (!isDriveBackupEnabled(project)) return null;

  const connectedBy = getDriveBackupActorId(project);
  const driveBackup = await ensureProjectDriveBackupFolders(project);
  const taskFolder = await ensureDriveChildFolder(
    connectedBy,
    driveBackup.subfolders.annotations,
    `${task._id}-${sanitizeDriveName(task.name, 'task')}`
  );
  const exportedAt = updatedAt instanceof Date ? updatedAt : new Date(updatedAt || Date.now());

  const snapshot = {
    format: 'medical-image-annotation-web-app.annotation-snapshot.v1',
    exportedAt: exportedAt.toISOString(),
    project: {
      id: project._id.toString(),
      name: project.name
    },
    task: {
      id: task._id.toString(),
      name: task.name
    },
    file: {
      filename
    },
    updatedBy: {
      id: user.id,
      email: user.email
    },
    integrity: integrityHash
      ? { algorithm: 'sha256', hash: integrityHash }
      : undefined,
    slices: sliceData || {}
  };

  const driveFile = await upsertJsonFileInDrive(
    connectedBy,
    taskFolder.id,
    `${filename}.annotations.json`,
    snapshot
  );

  const annotationDriveBackup = {
    status: 'uploaded',
    fileId: driveFile.id,
    webViewLink: driveFile.webViewLink || '',
    folderId: taskFolder.id,
    uploadedAt: new Date()
  };

  await collections.annotationsCollection.updateOne(
    { taskId, filename },
    { $set: { driveBackup: annotationDriveBackup } }
  );

  return annotationDriveBackup;
};

const buildProjectExportPayload = async (project) => {
  const tasks = await collections.tasksCollection.find({ projectId: project._id.toString() }).toArray();
  const taskIds = tasks.map(task => task._id.toString());
  const annotations = await collections.annotationsCollection.find({ taskId: { $in: taskIds } }).toArray();
  const exportTasks = tasks.map((task) => ({
    ...task,
    files: (task.files || []).map((file) => {
      const { path: storedPath, ...publicFile } = file;
      return publicFile;
    }),
  }));

  return {
    format: 'medical-image-annotation-web-app.project-export.v1',
    exportedAt: new Date().toISOString(),
    project,
    tasks: exportTasks,
    annotations
  };
};

const syncProjectToDrive = async (project) => {
  if (!isDriveBackupEnabled(project)) {
    throw makeRequestError('Google Drive backup is not enabled for this project.', 400);
  }

  const connectedBy = getDriveBackupActorId(project);
  const driveBackup = await ensureProjectDriveBackupFolders(project);
  const summary = {
    exports: 0,
    files: 0,
    annotations: 0,
    failures: []
  };

  try {
    const exportPayload = await buildProjectExportPayload(project);
    await upsertJsonFileInDrive(
      connectedBy,
      driveBackup.subfolders.exports,
      'project-export.json',
      exportPayload
    );
    summary.exports += 1;
  } catch (error) {
    summary.failures.push(`Project export: ${error.message}`);
  }

  const tasks = await collections.tasksCollection.find({ projectId: project._id.toString() }).toArray();
  for (const task of tasks) {
    for (const file of task.files || []) {
      try {
        if (file.path && fs.existsSync(path.resolve(file.path))) {
          await backupTaskFileToDrive(project, task, file);
          summary.files += 1;
        }
      } catch (error) {
        summary.failures.push(`File ${file.originalName || file.filename}: ${error.message}`);
      }
    }

    const annotations = await collections.annotationsCollection.find({ taskId: task._id.toString() }).toArray();
    for (const annotation of annotations) {
      try {
        await backupAnnotationSnapshotToDrive({
          taskId: task._id.toString(),
          filename: annotation.filename,
          sliceData: annotation.slices || {},
          updatedAt: annotation.updatedAt || new Date(),
          user: { id: project.userId, email: project.driveBackup.connectedEmail || '' }
        });
        summary.annotations += 1;
      } catch (error) {
        summary.failures.push(`Annotation ${annotation.filename}: ${error.message}`);
      }
    }
  }

  await collections.projectsCollection.updateOne(
    { _id: project._id },
    {
      $set: {
        'driveBackup.lastSyncAt': new Date(),
        'driveBackup.lastSyncSummary': summary,
        'driveBackup.lastError': summary.failures[0] || ''
      }
    }
  );

  return summary;
};

  return {
    GOOGLE_DRIVE_SCOPES,
    GOOGLE_DRIVE_API_BASE,
    GOOGLE_DRIVE_UPLOAD_BASE,
    GOOGLE_TOKEN_URL,
    getGoogleDriveConfig,
    isGoogleDriveConfigured,
    sanitizeDriveName,
    extractDriveFolderId,
    makeDriveError,
    parseGoogleJsonResponse,
    getStoredGoogleDriveConnection,
    refreshGoogleAccessToken,
    getGoogleAccessToken,
    googleDriveRawFetch,
    googleDriveJsonFetch,
    googleDriveCreateFolder,
    googleDriveGetFile,
    escapeDriveQueryValue,
    googleDriveFindChildByName,
    ensureDriveChildFolder,
    startGoogleResumableUpload,
    uploadContentToDrive,
    uploadFilePathToDrive,
    upsertJsonFileInDrive,
    getDriveBackupActorId,
    ensureProjectDriveBackupFolders,
    isDriveBackupEnabled,
    getProjectDriveBackupStatus,
    backupTaskFileToDrive,
    backupAnnotationSnapshotToDrive,
    buildProjectExportPayload,
    syncProjectToDrive,
  };
};

module.exports = { createGoogleDriveService };
