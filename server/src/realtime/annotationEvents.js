const createAnnotationEvents = ({ collections, ObjectId }) => {
  const annotationEventClients = new Map();

  const addAnnotationEventClient = (taskId, client) => {
    if (!annotationEventClients.has(taskId)) annotationEventClients.set(taskId, new Set());
    annotationEventClients.get(taskId).add(client);
  };

  const removeAnnotationEventClient = (taskId, client) => {
    const clients = annotationEventClients.get(taskId);
    if (!clients) return;
    clients.delete(client);
    if (clients.size === 0) annotationEventClients.delete(taskId);
  };

  const sendAnnotationEvent = (client, eventName, payload) => {
    client.res.write(`event: ${eventName}\n`);
    client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  const broadcastAnnotationUpdate = (taskId, payload) => {
    const clients = annotationEventClients.get(taskId);
    if (!clients) return;
    clients.forEach((client) => {
      try {
        sendAnnotationEvent(client, 'annotation-updated', payload);
      } catch (error) {
        removeAnnotationEventClient(taskId, client);
      }
    });
  };

  const canUserAccessTaskId = async (taskId, user) => {
    const { tasksCollection, projectsCollection } = collections;
    if (!tasksCollection || !ObjectId.isValid(taskId)) return false;

    const task = await tasksCollection.findOne({ _id: new ObjectId(taskId) });
    if (!task) return false;

    const userId = String(user.id);
    const userEmail = user.email;
    if (
      String(task.userId) === userId ||
      String(task.assignedTo) === userId ||
      task.createdBy === userEmail ||
      (Array.isArray(task.assignees) && task.assignees.some((id) => String(id) === userId))
    ) {
      return true;
    }

    if (!task.projectId || !projectsCollection || !ObjectId.isValid(task.projectId)) return false;
    const project = await projectsCollection.findOne({ _id: new ObjectId(task.projectId) });
    return Boolean(
      project && (
        String(project.userId) === userId ||
        (Array.isArray(project.owners) && project.owners.some((id) => String(id) === userId))
      )
    );
  };

  const registerAnnotationEventRoutes = (app, {
    authenticateToken,
    authenticateEventToken,
    issueEventToken,
  }) => {
    app.post('/api/annotation-events/:taskId/ticket', authenticateToken, async (req, res) => {
      const { taskId } = req.params;
      const canAccess = await canUserAccessTaskId(taskId, req.user);
      if (!canAccess) return res.status(403).json({ error: 'Task not found or access denied' });
      return res.json({ ticket: issueEventToken(req.user, taskId), expiresInSeconds: 900 });
    });

    app.get('/annotation-events/:taskId', authenticateEventToken, async (req, res) => {
      const { taskId } = req.params;
      const canAccess = await canUserAccessTaskId(taskId, req.user);
      if (!canAccess) return res.status(403).json({ error: 'Task not found or access denied' });

      const requestedClientId = typeof req.query.clientId === 'string'
        ? req.query.clientId.slice(0, 128)
        : '';
      const client = {
        id: requestedClientId || `${req.user.id}-${Date.now()}`,
        userId: String(req.user.id),
        res,
      };

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      addAnnotationEventClient(taskId, client);
      sendAnnotationEvent(client, 'connected', {
        taskId,
        clientId: client.id,
        connectedAt: new Date().toISOString(),
      });

      const heartbeat = setInterval(() => res.write(': keep-alive\n\n'), 25000);
      req.on('close', () => {
        clearInterval(heartbeat);
        removeAnnotationEventClient(taskId, client);
        res.end();
      });
      return undefined;
    });
  };

  return {
    addAnnotationEventClient,
    removeAnnotationEventClient,
    sendAnnotationEvent,
    broadcastAnnotationUpdate,
    canUserAccessTaskId,
    registerAnnotationEventRoutes,
  };
};

module.exports = { createAnnotationEvents };
