const assert = require('node:assert/strict');
const test = require('node:test');

const registerExportRoutes = require('../src/routes/exportRoutes');

const mockApp = {
  posts: {},
  post(path, ...handlers) {
    this.posts[path] = handlers;
  }
};

const mockContext = {
  authenticateToken: (req, res, next) => {
    req.user = { id: 'user-1' };
    next();
  },
  projectsCollection: {
    async findOne({ _id }) {
      return {
        _id,
        name: 'Lung Cancer Project',
        labels: [{ id: '1', name: 'GGO' }]
      };
    }
  },
  tasksCollection: {
    find() {
      return {
        toArray: async () => [
          {
            _id: 'task-1',
            projectId: 'proj-1',
            status: 'completed',
            filename: 'scan1.png',
            files: [
              { filename: 'scan1.png', width: 500, height: 500 }
            ]
          }
        ]
      };
    },
    async findOne({ _id }) {
      return {
        _id,
        projectId: 'proj-1',
        status: 'completed',
        filename: 'scan1.png',
        files: [
          { filename: 'scan1.png', width: 500, height: 500 }
        ]
      };
    }
  },
  annotationsCollection: {
    find({ taskId }) {
      return {
        toArray: async () => [
          {
            filename: 'scan1.png',
            taskId,
            slices: {
              '0': [
                { label: 'GGO', points: [{ x: 100, y: 150 }, { x: 200, y: 250 }] }
              ]
            }
          }
        ]
      };
    }
  },
  googleDriveService: {
    syncedZips: [],
    async syncProjectExportToDrive(projectId, zipBuffer, filename) {
      this.syncedZips.push({ projectId, filename, size: zipBuffer.length });
      return { webViewLink: 'http://drive.google.com/test-zip' };
    }
  }
};

test('POST /api/export/dataset - returns packaged ZIP archive', async () => {
  registerExportRoutes(mockApp, mockContext);

  const handler = mockApp.posts['/api/export/dataset'];
  assert.ok(handler);

  const controller = handler[handler.length - 1];

  let resHeaders = {};
  let resBuffer;
  let resJson;
  const mockReqValid = {
    user: { id: 'user-1' },
    body: {
      projectId: 'proj-1',
      format: 'YOLO',
      includeImages: false
    }
  };
  const mockRes = {
    statusCode: 200,
    setHeader(name, val) {
      resHeaders[name] = val;
      return this;
    },
    send(data) {
      resBuffer = data;
      return this;
    },
    json(data) {
      resJson = data;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    }
  };

  const nextHandler = (err) => {
    if (err) throw err;
  };

  await controller(mockReqValid, mockRes, nextHandler);
  assert.equal(mockRes.statusCode, 200);
  assert.equal(resHeaders['Content-Type'], 'application/zip');
  assert.ok(resBuffer); // ZIP buffer returned
});

test('POST /api/export/dataset - syncs to Google Drive if requested', async () => {
  registerExportRoutes(mockApp, mockContext);

  const handler = mockApp.posts['/api/export/dataset'];
  const controller = handler[handler.length - 1];

  let resJson;
  const mockReqSync = {
    user: { id: 'user-1' },
    body: {
      projectId: 'proj-1',
      format: 'COCO',
      includeImages: false,
      syncToDrive: true
    }
  };
  const mockRes = {
    statusCode: 200,
    setHeader() { return this; },
    json(data) {
      resJson = data;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    }
  };

  const nextHandler = (err) => {
    if (err) throw err;
  };

  await controller(mockReqSync, mockRes, nextHandler);
  assert.equal(mockRes.statusCode, 200);
  assert.equal(resJson.message, 'Export synced to Google Drive successfully');
  assert.equal(resJson.link, 'http://drive.google.com/test-zip');
  assert.equal(mockContext.googleDriveService.syncedZips.length, 1);
});
