module.exports = function registerTaskRoutes(app, context) {
  const {
    authenticateToken,
    checkProjectAccess,
    checkTaskAccess,
    taskUpload,
    ObjectId,
    fs,
    path,
    db,
    usersCollection,
    projectsCollection,
    tasksCollection,
    getFileType,
    resolveUserIdsFromEmailsAndTeams,
    isDriveBackupEnabled,
    backupTaskFileToDrive,
  } = context;
// Get all tasks accessible to user
app.get('/api/tasks', authenticateToken, async (req, res) => {
  if (!tasksCollection || !projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    // Get projects where user is an owner
    const userProjects = await projectsCollection.find({
      $or: [
        { userId: req.user.id },
        { owners: req.user.id }
      ]
    }).toArray();

    const projectIds = userProjects.map(project => project._id.toString());

    // Get tasks where user is assigned or user owns the project
    const tasks = await tasksCollection.find({
      $or: [
        { assignedTo: req.user.id },
        { assignees: req.user.id },
        { projectId: { $in: projectIds } },
        { createdBy: req.user.email }
      ]
    }).sort({ createdAt: -1 }).toArray();

    // Get assignee details
    const tasksWithDetails = await Promise.all(
      tasks.map(async (task) => {
        let assigneeDetails = null;
        if (task.assignedTo) {
          const user = await usersCollection.findOne(
            { _id: new ObjectId(task.assignedTo) },
            { projection: { name: 1, email: 1 } }
          );
          if (user) {
            assigneeDetails = {
              id: user._id,
              name: user.name,
              email: user.email
            };
          }
        }

        return {
          ...task,
          assigneeDetails
        };
      })
    );

    res.json({ tasks: tasksWithDetails });
  } catch (err) {
    console.error('Failed to fetch tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get tasks for a specific project
app.get('/api/projects/:projectId/tasks', authenticateToken, checkProjectAccess, async (req, res) => {
  if (!tasksCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    const tasks = await tasksCollection.find({
      projectId: req.params.projectId
    }).sort({ createdAt: -1 }).toArray();

    // Get assignee details
    const tasksWithDetails = await Promise.all(
      tasks.map(async (task) => {
        let assigneeDetails = null;
        if (task.assignedTo) {
          const user = await usersCollection.findOne(
            { _id: new ObjectId(task.assignedTo) },
            { projection: { name: 1, email: 1 } }
          );
          if (user) {
            assigneeDetails = {
              id: user._id,
              name: user.name,
              email: user.email
            };
          }
        }

        return {
          ...task,
          assigneeDetails
        };
      })
    );

    res.json({ tasks: tasksWithDetails });
  } catch (err) {
    console.error('Failed to fetch project tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get single task
// Get single task
app.get('/api/tasks/:taskId', authenticateToken, checkTaskAccess, async (req, res) => {
  if (!tasksCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    const task = req.task;

    // 1. Populate Single Assignee (Legacy)
    let assigneeDetails = null;
    if (task.assignedTo) {
      const user = await usersCollection.findOne(
        { _id: new ObjectId(task.assignedTo) },
        { projection: { name: 1, email: 1 } }
      );
      if (user) assigneeDetails = { id: user._id, name: user.name, email: user.email };
    }

    // 2. Populate Multiple Assignees (New)
    let assigneesList = []; // This will contain emails/names
    if (task.assignees && Array.isArray(task.assignees) && task.assignees.length > 0) {
        // Find all users whose IDs are in the assignees array
        const users = await usersCollection.find({
            _id: { $in: task.assignees.map(id => new ObjectId(id)) }
        }).project({ email: 1, name: 1 }).toArray();
        
        // We mostly need the emails for the frontend tags
        assigneesList = users.map(u => u.email); 
    } else if (assigneeDetails) {
        // Fallback: if only old assignedTo exists, add it to the list
        assigneesList = [assigneeDetails.email];
    }

    res.json({ 
      task: {
        ...task,
        assigneeDetails, // Legacy object
        assignees: assigneesList // New Array of emails ['a@b.com', 'c@d.com']
      }
    });
  } catch (err) {
    console.error('Failed to fetch task:', err);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});


// Create a new task
// Create a new task
app.post('/api/tasks', authenticateToken, async (req, res) => {
  if (!tasksCollection || !projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  // Accept assigneeEmails (Array) OR assigneeEmail (String - legacy)
  const { name, projectId, subset, description, assigneeEmails, assigneeEmail, assigneeTeamIds = [], priority } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Task name is required" });
  }
  if (!projectId) {
    return res.status(400).json({ error: "Project ID is required" });
  }

  try {
    const project = await projectsCollection.findOne({ 
      _id: new ObjectId(projectId),
      $or: [{ userId: req.user.id }, { owners: req.user.id }]
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    // Handle Assignees
    let assigneeIds = [];

    if (assigneeEmails !== undefined && !Array.isArray(assigneeEmails)) {
      return res.status(400).json({ error: "assigneeEmails must be an array" });
    }
    if (!Array.isArray(assigneeTeamIds)) {
      return res.status(400).json({ error: "assigneeTeamIds must be an array" });
    }

    const directAssigneeEmails = Array.isArray(assigneeEmails)
      ? assigneeEmails
      : assigneeEmail
        ? [assigneeEmail]
        : [];

    if (directAssigneeEmails.length > 0 || assigneeTeamIds.length > 0) {
      assigneeIds = await resolveUserIdsFromEmailsAndTeams({
        emails: directAssigneeEmails,
        teamIds: assigneeTeamIds,
        user: req.user
      });
    }

    const newTask = {
      name: name.trim(),
      description: description || '',
      projectId: projectId,
      projectName: project.name,
      subset: subset || 'train',
      
      assignees: assigneeIds, // New Array
      assignedTo: assigneeIds.length > 0 ? assigneeIds[0] : null, // Legacy support
      
      priority: priority || 'medium',
      status: 'pending',
      state: 'new',
      files: [],
      labels: project.labels || [],
      attributes: project.attributes || [],
      userId: req.user.id,
      createdBy: req.user.email,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: 0,
      completedItems: 0,
      totalItems: 0
    };

    const result = await tasksCollection.insertOne(newTask);
    
    await projectsCollection.updateOne(
      { _id: new ObjectId(projectId) },
      { $inc: { tasks: 1 }, $set: { updatedAt: new Date() } }
    );

    res.json({
      message: "Task created successfully",
      task: { id: result.insertedId, ...newTask }
    });
  } catch (err) {
    console.error("Failed to create task:", err);
    res.status(err.status || 500).json({ error: err.message || "Failed to create task. Please try again." });
  }
});


// Update task assignees (Multiple)
app.put('/api/tasks/:taskId/assign', authenticateToken, checkTaskAccess, async (req, res) => {
  if (!tasksCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  // Accept assigneeEmails (array), assigneeEmail (legacy string), and assigneeTeamIds (owned teams).
  const { assigneeEmails, assigneeEmail, assigneeTeamIds = [] } = req.body; 

  try {
    // Verify user has permission (must be project owner)
    const project = await projectsCollection.findOne({
      _id: new ObjectId(req.task.projectId),
      owners: req.user.id
    });

    if (!project) {
      return res.status(403).json({ error: "You don't have permission to assign tasks for this project" });
    }

    // Use the existing helper function to validate and convert emails to IDs
    let assigneeIds = [];

    if (assigneeEmails !== undefined && !Array.isArray(assigneeEmails)) {
      return res.status(400).json({ error: "assigneeEmails must be an array" });
    }
    if (!Array.isArray(assigneeTeamIds)) {
      return res.status(400).json({ error: "assigneeTeamIds must be an array" });
    }

    const directAssigneeEmails = Array.isArray(assigneeEmails)
      ? assigneeEmails
      : assigneeEmail
        ? [assigneeEmail]
        : [];

    if (directAssigneeEmails.length > 0 || assigneeTeamIds.length > 0) {
      assigneeIds = await resolveUserIdsFromEmailsAndTeams({
        emails: directAssigneeEmails,
        teamIds: assigneeTeamIds,
        user: req.user
      });
    }

    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(req.params.taskId) },
      { 
        $set: { 
          assignees: assigneeIds, // New Array Field
          // Maintain backward compatibility by setting assignedTo to the first user
          assignedTo: assigneeIds.length > 0 ? assigneeIds[0] : null,
          updatedAt: new Date() 
        }
      }
    );

    if (result.modifiedCount === 0) {
      // It's possible the data was the same, but we return success
      // return res.status(404).json({ error: 'Task not found' });
    }

    // Fetch the updated task to return the full list of emails
    const updatedTask = await tasksCollection.findOne({ _id: new ObjectId(req.params.taskId) });
    
    // Resolve IDs back to emails for the frontend response
    let resolvedEmails = [];
    if (updatedTask.assignees && updatedTask.assignees.length > 0) {
        const users = await usersCollection.find({ 
            _id: { $in: updatedTask.assignees.map(id => new ObjectId(id)) } 
        }).toArray();
        resolvedEmails = users.map(u => u.email);
    }
    
    // Manually attach this to the response object so frontend updates immediately
    updatedTask.assignees = resolvedEmails;

    res.json({
      message: 'Task assignments updated successfully',
      task: updatedTask
    });
  } catch (err) {
    console.error('Failed to update task assignment:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to update task assignment' });
  }
});

// Upload files to a task
app.post('/api/tasks/:taskId/files', authenticateToken, checkTaskAccess, taskUpload.array('files'), async (req, res) => {
  if (!tasksCollection || !projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Generate ObjectId for each file to allow specific deletion later
    const files = req.files.map(file => ({
      _id: new ObjectId(), // <--- CRITICAL: Generate ID for the file
      originalName: file.originalname,
      filename: file.filename,
      path: file.path, // relative path usually handled by multer storage
      size: file.size,
      mimetype: file.mimetype,
      type: getFileType(file.originalname),
      uploadedAt: new Date()
    }));

    console.log('Files to be saved:', files.map(f => f.originalName));

    // Add files to task
    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(req.params.taskId) },
      {
        $push: { files: { $each: files } },
        $set: { 
          updatedAt: new Date(),
          totalItems: (req.task.totalItems || 0) + files.length
        }
      }
    );

    try {
      const project = await projectsCollection.findOne({ _id: new ObjectId(req.task.projectId) });
      if (isDriveBackupEnabled(project)) {
        for (const file of files) {
          try {
            file.driveBackup = await backupTaskFileToDrive(project, req.task, file);
          } catch (driveErr) {
            console.error(`Google Drive file backup failed for ${file.originalName}:`, driveErr);
            file.driveBackup = {
              status: 'failed',
              error: driveErr.message || 'Google Drive backup failed',
              attemptedAt: new Date()
            };
            await tasksCollection.updateOne(
              { _id: new ObjectId(req.params.taskId), 'files._id': file._id },
              { $set: { 'files.$.driveBackup': file.driveBackup } }
            );
          }
        }
      }
    } catch (driveErr) {
      console.error("Google Drive file backup setup failed:", driveErr);
    }

    // Return the files with their new IDs
    res.json({
      message: 'Files uploaded successfully',
      files: files,
      totalFiles: (req.task.files ? req.task.files.length : 0) + files.length
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'Failed to upload files: ' + err.message });
  }
});

// Delete a specific file from a task
app.delete('/api/tasks/:taskId/files/:fileId', authenticateToken, async (req, res) => {
  if (!tasksCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const { taskId, fileId } = req.params;

  try {
    // 1. Get the task to find the file path
    const task = await tasksCollection.findOne({ _id: new ObjectId(taskId) });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Check permissions (Project Owner or Creator)
    const project = await projectsCollection.findOne({
        _id: new ObjectId(task.projectId),
        $or: [{ owners: req.user.id }, { userId: req.user.id }]
    });

    if (!project && task.createdBy !== req.user.email) {
        return res.status(403).json({ error: "Permission denied" });
    }

    // 2. Find the file in the array
    // We check both string ID and ObjectId for backward compatibility
    const fileToDelete = task.files.find(f => 
        (f._id && f._id.toString() === fileId) || f.filename === fileId
    );

    if (!fileToDelete) {
        return res.status(404).json({ error: 'File not found in task' });
    }

    // 3. Remove from Disk
    if (fileToDelete.path) {
        // Construct absolute path. 
        // Note: fileToDelete.path from Multer is usually the full path, 
        // but if it's relative, ensure we join it correctly.
        const filePath = path.resolve(fileToDelete.path); 
        
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log(`Deleted file from disk: ${filePath}`);
            } catch (unlinkErr) {
                console.error("Error deleting file from disk:", unlinkErr);
                // Continue to remove from DB even if disk delete fails
            }
        }
    }

    // 4. Remove from Database
    await tasksCollection.updateOne(
        { _id: new ObjectId(taskId) },
        { 
            $pull: { files: { _id: fileToDelete._id } },
            $inc: { totalItems: -1 } // Decrease total items count
        }
    );

    res.json({ success: true, message: 'File deleted successfully' });

  } catch (err) {
    console.error("Delete file error:", err);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

// -------------------------------------------------------------------------
// GET: Retrieve Timer
// -------------------------------------------------------------------------
app.get('/api/tasks/:taskId/timer', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    console.log(`[Timer GET] Fetching for Task: ${taskId}, User: ${userId}`);

    // Try finding exact match first (String comparison)
    let timerRecord = await db.collection('taskTimersCollection').findOne({ 
      taskId: taskId, 
      userId: userId 
    });

    // If not found, logic to handle ObjectId mismatch just in case
    // (Only strictly necessary if your DB mixes types, but safer to keep simple first)
    
    const seconds = timerRecord ? timerRecord.seconds : 0;
    console.log(`[Timer GET] Found seconds: ${seconds}`);
    
    res.json({ seconds });
  } catch (err) {
    console.error("Timer GET Error:", err);
    res.status(500).json({ error: "Failed to fetch timer" });
  }
});

// -------------------------------------------------------------------------
// POST: Save Timer (Update or Insert)
// -------------------------------------------------------------------------
app.post('/api/tasks/:taskId/timer', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const { seconds } = req.body;

    console.log(`[Timer POST] Saving ${seconds}s for Task: ${taskId}`);

    // Validation
    if (seconds === undefined || seconds === null) {
        console.error("[Timer POST] Error: 'seconds' is missing in body");
        return res.status(400).json({ error: "Seconds required" });
    }

    // Upsert Logic
    const result = await db.collection('taskTimersCollection').updateOne(
      { taskId: taskId, userId: userId },
      { 
        $set: { 
          seconds: Number(seconds), // Force Number type
          updatedAt: new Date() 
        },
        $setOnInsert: { 
          createdAt: new Date(),
          taskId: taskId, // Ensure these fields exist on creation
          userId: userId 
        }
      },
      { upsert: true }
    );

    res.json({ success: true, savedSeconds: seconds });
  } catch (err) {
    console.error("Timer POST Error:", err);
    res.status(500).json({ error: "Failed to save timer" });
  }
});

// Update task
app.put('/api/tasks/:taskId', authenticateToken, checkTaskAccess, async (req, res) => {
  if (!tasksCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    // Check if user has permission (must be project owner or assignee)
    const project = await projectsCollection.findOne({
      _id: new ObjectId(req.task.projectId),
      $or: [
        { owners: req.user.id },
        { userId: req.user.id }
      ]
    });

    const isAssignee = req.task.assignedTo === req.user.id;
    
    if (!project && !isAssignee) {
      return res.status(403).json({ error: "You don't have permission to update this task" });
    }

    const updates = req.body;
    updates.updatedAt = new Date();

    // If user is not project owner, restrict what they can update
    if (!project && isAssignee) {
      // Assignee can only update progress and status
      const allowedFields = ['progress', 'completedItems', 'status'];
      const restrictedUpdates = {};
      for (const key in updates) {
        if (allowedFields.includes(key)) {
          restrictedUpdates[key] = updates[key];
        }
      }
      Object.assign(updates, restrictedUpdates);
    }

    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(req.params.taskId) },
      { $set: updates }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Task not found or no changes made' });
    }

    const updatedTask = await tasksCollection.findOne({ _id: new ObjectId(req.params.taskId) });

    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (err) {
    console.error('Failed to update task:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Update task progress
app.put('/api/tasks/:taskId/progress', authenticateToken, checkTaskAccess, async (req, res) => {
  if (!tasksCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    const { progress, completedItems } = req.body;
    
    if (progress === undefined && completedItems === undefined) {
      return res.status(400).json({ error: 'Progress or completedItems required' });
    }

    // Check if user is assignee or project owner
    const isAssignee = req.task.assignedTo === req.user.id;
    const project = await projectsCollection.findOne({
      _id: new ObjectId(req.task.projectId),
      $or: [
        { owners: req.user.id },
        { userId: req.user.id }
      ]
    });

    if (!isAssignee && !project) {
      return res.status(403).json({ error: "You don't have permission to update this task's progress" });
    }

    const updateData = {
      updatedAt: new Date()
    };

    if (progress !== undefined) {
      updateData.progress = Math.min(Math.max(progress, 0), 100);
    }

    if (completedItems !== undefined) {
      updateData.completedItems = Math.max(0, completedItems);
      
      // Calculate progress if not provided
      if (progress === undefined && req.task.totalItems > 0) {
        updateData.progress = Math.round((completedItems / req.task.totalItems) * 100);
      }
    }

    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(req.params.taskId) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      message: 'Progress updated successfully',
      progress: updateData.progress,
      completedItems: updateData.completedItems
    });
  } catch (err) {
    console.error('Failed to update progress:', err);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Delete task
app.delete('/api/tasks/:taskId', authenticateToken, async (req, res) => {
  if (!tasksCollection || !projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    const task = await tasksCollection.findOne({ 
      _id: new ObjectId(req.params.taskId)
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has permission (must be project owner)
    const project = await projectsCollection.findOne({
      _id: new ObjectId(task.projectId),
      $or: [
        { userId: req.user.id },
        { owners: req.user.id }
      ]
    });

    if (!project) {
      return res.status(403).json({ error: "You don't have permission to delete this task" });
    }

    // Delete uploaded files
    if (task.files && task.files.length > 0) {
      const uploadDir = `uploads/tasks/${req.params.taskId}`;
      if (fs.existsSync(uploadDir)) {
        fs.rmSync(uploadDir, { recursive: true, force: true });
      }
    }

    // Delete task
    const result = await tasksCollection.deleteOne({ _id: new ObjectId(req.params.taskId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update project task count - DECREMENT
    await projectsCollection.updateOne(
      { _id: new ObjectId(task.projectId) },
      { 
        $inc: { tasks: -1 },
        $set: { updatedAt: new Date() }
      }
    );

    console.log(`Task count decremented for project ${task.projectId}`);

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Failed to delete task:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Get task statistics
app.get('/api/tasks/stats', authenticateToken, async (req, res) => {
  if (!tasksCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    // Get projects where user is an owner
    const userProjects = await projectsCollection.find({
      $or: [
        { userId: req.user.id },
        { owners: req.user.id }
      ]
    }).toArray();

    const projectIds = userProjects.map(project => project._id.toString());

    // Get tasks where user is assigned or user owns the project
    const stats = await tasksCollection.aggregate([
      {
        $match: {
          $or: [
            { assignedTo: req.user.id },
            { projectId: { $in: projectIds } },
            { createdBy: req.user.email }
          ]
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalProgress: { $avg: '$progress' }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          averageProgress: { $round: ['$totalProgress', 2] },
          _id: 0
        }
      }
    ]).toArray();

    const totalTasks = stats.reduce((sum, stat) => sum + stat.count, 0);

    res.json({
      totalTasks,
      byStatus: stats,
      summary: {
        pending: stats.find(s => s.status === 'pending')?.count || 0,
        inProgress: stats.find(s => s.status === 'in_progress')?.count || 0,
        completed: stats.find(s => s.status === 'completed')?.count || 0
      }
    });
  } catch (err) {
    console.error('Failed to fetch task stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});
};
