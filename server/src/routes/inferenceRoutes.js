module.exports = function registerInferenceRoutes(app, context) {
  const { authenticateToken } = context;

  app.post('/api/inference/predict', authenticateToken, async (req, res, next) => {
    const { prompt, imageContext } = req.body || {};

    if (!prompt || typeof prompt !== 'object' || !prompt.type) {
      return res.status(400).json({ error: 'Invalid prompt payload' });
    }

    try {
      const { width = 512, height = 512 } = imageContext || {};

      if (prompt.type === 'point') {
        const { x, y } = prompt;
        if (typeof x !== 'number' || typeof y !== 'number') {
          return res.status(400).json({ error: 'Invalid prompt coordinates' });
        }
        // Return a mock polygon surrounding the point
        const points = [
          { x: Math.max(0, x - 30), y: Math.max(0, y - 30) },
          { x: Math.min(width, x + 30), y: Math.max(0, y - 30) },
          { x: Math.min(width, x + 30), y: Math.min(height, y + 30) },
          { x: Math.max(0, x - 30), y: Math.min(height, y + 30) }
        ];
        return res.json({
          type: 'polygon',
          points
        });
      } else if (prompt.type === 'box') {
        const { x1, y1, x2, y2 } = prompt;
        if (
          typeof x1 !== 'number' ||
          typeof y1 !== 'number' ||
          typeof x2 !== 'number' ||
          typeof y2 !== 'number'
        ) {
          return res.status(400).json({ error: 'Invalid bounding box coordinates' });
        }
        // Return a mock polygon inside the box
        const padX = (x2 - x1) * 0.1;
        const padY = (y2 - y1) * 0.1;
        const points = [
          { x: x1 + padX, y: y1 + padY },
          { x: x2 - padX, y: y1 + padY },
          { x: x2 - padX, y: y2 - padY },
          { x: x1 + padX, y: y2 - padY }
        ];
        return res.json({
          type: 'polygon',
          points
        });
      } else if (prompt.type === 'text') {
        const { text } = prompt;
        if (typeof text !== 'string') {
          return res.status(400).json({ error: 'Invalid text prompt' });
        }
        const textVal = text.toLowerCase();
        const labels = [`mock-label-${textVal || 'generic'}`];
        return res.json({
          type: 'classification',
          labels
        });
      }

      return res.status(400).json({ error: 'Unsupported prompt type' });
    } catch (error) {
      return next(error);
    }
  });
};
