const assert = require('node:assert/strict');
const test = require('node:test');

const registerInferenceRoutes = require('../src/routes/inferenceRoutes');

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
  }
};

test('POST /api/inference/predict - returns mock inference response', async () => {
  registerInferenceRoutes(mockApp, mockContext);

  const handler = mockApp.posts['/api/inference/predict'];
  assert.ok(handler);

  const controller = handler[handler.length - 1];

  // 1. Test Point Prompt -> Polygon Output
  let resJson;
  const mockReqPoint = {
    body: {
      prompt: { type: 'point', x: 100, y: 150, isPositive: true },
      imageContext: { width: 512, height: 512 }
    }
  };
  const mockRes = {
    statusCode: 200,
    json(data) {
      resJson = data;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    }
  };

  await controller(mockReqPoint, mockRes);
  assert.equal(mockRes.statusCode, 200);
  assert.equal(resJson.type, 'polygon');
  assert.ok(Array.isArray(resJson.points));
  assert.equal(resJson.points.length, 4);

  // 2. Test Text Prompt -> Classification Output
  const mockReqText = {
    body: {
      prompt: { type: 'text', text: 'fracture' }
    }
  };
  await controller(mockReqText, mockRes);
  assert.equal(mockRes.statusCode, 200);
  assert.equal(resJson.type, 'classification');
  assert.deepEqual(resJson.labels, ['mock-label-fracture']);

  // 3. Test Invalid Prompt -> 400 Bad Request
  const mockReqInvalid = {
    body: {}
  };
  await controller(mockReqInvalid, mockRes);
  assert.equal(mockRes.statusCode, 400);
  assert.equal(resJson.error, 'Invalid prompt payload');
});
