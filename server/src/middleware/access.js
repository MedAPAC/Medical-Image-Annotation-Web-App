const createAccessMiddleware = ({ collections, ObjectId }) => {
  const checkProjectAccess = async (req, res, next) => {
    const { projectsCollection } = collections;

    try {
      const project = await projectsCollection.findOne({
        _id: new ObjectId(req.params.projectId),
        $or: [
          { userId: req.user.id },
          { owners: req.user.id },
        ],
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found or access denied" });
      }

      req.project = project;
      next();
    } catch (err) {
      console.error("Project access check error:", err);
      res.status(500).json({ error: "Server error" });
    }
  };

  const checkTaskAccess = async (req, res, next) => {
    const { tasksCollection, projectsCollection } = collections;

    try {
      const task = await tasksCollection.findOne({
        _id: new ObjectId(req.params.taskId),
        $or: [
          { userId: req.user.id },
          { assignedTo: req.user.id },
          { createdBy: req.user.email },
          {
            projectId: { $exists: true },
            $expr: {
              $let: {
                vars: {
                  project: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: { $ifNull: [await projectsCollection.find({}).toArray(), []] },
                          as: "proj",
                          cond: { $eq: ["$$proj._id", { $toObjectId: "$projectId" }] },
                        },
                      },
                      0,
                    ],
                  },
                },
                in: {
                  $or: [
                    { $eq: ["$$project.userId", req.user.id] },
                    { $in: [req.user.id, { $ifNull: ["$$project.owners", []] }] },
                  ],
                },
              },
            },
          },
        ],
      });

      if (!task) {
        return res.status(404).json({ error: "Task not found or access denied" });
      }

      req.task = task;
      next();
    } catch (err) {
      console.error("Task access check error:", err);
      res.status(500).json({ error: "Server error" });
    }
  };

  return { checkProjectAccess, checkTaskAccess };
};

module.exports = { createAccessMiddleware };