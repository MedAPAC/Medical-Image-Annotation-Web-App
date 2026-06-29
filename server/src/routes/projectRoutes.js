module.exports = function registerProjectRoutes(app, context) {
  const {
    authenticateToken,
    ObjectId,
    fs,
    path,
    UPLOADS_ROOT,
    db,
    annotationsCollection,
    usersCollection,
    projectsCollection,
    tasksCollection,
    resolveUserIdsFromEmailsAndTeams,
    isGoogleDriveConfigured,
    sanitizeDriveName,
    extractDriveFolderId,
    getStoredGoogleDriveConnection,
    googleDriveCreateFolder,
    googleDriveGetFile,
    ensureProjectDriveBackupFolders,
    getProjectDriveBackupStatus,
    syncProjectToDrive,
  } = context;
// Create a new project
app.post("/api/projects", authenticateToken, async (req, res) => {
  if (!projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const { name, description, labels, attributes, ownerEmails = [], ownerTeamIds = [] } = req.body;

  if (typeof name !== 'string' || !name.trim() || name.length > 200) {
    return res.status(400).json({ error: "Project name is required" });
  }

  if (
    Array.isArray(ownerEmails) && (
      ownerEmails.length > 500 || ownerEmails.some((email) => typeof email !== 'string')
    )
  ) {
    return res.status(400).json({ error: 'Invalid owner email list' });
  }
  if (
    Array.isArray(ownerTeamIds) && (
      ownerTeamIds.length > 500 || ownerTeamIds.some((id) => typeof id !== 'string')
    )
  ) {
    return res.status(400).json({ error: 'Invalid owner team list' });
  }
  if ((Array.isArray(labels) && labels.length > 1000) || (Array.isArray(attributes) && attributes.length > 1000)) {
    return res.status(400).json({ error: 'Project configuration is too large' });
  }
  if (description !== undefined && (typeof description !== 'string' || description.length > 10000)) {
    return res.status(400).json({ error: 'Invalid project description' });
  }
  if (!Array.isArray(ownerEmails) || !Array.isArray(ownerTeamIds)) {
    return res.status(400).json({ error: "ownerEmails and ownerTeamIds must be arrays" });
  }

  try {
    // Validate and get owner IDs if provided
    let owners = [req.user.id]; // Creator is always an owner
    if (ownerEmails.length > 0 || ownerTeamIds.length > 0) {
      const additionalOwnerIds = await resolveUserIdsFromEmailsAndTeams({
        emails: ownerEmails,
        teamIds: ownerTeamIds,
        user: req.user
      });
      owners = [...owners, ...additionalOwnerIds];
    }

    const newProject = {
      name: name.trim(),
      description: description || "",
      labels: Array.isArray(labels) ? labels : [],
      attributes: Array.isArray(attributes) ? attributes : [],
      userId: req.user.id, // Primary creator/owner
      owners: [...new Set(owners)], // Remove duplicates
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "active",
      tasks: 0, // Initialize task count
      progress: 0
    };

    const result = await projectsCollection.insertOne(newProject);
    
    res.json({
      message: "Project created successfully",
      project: {
        id: result.insertedId,
        ...newProject
      }
    });
  } catch (err) {
    console.error("Failed to create project:", err);
    res.status(err.status || 500).json({ error: err.message || "Failed to create project. Please try again." });
  }
});

// Get all projects accessible to user (owned or shared)
app.get("/api/projects", authenticateToken, async (req, res) => {
  if (!projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    const projects = await projectsCollection
      .find({
        $or: [
          { userId: req.user.id },
          { owners: req.user.id }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();
    
    // Get user details for owners
    const projectsWithOwnerDetails = await Promise.all(
      projects.map(async (project) => {
        const ownerDetails = [];
        for (const ownerId of project.owners || []) {
          const user = await usersCollection.findOne(
            { _id: new ObjectId(ownerId) },
            { projection: { name: 1, email: 1 } }
          );
          if (user) {
            ownerDetails.push({
              id: user._id,
              name: user.name,
              email: user.email
            });
          }
        }
        
        return {
          ...project,
          ownerDetails
        };
      })
    );
    
    res.json({ projects: projectsWithOwnerDetails });
  } catch (err) {
    console.error("Failed to fetch projects:", err);
    res.status(500).json({ error: "Failed to fetch projects. Please try again." });
  }
});

// Get a single project by ID
app.get("/api/projects/:id", authenticateToken, async (req, res) => {
  if (!projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    const project = await projectsCollection.findOne({
      _id: new ObjectId(req.params.id),
      $or: [
        { userId: req.user.id },
        { owners: req.user.id }
      ]
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found or access denied" });
    }

    // Get owner details
    const ownerDetails = [];
    for (const ownerId of project.owners || []) {
      const user = await usersCollection.findOne(
        { _id: new ObjectId(ownerId) },
        { projection: { name: 1, email: 1 } }
      );
      if (user) {
        ownerDetails.push({
          id: user._id,
          name: user.name,
          email: user.email
        });
      }
    }

    res.json({ 
      project: {
        ...project,
        ownerDetails
      }
    });
  } catch (err) {
    console.error("Failed to fetch project:", err);
    if (err.name === 'BSONTypeError') {
      return res.status(400).json({ error: "Invalid Project ID format." });
    }
    res.status(500).json({ error: "Failed to fetch project. Please try again." });
  }
});

app.post("/api/projects/:id/drive-backup/enable", authenticateToken, async (req, res) => {
  if (!projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  if (!isGoogleDriveConfigured()) {
    return res.status(400).json({
      error: "Google Drive is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI on the server."
    });
  }

  try {
    const project = await projectsCollection.findOne({
      _id: new ObjectId(req.params.id),
      owners: req.user.id
    });

    if (!project) {
      return res.status(403).json({ error: "You don't have permission to manage Drive backup for this project" });
    }

    const connection = await getStoredGoogleDriveConnection(req.user.id);
    if (!connection?.refreshToken) {
      return res.status(400).json({ error: "Connect Google Drive before enabling project backup." });
    }

    const requestedFolderId = extractDriveFolderId(req.body?.folderId);
    const requestedParentFolderId = extractDriveFolderId(req.body?.parentFolderId);
    const folderName = sanitizeDriveName(
      req.body?.folderName || `Medical Annotation - ${project.name}`,
      `Medical Annotation - ${project._id}`
    );

    let folder;
    if (requestedFolderId) {
      folder = await googleDriveGetFile(req.user.id, requestedFolderId, 'id,name,mimeType,webViewLink');
      if (folder.mimeType !== 'application/vnd.google-apps.folder') {
        return res.status(400).json({ error: "The provided Google Drive ID is not a folder." });
      }
    } else {
      if (requestedParentFolderId) {
        const parentFolder = await googleDriveGetFile(req.user.id, requestedParentFolderId, 'id,name,mimeType');
        if (parentFolder.mimeType !== 'application/vnd.google-apps.folder') {
          return res.status(400).json({ error: "The provided parent Google Drive ID is not a folder." });
        }
      }
      folder = await googleDriveCreateFolder(req.user.id, {
        name: folderName,
        parentId: requestedParentFolderId || undefined
      });
    }

    const driveBackup = {
      enabled: true,
      folderId: folder.id,
      folderName: folder.name || folderName,
      folderWebViewLink: folder.webViewLink || '',
      connectedBy: req.user.id,
      connectedEmail: connection.googleEmail || req.user.email,
      subfolders: {},
      createdAt: project.driveBackup?.createdAt || new Date(),
      updatedAt: new Date(),
      lastError: ''
    };

    await projectsCollection.updateOne(
      { _id: project._id },
      { $set: { driveBackup, updatedAt: new Date() } }
    );

    const updatedProject = await projectsCollection.findOne({ _id: project._id });
    const ensuredBackup = await ensureProjectDriveBackupFolders(updatedProject);

    res.json({
      message: "Google Drive backup enabled",
      driveBackup: {
        ...getProjectDriveBackupStatus({ driveBackup: ensuredBackup }),
        folderId: folder.id,
        folderName: folder.name || folderName,
        folderWebViewLink: folder.webViewLink || ''
      }
    });
  } catch (err) {
    console.error("Failed to enable Google Drive backup:", err);
    res.status(err.status || 500).json({ error: err.message || "Failed to enable Google Drive backup" });
  }
});

app.post("/api/projects/:id/drive-backup/disable", authenticateToken, async (req, res) => {
  if (!projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    const project = await projectsCollection.findOne({
      _id: new ObjectId(req.params.id),
      owners: req.user.id
    });

    if (!project) {
      return res.status(403).json({ error: "You don't have permission to manage Drive backup for this project" });
    }

    await projectsCollection.updateOne(
      { _id: project._id },
      {
        $set: {
          'driveBackup.enabled': false,
          'driveBackup.updatedAt': new Date(),
          updatedAt: new Date()
        }
      }
    );

    res.json({ message: "Google Drive backup disabled" });
  } catch (err) {
    console.error("Failed to disable Google Drive backup:", err);
    res.status(err.status || 500).json({ error: err.message || "Failed to disable Google Drive backup" });
  }
});

app.post("/api/projects/:id/drive-backup/sync", authenticateToken, async (req, res) => {
  if (!projectsCollection || !tasksCollection || !annotationsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    const project = await projectsCollection.findOne({
      _id: new ObjectId(req.params.id),
      owners: req.user.id
    });

    if (!project) {
      return res.status(403).json({ error: "You don't have permission to sync Drive backup for this project" });
    }

    const summary = await syncProjectToDrive(project);
    const updatedProject = await projectsCollection.findOne({ _id: project._id });

    res.json({
      message: summary.failures.length > 0
        ? "Google Drive sync completed with warnings"
        : "Google Drive sync completed",
      summary,
      driveBackup: getProjectDriveBackupStatus(updatedProject)
    });
  } catch (err) {
    console.error("Failed to sync Google Drive backup:", err);
    await projectsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { 'driveBackup.lastError': err.message || 'Sync failed', 'driveBackup.updatedAt': new Date() } }
    ).catch(() => {});
    res.status(err.status || 500).json({ error: err.message || "Failed to sync Google Drive backup" });
  }
});

// Update a project (only owners can update)
app.put("/api/projects/:id", authenticateToken, async (req, res) => {
  if (!projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const { name, description, labels, attributes, status, ownerEmails, ownerTeamIds } = req.body;

  if (name !== undefined && (typeof name !== 'string' || !name.trim() || name.length > 200)) {
    return res.status(400).json({ error: 'Invalid project name' });
  }
  if (description !== undefined && (typeof description !== 'string' || description.length > 10000)) {
    return res.status(400).json({ error: 'Invalid project description' });
  }
  if ((Array.isArray(labels) && labels.length > 1000) || (Array.isArray(attributes) && attributes.length > 1000)) {
    return res.status(400).json({ error: 'Project configuration is too large' });
  }

  try {
    // Check if user is an owner of the project
    const project = await projectsCollection.findOne({
      _id: new ObjectId(req.params.id),
      owners: req.user.id
    });

    if (!project) {
      return res.status(403).json({ error: "You don't have permission to update this project" });
    }

    const updateData = {
      updatedAt: new Date()
    };

    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    
    if (labels !== undefined && Array.isArray(labels)) {
      updateData.labels = labels;
    }
    
    if (attributes !== undefined && Array.isArray(attributes)) {
      updateData.attributes = attributes;
    }
    
    if (status) updateData.status = status;

    // Handle owner updates if provided
    if (ownerEmails !== undefined || ownerTeamIds !== undefined) {
      if (ownerEmails !== undefined && !Array.isArray(ownerEmails)) {
        return res.status(400).json({ error: "ownerEmails must be an array" });
      }
      if (ownerTeamIds !== undefined && !Array.isArray(ownerTeamIds)) {
        return res.status(400).json({ error: "ownerTeamIds must be an array" });
      }
      
      // Always include the original creator
      const owners = [project.userId];
      const additionalOwnerIds = await resolveUserIdsFromEmailsAndTeams({
        emails: ownerEmails || [],
        teamIds: ownerTeamIds || [],
        user: req.user
      });
      owners.push(...additionalOwnerIds);
      
      updateData.owners = [...new Set(owners)]; // Remove duplicates
    }

    const result = await projectsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Project not found or no changes made" });
    }

    res.json({ message: "Project updated successfully" });
  } catch (err) {
    console.error("Failed to update project:", err);
    if (err.name === 'BSONTypeError') {
      return res.status(400).json({ error: "Invalid Project ID format." });
    }
    res.status(err.status || 500).json({ error: err.message || "Failed to update project. Please try again." });
  }
});

// Add owners to a project
app.post("/api/projects/:id/owners", authenticateToken, async (req, res) => {
  if (!projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const { emails = [], teamIds = [] } = req.body;

  if (!Array.isArray(emails) || !Array.isArray(teamIds)) {
    return res.status(400).json({ error: "emails and teamIds must be arrays" });
  }

  if (emails.length === 0 && teamIds.length === 0) {
    return res.status(400).json({ error: "Please provide email addresses or team IDs" });
  }

  try {
    // Check if user is an owner of the project
    const project = await projectsCollection.findOne({
      _id: new ObjectId(req.params.id),
      owners: req.user.id
    });

    if (!project) {
      return res.status(403).json({ error: "You don't have permission to manage owners for this project" });
    }

    // Get user IDs for explicit emails and selected owned team members
    const newOwnerIds = await resolveUserIdsFromEmailsAndTeams({
      emails,
      teamIds,
      user: req.user
    });
    
    // Add new owners to the project
    const result = await projectsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $addToSet: { owners: { $each: newOwnerIds } },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ 
      message: "Owners added successfully",
      addedCount: newOwnerIds.length
    });
  } catch (err) {
    console.error("Failed to add owners:", err);
    res.status(err.status || 500).json({ error: err.message || "Failed to add owners. Please try again." });
  }
});

// Remove owners from a project
app.delete("/api/projects/:id/owners", authenticateToken, async (req, res) => {
  if (!projectsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const { ownerId } = req.body;

  if (!ownerId) {
    return res.status(400).json({ error: "Owner ID is required" });
  }

  try {
    // Check if user is an owner of the project and not trying to remove themselves
    const project = await projectsCollection.findOne({
      _id: new ObjectId(req.params.id),
      owners: req.user.id
    });

    if (!project) {
      return res.status(403).json({ error: "You don't have permission to manage owners for this project" });
    }

    // Don't allow removing the original creator
    if (ownerId === project.userId.toString()) {
      return res.status(400).json({ error: "Cannot remove the original creator from project owners" });
    }

    // Don't allow removing yourself
    if (ownerId === req.user.id) {
      return res.status(400).json({ error: "Cannot remove yourself from project owners" });
    }

    const result = await projectsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $pull: { owners: ownerId },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Project not found or owner not in list" });
    }

    res.json({ message: "Owner removed successfully" });
  } catch (err) {
    console.error("Failed to remove owner:", err);
    res.status(500).json({ error: "Failed to remove owner. Please try again." });
  }
});

// Delete a project (only owners can delete)
app.delete("/api/projects/:id", authenticateToken, async (req, res) => {
  if (!projectsCollection || !tasksCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    // Check if user is an owner of the project
    const project = await projectsCollection.findOne({
      _id: new ObjectId(req.params.id),
      owners: req.user.id
    });

    if (!project) {
      return res.status(403).json({ error: "You don't have permission to delete this project" });
    }

    // Delete all tasks associated with this project
    const tasks = await tasksCollection.find({ projectId: req.params.id }).toArray();
    
    // Delete uploaded files for each task
    for (const task of tasks) {
      if (task.files && task.files.length > 0) {
        const uploadDir = path.resolve(UPLOADS_ROOT, 'tasks', String(task._id));
        if (fs.existsSync(uploadDir)) {
          fs.rmSync(uploadDir, { recursive: true, force: true });
        }
      }
    }
    
    const taskIds = tasks.map((task) => String(task._id));
    if (taskIds.length > 0) {
      await Promise.all([
        annotationsCollection.deleteMany({ taskId: { $in: taskIds } }),
        db.collection('taskTimersCollection').deleteMany({ taskId: { $in: taskIds } }),
      ]);
    }

    // Delete tasks from database
    await tasksCollection.deleteMany({ projectId: req.params.id });

    // Delete project
    const result = await projectsCollection.deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ message: "Project and all associated tasks deleted successfully" });
  } catch (err) {
    console.error("Failed to delete project:", err);
    if (err.name === 'BSONTypeError') {
      return res.status(400).json({ error: "Invalid Project ID format." });
    }
    res.status(500).json({ error: "Failed to delete project. Please try again." });
  }
});
};
