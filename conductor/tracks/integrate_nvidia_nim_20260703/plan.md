# Implementation Plan - Nvidia NIM AI Assistant Integration

This document outlines the phased plan to implement the Nvidia NIM AI assistant chatbot.

## Phase 1: Backend proxy route and Nvidia NIM Service [checkpoint: e10c10a]
- [x] Task: Backend AI Chat Route [2865a04]
    - [x] Write integration tests for `POST /api/ai/chat` verifying authentication, payload validation, and forwarding
    - [x] Implement backend proxy route `POST /api/ai/chat` using native fetch to call Nvidia NIM API
    - [x] Verify that Nvidia NIM API keys are retrieved securely from environment variables
- [x] Task: Developer Ticket Logging Service [268ba86]
    - [x] Write integration tests for `POST /api/tickets/create` verifying schema validation and database insertion
    - [x] Implement Express route `POST /api/tickets/create` to store issue reports in MongoDB
    - [x] Verify ticket collection records save successfully with audit logs
- [x] Task: Conductor - User Manual Verification 'Backend proxy route and Nvidia NIM Service' (Protocol in workflow.md)

## Phase 2: React RightPanel Chat Interface and States [checkpoint: TBD]
- [x] Task: UI Chat Tab and Messaging Layout [017dce0]
    - [x] Write component tests for rendering chat messages, inputs, and tab navigation
    - [x] Add the `assistant` panel tab in `RightPanel.jsx` and `ToolbarRight.jsx`
    - [x] Implement scrollable message thread list with Markdown parser support
    - [x] Verify that chat tab opens and layout renders correctly
- [ ] Task: Chat state handlers and Backend API Integration
    - [ ] Write unit tests for chatbot message history state updates and API requests
    - [ ] Implement text input state handlers and POST chat submit action
    - [ ] Verify message requests successfully hit `/api/ai/chat` and update history state
- [ ] Task: Conductor - User Manual Verification 'React RightPanel Chat Interface and States' (Protocol in workflow.md)

## Phase 3: Guidelines, App Help, and Developer Ticket Actions [checkpoint: TBD]
- [ ] Task: App context injection and Ticket buttons
    - [ ] Write tests for developer ticket actions and active task context injection
    - [ ] Inject active task guidelines and medical definitions into backend system prompts
    - [ ] Add interactive ticket generation button in the chat thread when requested by LLM
    - [ ] Verify ticket creation round-trip successfully calls the ticket endpoint and creates records in MongoDB
- [ ] Task: Conductor - User Manual Verification 'Guidelines, App Help, and Developer Ticket Actions' (Protocol in workflow.md)
