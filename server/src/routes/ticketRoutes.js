module.exports = function registerTicketRoutes(app, context) {
  const { authenticateToken, ticketsCollection } = context;

  app.post('/api/tickets/create', authenticateToken, async (req, res, next) => {
    const { title, description, chatContext } = req.body || {};

    if (!title || typeof title !== 'string' || !description || typeof description !== 'string') {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    if (!ticketsCollection) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    try {
      const doc = {
        title,
        description,
        chatContext,
        userId: req.user.id,
        createdAt: new Date()
      };

      const result = await ticketsCollection.insertOne(doc);
      return res.json({
        message: 'Ticket created successfully',
        ticketId: result.insertedId
      });
    } catch (error) {
      return next(error);
    }
  });
};
