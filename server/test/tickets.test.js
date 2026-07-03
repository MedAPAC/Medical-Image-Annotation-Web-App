const assert = require('node:assert/strict');
const test = require('node:test');

const registerTicketRoutes = require('../src/routes/ticketRoutes');

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
  ticketsCollection: {
    inserted: [],
    async insertOne(doc) {
      this.inserted.push(doc);
      return { insertedId: 'ticket-id-123' };
    }
  }
};

test('POST /api/tickets/create - creates developer ticket in database', async () => {
  registerTicketRoutes(mockApp, mockContext);

  const handler = mockApp.posts['/api/tickets/create'];
  assert.ok(handler);

  const controller = handler[handler.length - 1];

  let resJson;
  const mockReqValid = {
    user: { id: 'user-1' },
    body: {
      title: 'UI bug in RightPanel',
      description: 'RightPanel is overlapping active canvas',
      chatContext: 'User asked about overlaps...'
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

  const nextHandler = (err) => {
    if (err) throw err;
  };

  await controller(mockReqValid, mockRes, nextHandler);
  assert.equal(mockRes.statusCode, 200);
  assert.equal(resJson.message, 'Ticket created successfully');
  assert.equal(resJson.ticketId, 'ticket-id-123');

  assert.equal(mockContext.ticketsCollection.inserted.length, 1);
  const insertedTicket = mockContext.ticketsCollection.inserted[0];
  assert.equal(insertedTicket.title, 'UI bug in RightPanel');
  assert.equal(insertedTicket.userId, 'user-1');

  const mockReqInvalid = { user: { id: 'user-1' }, body: {} };
  await controller(mockReqInvalid, mockRes, nextHandler);
  assert.equal(mockRes.statusCode, 400);
  assert.equal(resJson.error, 'Title and description are required');
});
