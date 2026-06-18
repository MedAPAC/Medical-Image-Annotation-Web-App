module.exports = function registerAnnotationRoutes(app, context) {
  const {
    authenticateToken,
    upload,
    annotationsCollection,
    canUserAccessTaskId,
    broadcastAnnotationUpdate,
    backupAnnotationSnapshotToDrive,
  } = context;
app.post("/upload", authenticateToken, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ 
    filename: req.file.filename, 
    originalName: req.file.originalname,
    userId: req.user.id
  });
});

// server.js (or your routes file)

// POST: Save Annotations & Classifications
// Payload uses one-based slice keys: { taskId, filename, sliceData: { "1": { sliceNumber: 1, ... } } }
app.post("/save-annotations", authenticateToken, async (req, res) => {
  if (!annotationsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const { taskId, filename, sliceData, clientId } = req.body;

  if (!filename || !taskId) {
    return res.status(400).json({ error: "Missing filename or taskId" });
  }

  try {
    const canAccess = await canUserAccessTaskId(taskId, req.user);
    if (!canAccess) {
      return res.status(403).json({ error: "Task not found or access denied" });
    }

    const updatedAt = new Date();
    
    await annotationsCollection.updateOne(
      { 
        filename: filename, 
        taskId: taskId,
      },
      {
        $set: {
          slices: sliceData,
          userId: req.user.id,
          updatedBy: req.user.id,
          updatedByEmail: req.user.email,
          updatedAt,
        },
        $setOnInsert: {
          createdAt: updatedAt,
        },
      },
      { upsert: true }
    );

    let driveBackup = null;
    try {
      driveBackup = await backupAnnotationSnapshotToDrive({
        taskId,
        filename,
        sliceData,
        updatedAt,
        user: req.user
      });
    } catch (driveErr) {
      console.error("Google Drive annotation backup failed:", driveErr);
      driveBackup = {
        status: 'failed',
        error: driveErr.message || 'Google Drive backup failed'
      };
    }

    broadcastAnnotationUpdate(taskId, {
      taskId,
      filename,
      clientId: clientId || null,
      updatedBy: req.user.email || req.user.id,
      updatedAt: updatedAt.toISOString(),
    });

    res.json({ message: "Changes Successfully Saved!", driveBackup });
  } catch (err) {
    console.error("Failed to save annotations to DB:", err);
    res.status(500).json({ error: "Failed to Save Changes." });
  }
});

// GET: Retrieve Annotations
app.get("/annotations/:taskId", authenticateToken, async (req, res) => {
  if (!annotationsCollection) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const { taskId } = req.params;
  const { fileName } = req.query; // Expect filename in query string

  try {
    const canAccess = await canUserAccessTaskId(taskId, req.user);
    if (!canAccess) {
      return res.status(403).json({ error: "Task not found or access denied" });
    }

    const doc = await annotationsCollection.findOne(
      { 
        filename: fileName, 
        taskId: taskId,
      },
      { sort: { updatedAt: -1 } }
    );

    if (!doc) {
      // Return empty structure if new file
      return res.json({}); 
    }

    // Return the stored one-based slices map. The frontend also supports older zero-based documents.
    res.json(doc.slices || {}); 
  } catch (err) {
    console.error("Failed to fetch annotations from DB", err);
    res.status(500).json({ error: "Failed to fetch annotations" });
  }
});
};
