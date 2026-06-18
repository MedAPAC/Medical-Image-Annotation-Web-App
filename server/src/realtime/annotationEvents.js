const createAnnotationEvents = ({ collections, ObjectId }) => {
  const annotationEventClients = new Map();

  const addAnnotationEventClient = (taskId, client) => {
    if (!annotationEventClients.has(taskId)) {
      annotationEventClients.set(taskId, new Set());
    }
    annotationEventClients.get(taskId).add(client);
  };

  const removeAnnotationEventClient = (taskId, client) => {
    const clients = annotationEventClients.get(taskId);
    if (!clients) return;
    clients.delete(client);
    if (clients.size === 0) {
      annotationEventClients.delete(taskId);
    }
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
        sendAnnotationEvent(client, "annotation-updated", payload);
      } catch (err) {
        removeAnnotationEventClient(taskId, client);
      }
    });
  };

  const canUserAccessTaskId = async (taskId, user) => {
    const { tasksCollection, projectsCollection } = collections;
    if (!tasksCollection) return false;

    let taskObjectId;
    try {
      taskObjectId = new ObjectId(taskId);
    } catch (err) {
      return false;
    }

    const task = await tasksCollection.findOne({ _id: taskObjectId });
    if (!task) return false;

    const userId = user.id;
    const userEmail = user.email;
    if (
      task.userId === userId ||
      task.assignedTo === userId ||
      task.createdBy === userEmail ||
      (Array.isArray(task.assignees) && task.assignees.includes(userId))
    ) {
      return true;
    }

    if (!task.projectId || !projectsCollection) return false;

    let projectObjectId;
    try {
      projectObjectId = new ObjectId(task.projectId);
    } catch (err) {
      return false;
    }

    const project = await projectsCollection.findOne({ _id: projectObjectId });
    return Boolean(
      project &&
      (project.userId === userId || (Array.isArray(project.owners) && project.owners.includes(userId)))
    );
  };

  const registerAnnotationEventRoute = (app, authenticateEventToken) => {
    app.get("/annotation-events/:taskId", authenticateEventToken, async (req, res) => {
      const { taskId } = req.params;
      const canAccess = await canUserAccessTaskId(taskId, req.user);

      if (!canAccess) {
        return res.status(403).json({ error: "Task not found or access denied" });
      }

      const client = {
        id: req.query.clientId || `${req.user.id}-${Date.now()}`,
        userId: req.user.id,
        res,
      };

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      addAnnotationEventClient(taskId, client);
      sendAnnotationEvent(client, "connected", {
        taskId,
        clientId: client.id,
        connectedAt: new Date().toISOString(),
      });

      const heartbeat = setInterval(() => {
        res.write(": keep-alive\n\n");
      }, 25000);

      req.on("close", () => {
        clearInterval(heartbeat);
        removeAnnotationEventClient(taskId, client);
        res.end();
      });
    });
  };

  return {
    addAnnotationEventClient,
    removeAnnotationEventClient,
    sendAnnotationEvent,
    broadcastAnnotationUpdate,
    canUserAccessTaskId,
    registerAnnotationEventRoute,
  };
};

module.exports = { createAnnotationEvents };