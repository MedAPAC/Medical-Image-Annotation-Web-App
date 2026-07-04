# Implementation Plan - Imitation Learning Telemetry Tracker

This document outlines the phased plan to implement the Imitation Learning Telemetry Tracker.

## Phase 1: Telemetry Backend Logging and File Storage [checkpoint: TBD]
- [ ] Task: Telemetry API Route and File Handlers
    - [ ] Write integration tests for `POST /api/annotation-events/:taskId/telemetry` verifying file appending
    - [ ] Implement Express route `POST /api/annotation-events/:taskId/telemetry` to append events to `.telemetry.jsonl`
    - [ ] Ensure that path traversal is prevented and files are written only within the task's upload directory
- [ ] Task: Integration with Dataset Exporter
    - [ ] Write unit tests for including `.telemetry.jsonl` files in dataset ZIP exports
    - [ ] Update the dataset ZIP packaging logic to bundle telemetry files when annotations are exported
- [ ] Task: Conductor - User Manual Verification 'Telemetry Backend Logging and File Storage' (Protocol in workflow.md)

## Phase 2: Client Telemetry Capturer and Opt-In UI Modal [checkpoint: TBD]
- [ ] Task: Consent Modal and Visual Indicators
    - [ ] Write unit tests for `ConsentModal.jsx` render and callback states
    - [ ] Implement `ConsentModal.jsx` to request tracking approval before loading workspace
    - [ ] Add blinking recording indicator badge in the Annotation Workspace header when consent is granted
- [ ] Task: Client Telemetry Tracker Hook
    - [ ] Write component tests for capturing, throttling, and posting mouse trajectories and actions
    - [ ] Implement tracker logic to capture tool selection, contrast, slice change, zoom/pan events
    - [ ] Implement canvas event tracking for normalized coordinates mapping to image space
    - [ ] Add buffering and posting mechanism to send events periodically to the backend
- [ ] Task: Conductor - User Manual Verification 'Client Telemetry Capturer and Opt-In UI Modal' (Protocol in workflow.md)
