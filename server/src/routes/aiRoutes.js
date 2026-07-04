const MEDICAL_DICTIONARY = {
  'ground glass opacity': 'Ground-glass opacity (GGO) is a finding on chest CT scans that represents partial filling of air spaces in the lungs, partial collapse of alveoli, or interstitial thickening.',
  'ggo': 'Ground-glass opacity (GGO) is a finding on chest CT scans that represents partial filling of air spaces in the lungs, partial collapse of alveoli, or interstitial thickening.',
  'consolidation': 'Consolidation occurs when the air in the alveoli is replaced by fluid, pus, blood, or cells, appearing as a homogeneous increase in lung attenuation.',
  'pleural effusion': 'Pleural effusion is an abnormal accumulation of fluid in the pleural space, the area between the layers of the tissue that lines the lungs and the chest cavity.',
  'nodule': 'A lung nodule is a small, roundish growth (less than 3 cm in diameter) in the lung, which may be benign or malignant.',
  'mass': 'A lung mass is a large growth (greater than 3 cm in diameter) in the lung, which has a higher likelihood of malignancy than a nodule.'
};

module.exports = function registerAiRoutes(app, context) {
  const { authenticateToken } = context;

  app.post('/api/ai/chat', authenticateToken, async (req, res, next) => {
    const { message, taskDescription, taskLabels } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const nimApiKey = process.env.NVIDIA_NIM_API_KEY;
    const nimUrl = process.env.NVIDIA_NIM_URL || 'https://integrate.api.nvidia.com/v1/chat/completions';
    const nimModel = process.env.NVIDIA_NIM_MODEL || 'meta/llama3-70b-instruct';

    // Build context
    let contextPrompt = '';
    if (taskDescription) {
      contextPrompt += `Active Task Guidelines:\n${taskDescription}\n\n`;
    }
    if (taskLabels) {
      contextPrompt += `Active Task Labels:\n${taskLabels}\n\n`;
    }

    // Match medical terminology definitions
    const matchedTerms = [];
    const lowerMessage = message.toLowerCase();
    for (const [term, def] of Object.entries(MEDICAL_DICTIONARY)) {
      if (lowerMessage.includes(term)) {
        matchedTerms.push(`${term.toUpperCase()}: ${def}`);
      }
    }
    if (matchedTerms.length > 0) {
      contextPrompt += `Relevant Medical Definitions:\n${matchedTerms.join('\n')}\n\n`;
    }

    // System prompt construction
    const systemPrompt = `You are MediAnnotate Assistant, a helpful AI assistant for clinical medical image annotators. Answer medical terminology queries, explain active annotation guidelines, and help users locate application features.
Use the following context to help answer the user query:
${contextPrompt}
If the user asks about an issue, bug, or requests to create a developer ticket, include '[action:create_ticket]' at the end of your response to offer the user a ticket creation shortcut.`;

    // Mock fallback if API key is not configured (e.g. local developer mode)
    if (!nimApiKey) {
      let mockReply = `[MOCK AI ASSISTANT] You asked: "${message}". Nvidia NIM is not configured (missing NVIDIA_NIM_API_KEY). `;
      if (matchedTerms.length > 0) {
        mockReply += `Clinical definitions:\n${matchedTerms.join('\n')} `;
      }
      if (lowerMessage.includes('ticket') || lowerMessage.includes('bug') || lowerMessage.includes('issue')) {
        mockReply += `I noticed you mentioned an issue or ticket. [action:create_ticket]`;
      }
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
              content: systemPrompt
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
