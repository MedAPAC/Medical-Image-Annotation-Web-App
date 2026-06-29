module.exports = function registerAnnotationRoutes(app, context) {
  const {
    authenticateToken,
    upload,
    crypto,
    ObjectId,
    annotationsCollection,
    canUserAccessTaskId,
    broadcastAnnotationUpdate,
    backupAnnotationSnapshotToDrive,
    hashFile,
  } = context;

  const hashAnnotationData = (sliceData) => crypto
    .createHash('sha256')
    .update(JSON.stringify(sliceData || {}))
    .digest('hex');

  app.post('/upload', authenticateToken, upload.single('file'), async (req, res, next) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    try {
      const sha256 = await hashFile(req.file.path);
      return res.json({
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        sha256,
        userId: req.user.id,
      });
    } catch (error) {
      return next(error);
    }
  });

  app.post('/save-annotations', authenticateToken, async (req, res) => {
    if (!annotationsCollection) return res.status(500).json({ error: 'Database not initialized' });

    const { taskId, filename, sliceData, clientId } = req.body || {};
    if (
      !ObjectId.isValid(taskId) ||
      typeof filename !== 'string' ||
      !filename.trim() ||
      filename.length > 512 ||
      !sliceData ||
      typeof sliceData !== 'object' ||
      Array.isArray(sliceData)
    ) {
      return res.status(400).json({ error: 'Invalid annotation payload' });
    }

    try {
      const canAccess = await canUserAccessTaskId(taskId, req.user);
      if (!canAccess) return res.status(403).json({ error: 'Task not found or access denied' });

      const updatedAt = new Date();
      const integrityHash = hashAnnotationData(sliceData);
      const updateResult = await annotationsCollection.findOneAndUpdate(
        { filename, taskId },
        {
          $set: {
            slices: sliceData,
            updatedBy: String(req.user.id),
            updatedAt,
            integrity: { algorithm: 'sha256', hash: integrityHash },
          },
          $setOnInsert: {
            createdBy: String(req.user.id),
            createdAt: updatedAt,
          },
          $inc: { revision: 1 },
        },
        { upsert: true, returnDocument: 'after' }
      );

      let driveBackup = null;
      try {
        driveBackup = await backupAnnotationSnapshotToDrive({
          taskId,
          filename,
          sliceData,
          updatedAt,
          integrityHash,
          user: req.user,
        });
      } catch (driveError) {
        console.error('Google Drive annotation backup failed:', driveError);
        driveBackup = { status: 'failed', error: 'Google Drive backup failed' };
      }

      broadcastAnnotationUpdate(taskId, {
        taskId,
        filename,
        clientId: typeof clientId === 'string' ? clientId.slice(0, 128) : null,
        updatedBy: req.user.name || req.user.email || req.user.id,
        updatedAt: updatedAt.toISOString(),
        revision: updateResult?.revision || null,
      });

      return res.json({
        message: 'Changes Successfully Saved!',
        revision: updateResult?.revision || null,
        integrity: { algorithm: 'sha256', hash: integrityHash },
        driveBackup,
      });
    } catch (error) {
      console.error('Failed to save annotations to DB:', error);
      return res.status(500).json({ error: 'Failed to Save Changes.' });
    }
  });

  app.get('/annotations/:taskId', authenticateToken, async (req, res) => {
    if (!annotationsCollection) return res.status(500).json({ error: 'Database not initialized' });
    const { taskId } = req.params;
    const fileName = typeof req.query.fileName === 'string' ? req.query.fileName : '';
    if (!ObjectId.isValid(taskId) || !fileName || fileName.length > 512) {
      return res.status(400).json({ error: 'Invalid annotation request' });
    }

    try {
      const canAccess = await canUserAccessTaskId(taskId, req.user);
      if (!canAccess) return res.status(403).json({ error: 'Task not found or access denied' });

      const document = await annotationsCollection.findOne(
        { filename: fileName, taskId },
        { projection: { slices: 1, integrity: 1 } }
      );
      if (!document) return res.json({});

      if (document.integrity?.hash) {
        const actualHash = hashAnnotationData(document.slices || {});
        if (actualHash !== document.integrity.hash) {
          console.error(`Annotation integrity verification failed for task ${taskId}.`);
          return res.status(409).json({ error: 'Annotation integrity verification failed' });
        }
      }
      return res.json(document.slices || {});
    } catch (error) {
      console.error('Failed to fetch annotations from DB:', error);
      return res.status(500).json({ error: 'Failed to fetch annotations' });
    }
  });
};
