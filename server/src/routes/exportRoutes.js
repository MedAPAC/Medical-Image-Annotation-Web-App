const { ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { ZipArchive } = require('archiver');
const { UPLOADS_ROOT } = require('../config/constants');
const { resolveTaskFilePath } = require('../utils/storedFiles');
const {
  convertToYolo,
  convertToCoco,
  convertToPascalVoc,
  parseCustomTemplate
} = require('../utils/exportConverters');

function registerExportRoutes(app, context) {
  const {
    authenticateToken,
    projectsCollection,
    tasksCollection,
    annotationsCollection,
    googleDriveService
  } = context;

  app.post('/api/export/dataset', authenticateToken, async (req, res, next) => {
    try {
      const { projectId, taskId, format, includeImages, syncToDrive, customTemplate, filters } = req.body || {};

      if (!projectId && !taskId) {
        return res.status(400).json({ error: 'Either projectId or taskId is required' });
      }

      if (!format) {
        return res.status(400).json({ error: 'Export format is required' });
      }

      // 1. Resolve project and tasks list
      let project;
      let tasks = [];

      if (taskId) {
        const queryId = ObjectId.isValid(taskId) ? new ObjectId(taskId) : taskId;
        const resolvedTask = await tasksCollection.findOne({ _id: queryId });
        if (!resolvedTask) return res.status(404).json({ error: 'Task not found' });
        tasks = [resolvedTask];
        const projQueryId = ObjectId.isValid(resolvedTask.projectId) ? new ObjectId(resolvedTask.projectId) : resolvedTask.projectId;
        project = await projectsCollection.findOne({ _id: projQueryId });
      } else {
        const queryId = ObjectId.isValid(projectId) ? new ObjectId(projectId) : projectId;
        project = await projectsCollection.findOne({ _id: queryId });
        if (!project) return res.status(404).json({ error: 'Project not found' });
        tasks = await tasksCollection.find({ projectId: projectId.toString() }).toArray();
      }

      const labelOptions = project?.labels || [];

      // Apply filters on tasks (e.g. status)
      let filteredTasks = tasks;
      if (filters?.status) {
        filteredTasks = tasks.filter(t => t.status === filters.status);
      }

      // 2. Set up archiver
      const archive = new ZipArchive({ zlib: { level: 9 } });
      const buffers = [];
      archive.on('data', data => buffers.push(data));

      const archivePromise = new Promise((resolve, reject) => {
        archive.on('end', () => resolve(Buffer.concat(buffers)));
        archive.on('error', err => reject(err));
      });

      // 3. Process each task and append files to the zip
      const cocoImagesList = [];
      const cocoAnnotationsList = [];

      for (const task of filteredTasks) {
        // Find annotation documents for this task
        const annotationDocs = await annotationsCollection.find({ taskId: task._id.toString() }).toArray();

        for (const file of task.files || []) {
          const doc = annotationDocs.find(d => d.filename === file.filename);
          if (!doc || !doc.slices) continue;

          // Extract annotations
          const shapes = [];
          Object.entries(doc.slices).forEach(([sliceIndex, list]) => {
            if (!Array.isArray(list)) return;
            list.forEach(shape => {
              // Apply label filters if specified
              if (filters?.labels && filters.labels.length > 0) {
                if (!filters.labels.includes(shape.label)) return;
              }
              shapes.push({
                ...shape,
                sliceIndex,
                id: shape.id || `ann-${task._id}-${sliceIndex}-${shapes.length}`,
                imageId: task._id.toString()
              });
            });
          });

          if (shapes.length === 0) continue;

          // Resolve image dimensions
          const imageWidth = file.width || doc.width || 500;
          const imageHeight = file.height || doc.height || 500;

          // Pack image if includeImages is true and it exists on disk
          if (includeImages) {
            try {
              const filePath = resolveTaskFilePath(UPLOADS_ROOT, task._id.toString(), file);
              if (fs.existsSync(filePath)) {
                archive.append(fs.createReadStream(filePath), { name: `images/${file.filename}` });
              }
            } catch (e) {
              // Ignore file resolving errors during tests
            }
          }

          // Generate annotations files
          if (format === 'YOLO') {
            const yoloContent = convertToYolo(shapes, labelOptions, imageWidth, imageHeight);
            const baseName = path.basename(file.filename, path.extname(file.filename));
            archive.append(yoloContent, { name: `annotations/${baseName}.txt` });
          } else if (format === 'Pascal VOC') {
            const xmlContent = convertToPascalVoc(shapes, imageWidth, imageHeight, file.filename);
            const baseName = path.basename(file.filename, path.extname(file.filename));
            archive.append(xmlContent, { name: `annotations/${baseName}.xml` });
          } else if (format === 'CUSTOM') {
            if (!customTemplate) {
              return res.status(400).json({ error: 'Custom template string is required for custom export format' });
            }
            const customLines = shapes.map(shape =>
              parseCustomTemplate(customTemplate, shape, {
                filename: file.filename,
                width: imageWidth,
                height: imageHeight
              })
            ).join('\n');
            const baseName = path.basename(file.filename, path.extname(file.filename));
            archive.append(customLines, { name: `annotations/${baseName}.txt` });
          } else if (format === 'COCO') {
            cocoImagesList.push({
              id: task._id.toString(),
              filename: file.filename,
              width: imageWidth,
              height: imageHeight
            });
            shapes.forEach(sh => {
              cocoAnnotationsList.push(sh);
            });
          }
        }
      }

      // Add YOLO companion files
      if (format === 'YOLO') {
        const classesContent = labelOptions.map(opt => opt.name).join('\n');
        archive.append(classesContent, { name: 'classes.txt' });
      }

      // Generate single COCO JSON file
      if (format === 'COCO') {
        const cocoObj = convertToCoco(cocoAnnotationsList, labelOptions, cocoImagesList);
        archive.append(JSON.stringify(cocoObj, null, 2), { name: 'annotations.json' });
      }

      // Finalize the archive stream
      archive.finalize();

      const zipBuffer = await archivePromise;

      const exportFilename = `${project?.name || 'project'}-export-${Date.now()}.zip`;

      // 4. Deliver ZIP buffer
      if (syncToDrive) {
        if (!googleDriveService) {
          return res.status(400).json({ error: 'Google Drive service is not initialized' });
        }
        const driveResult = await googleDriveService.syncProjectExportToDrive(
          project?._id?.toString() || projectId,
          zipBuffer,
          exportFilename
        );
        return res.json({
          message: 'Export synced to Google Drive successfully',
          link: driveResult.webViewLink
        });
      } else {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${exportFilename}"`);
        return res.send(zipBuffer);
      }
    } catch (error) {
      return next(error);
    }
  });
}

module.exports = registerExportRoutes;
