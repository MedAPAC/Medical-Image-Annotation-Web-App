const assert = require('node:assert/strict');
const test = require('node:test');

const registerAiRoutes = require('../src/routes/aiRoutes');

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

test('POST /api/ai/chat - processes chat message and calls NIM proxy', async () => {
  registerAiRoutes(mockApp, mockContext);

  const handler = mockApp.posts['/api/ai/chat'];
  assert.ok(handler);

  const controller = handler[handler.length - 1];

  let resJson;
  const mockReqValid = {
    body: {
      message: 'What is a ground glass opacity?'
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

  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    return {
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'A ground glass opacity is a lung finding on CT scans...'
            }
          }
        ]
      })
    };
  };

  const originalKey = process.env.NVIDIA_NIM_API_KEY;
  process.env.NVIDIA_NIM_API_KEY = 'test-key';

  try {
    await controller(mockReqValid, mockRes);
    assert.equal(mockRes.statusCode, 200);
    assert.equal(resJson.reply, 'A ground glass opacity is a lung finding on CT scans...');

    // Test missing message validation
    const mockReqInvalid = { body: {} };
    await controller(mockReqInvalid, mockRes);
    assert.equal(mockRes.statusCode, 400);
    assert.equal(resJson.error, 'Message content is required');

    // Test mock fallback when key is not present
    process.env.NVIDIA_NIM_API_KEY = '';
    mockRes.statusCode = 200;
    await controller(mockReqValid, mockRes);
    assert.equal(mockRes.statusCode, 200);
    assert.match(resJson.reply, /clinical annotation assistant/);
  } finally {
    global.fetch = originalFetch;
    process.env.NVIDIA_NIM_API_KEY = originalKey;
  }
});

test('POST /api/ai/chat - injects active task description and labels into system prompt', async () => {
  registerAiRoutes(mockApp, mockContext);
  const handler = mockApp.posts['/api/ai/chat'];
  const controller = handler[handler.length - 1];

  let fetchPayload;
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    fetchPayload = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Response with context' } }]
      })
    };
  };

  const originalKey = process.env.NVIDIA_NIM_API_KEY;
  process.env.NVIDIA_NIM_API_KEY = 'test-key';

  const mockReq = {
    body: {
      message: 'Explain guidelines for GGO.',
      taskDescription: 'Annotate ground glass opacity only.',
      taskLabels: 'GGO, Consolidation'
    }
  };

  let resJson;
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

  try {
    await controller(mockReq, mockRes);
    assert.equal(mockRes.statusCode, 200);
    assert.equal(resJson.reply, 'Response with context');
    
    // Check that system prompt contains description and labels and matched GGO medical definition
    const systemPrompt = fetchPayload.messages[0].content;
    assert.match(systemPrompt, /Active Task Guidelines:\nAnnotate ground glass opacity only\./);
    assert.match(systemPrompt, /Active Task Labels:\nGGO, Consolidation/);
    assert.match(systemPrompt, /Relevant Medical Definitions:\nGGO:/);
  } finally {
    global.fetch = originalFetch;
    process.env.NVIDIA_NIM_API_KEY = originalKey;
  }
});
