# Specification: Imitation Learning Telemetry Tracker

## Overview
Implement an annotation telemetry system that monitors and records expert behaviors inside the annotation workspace for imitation learning. The system captures the annotator's trajectory (mouse path, clicks, timing) and command choices (zoom level, slice scrolls, contrast adjustments, active drawing tools) at a configurable frequency. Telemetry data is saved in structured JSONL files alongside raw task files to avoid database bloat.

## Functional Requirements
1. **Interactive Event Tracking (Abstracted Actions)**:
   - Capture interaction actions normalized into high-level events:
     - `tool_select`: Change in active drawing tool (e.g., polygon, box).
     - `slice_change`: Scroll or slider-based navigation between slices.
     - `zoom_pan`: Zoom scale changes or pan translations.
     - `preprocess_adjust`: Adjustments to brightness, contrast, window width/level.
     - `draw_interaction`: Addition or movement of vertices on the canvas.
     - `undo_redo`: Triggers of state rollback.
   - Every event must record a relative timestamp (`dt` in milliseconds since session start).

2. **Trajectory Tracking (Mouse Paths)**:
   - Capture continuous mouse cursor coordinates `(x, y)` mapped relative to the **image space coordinate system** (preventing zoom/pan transformations from distorting the coordinates relative to the medical anatomy).
   - Log mouse button states (button down, button up, hovering).

3. **Configurable Log Frequencies**:
   - Provide administrative/project configuration options for logging:
     - **Continuous Mode**: Logs every mouse move event.
     - **Throttled Mode**: Captures coordinates at a set interval (e.g. 50ms, 100ms).
     - **Event-Driven Mode**: Records only click interactions and tool state changes.

4. **Opt-in User Prompt**:
   - Prompt the annotator with a modal dialog before opening the annotation workspace: "This task collects interaction data for training imitation learning models. Do you consent to recording?"
   - If accepted, the workspace starts recording and displays a subtle indicator badge in the header. If declined, telemetry is disabled.

5. **Storage System**:
   - Save the event stream directly as a `.telemetry.jsonl` file in the task's upload directory on the server.
   - Provide an API endpoint `POST /api/annotation-events/:taskId/telemetry` to append batch logs from the client to the task's JSONL file.

## Acceptance Criteria
- [ ] Annotators are presented with an opt-in modal before loading a task.
- [ ] Active telemetry tracking logs tool selections, slice scrolls, zoom changes, and coordinate paths.
- [ ] Mouse coordinates on the canvas are mapped to the medical image frame of reference.
- [ ] Telemetry events are stored chronologically in JSONL files on the server.
- [ ] Exporting the task includes the companion `.telemetry.jsonl` file.
