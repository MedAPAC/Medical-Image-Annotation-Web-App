const includesId = (values, userId) => (
  Array.isArray(values) && values.some((value) => String(value) === String(userId))
);

const createAccessMiddleware = ({ collections, ObjectId }) => {
  const userOwnsProject = (project, userId) => Boolean(
    project && (
      String(project.userId) === String(userId) ||
      includesId(project.owners, userId)
    )
  );

  const userDirectlyAccessesTask = (task, user) => Boolean(
    task && (
      String(task.userId) === String(user.id) ||
      String(task.assignedTo) === String(user.id) ||
      includesId(task.assignees, user.id) ||
      (task.createdBy && user.email && task.createdBy.toLowerCase() === user.email.toLowerCase())
    )
  );

  const checkProjectAccess = async (req, res, next) => {
    const { projectsCollection } = collections;
    if (!ObjectId.isValid(req.params.projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    try {
      const project = await projectsCollection.findOne({ _id: new ObjectId(req.params.projectId) });
      if (!userOwnsProject(project, req.user.id)) {
        return res.status(404).json({ error: 'Project not found or access denied' });
      }
      req.project = project;
      return next();
    } catch (error) {
      console.error('Project access check error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  };

  const checkTaskAccess = async (req, res, next) => {
    const { tasksCollection, projectsCollection } = collections;
    if (!ObjectId.isValid(req.params.taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    try {
      const task = await tasksCollection.findOne({ _id: new ObjectId(req.params.taskId) });
      if (!task) return res.status(404).json({ error: 'Task not found or access denied' });

      let allowed = userDirectlyAccessesTask(task, req.user);
      if (!allowed && task.projectId && ObjectId.isValid(task.projectId)) {
        const project = await projectsCollection.findOne({ _id: new ObjectId(task.projectId) });
        allowed = userOwnsProject(project, req.user.id);
      }

      if (!allowed) return res.status(404).json({ error: 'Task not found or access denied' });
      req.task = task;
      return next();
    } catch (error) {
      console.error('Task access check error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  };

  return { checkProjectAccess, checkTaskAccess, userOwnsProject, userDirectlyAccessesTask };
};

module.exports = { createAccessMiddleware };
