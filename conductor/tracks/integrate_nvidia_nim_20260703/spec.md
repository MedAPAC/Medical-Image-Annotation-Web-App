# Specification: Nvidia NIM AI Assistant Integration

## Overview
Implement an AI-powered annotation chatbot integrated into the clinical workspace. The assistant will answer medical terminology questions, explain annotation guidelines, help annotators find what they need, and allow them to create tickets directly for the developer team. Communication will be proxied through a secure backend route to protect NIM credentials.

## Functional Requirements
1. **Right Panel Chat Interface:**
   - Add a new tab `assistant` in the RightPanel.
   - Render a chat window with a message history, text input, and send button.
   - Support rich text / markdown rendering for clinical definitions.
2. **AI Assistance Capabilities:**
   - Answer medical terminology queries in context of active annotation work.
   - Explain active task guidelines.
   - Help user find features in the app.
   - Trigger a "Create Developer Ticket" action button when requested, capturing chat context.
3. **Backend Proxy Routing:**
   - Implement `POST /api/ai/chat` endpoint on the Express server.
   - Forward chat queries to the configured Nvidia NIM OpenAI-compatible API (e.g., Llama-3-Instruct or equivalent NIM model).
   - Inject context-specific system prompts (app guidance, medical dictionary context).
   - Protect credentials and support API key configuration via environment variables (`NVIDIA_NIM_API_KEY`).
4. **Developer Ticket Service:**
   - Handle backend action `POST /api/tickets/create` from the chatbot to log user issue reports.

## Non-Functional Requirements
- **Security:** NIM API keys must never be exposed to the client. All client requests must carry valid JWT auth tokens.
- **Responsiveness:** Chat inputs and loading states should render smoothly.

## Acceptance Criteria
- [ ] Users can open the Assistant tab in the RightPanel.
- [ ] Submitting a prompt sends a JWT-authenticated request to `/api/ai/chat`.
- [ ] The backend formats the prompt and forwards it to Nvidia NIM using the configured API key.
- [ ] Chatbot responses render correctly in the chat thread.
- [ ] Clickable actions (like "Create Ticket") capture chat context and successfully hit the backend ticket endpoint.
