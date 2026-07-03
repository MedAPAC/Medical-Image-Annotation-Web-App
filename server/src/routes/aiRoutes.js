module.exports = function registerAiRoutes(app, context) {
  const { authenticateToken } = context;

  app.post('/api/ai/chat', authenticateToken, async (req, res, next) => {
    const { message } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const nimApiKey = process.env.NVIDIA_NIM_API_KEY;
    const nimUrl = process.env.NVIDIA_NIM_URL || 'https://integrate.api.nvidia.com/v1/chat/completions';
    const nimModel = process.env.NVIDIA_NIM_MODEL || 'meta/llama3-70b-instruct';

    // Mock fallback if API key is not configured (e.g. local developer mode)
    if (!nimApiKey) {
      const mockReply = `[MOCK AI ASSISTANT] You asked: "${message}". Nvidia NIM is not configured (missing NVIDIA_NIM_API_KEY). Here is some clinical guidance: ground glass opacities represent partial filling of air spaces in the lungs.`;
      return res.json({ reply: mockReply });
    }

    try {
      const response = await fetch(nimUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${nimApiKey}`
        },
        body: JSON.stringify({
          model: nimModel,
          messages: [
            {
              role: 'system',
              content: 'You are MediAnnotate Assistant, a helpful AI assistant for clinical medical image annotators. Answer medical terminology queries, explain active annotation guidelines, and help users locate application features.'
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.2,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(502).json({ error: `Nvidia NIM API error: ${errorText}` });
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || 'No response from AI assistant.';
      return res.json({ reply: content });
    } catch (error) {
      return next(error);
    }
  });
};
