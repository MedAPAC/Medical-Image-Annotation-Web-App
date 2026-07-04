# CAVEMAN DEV LOG - MEDIANNOTATE WORK LOG

ME WRITE TIME LOG. CHRONOLOGICAL STEPS OF WHAT WE DO AND WHAT CHANGED.

---

## TRACK 1: SETUP AND AUDIT
* **Goal:** Set up conda environment, look at code files, find security gaps.
* **What Happened:**
  - Audit codebase folders. Identify Express routes and React rendering viewers.
  - Scan dependencies for vulnerabilities. Save audit details.
  - Document HMI structures and gaps. Write original [audit_report.md](file:///home/jovyan/Medical-Image-Annotation-Web-App/conductor/tracks/setup_audit_20260703/audit_report.md).

---

## TRACK 2: INTEGRATE NVIDIA NIM AI ASSISTANT
* **Goal:** Add AI assistant chatbot in workspace. Chat helps doctor and lets them log dev tickets.
* **Chronological Dev Logs:**
  1. **Backend NIM Route (Phase 1):**
     - Make `POST /api/ai/chat` proxy. Call Nvidia NIM API safely from server.
     - Make `POST /api/tickets/create` route. Store issue reports in MongoDB.
     - Verify with backend tests in `server/test/aiChat.test.js`.
  2. **React UI Chat Panel (Phase 2):**
     - Build chat panel layout component [AssistantPanel.jsx](file:///home/jovyan/Medical-Image-Annotation-Web-App/client/src/components/AssistantPanel.jsx).
     - Add markdown parser to chat messages. Add auto-scroll.
     - Put chat button on workspace toolbar. Link to right side panel [RightPanel.jsx](file:///home/jovyan/Medical-Image-Annotation-Web-App/client/src/components/RightPanel.jsx).
     - Verify with frontend tests [AssistantPanel.test.js](file:///home/jovyan/Medical-Image-Annotation-Web-App/client/src/components/AssistantPanel.test.js) and [AnnotationChat.test.js](file:///home/jovyan/Medical-Image-Annotation-Web-App/client/src/pages/AnnotationChat.test.js).
  3. **Context Injection & Tickets (Phase 3):**
     - Inject active task definitions into AI system prompts.
     - Add "Create Ticket" action button in the chat thread. Clicking it hits ticket endpoint.
     - Style chat panel to match light theme. Add typing status indicator.
     - Test ticket round-trip end-to-end.

---

## TRACK 3: DATASET EXPORT FRAMEWORK
* **Goal:** Export annotations and images to YOLO, COCO, Pascal VOC, or Custom templates. Send to local disk or Google Drive.
* **Chronological Dev Logs:**
  1. **Annotation Format Converters:**
     - Build parser helpers in [exportConverters.js](file:///home/jovyan/Medical-Image-Annotation-Web-App/server/src/utils/exportConverters.js).
     - Map Fabric.js vector geometries:
       * **YOLO**: Center X, Center Y, Width, Height (normalized 0-1) and `classes.txt`.
       * **COCO**: JSON structure with categories list, images list, annotations list.
       * **Pascal VOC**: XML document format with bounding box coordinates.
       * **Custom Template Engine**: Replace variables (`{{filename}}`, `{{label}}`, `{{x_min}}`) using simple loop engine.
     - Add format unit tests in `server/test/exportConverters.test.js`.
  2. **API Endpoint & Zip Packaging:**
     - Build `POST /api/export/dataset` route in [exportRoutes.js](file:///home/jovyan/Medical-Image-Annotation-Web-App/server/src/routes/exportRoutes.js).
     - Package export output into ZIP folder using archiver.
     - Securely sync exported ZIP to Google Drive using `googleDriveService.js` if user requests it.
     - Add endpoint tests in `server/test/exportRoutes.test.js`.
  3. **UI Export Dialog Modal:**
     - Build [ExportModal.jsx](file:///home/jovyan/Medical-Image-Annotation-Web-App/client/src/components/ExportModal.jsx) with selection settings: format dropdown, include-images toggle, label filters, custom template fields.
     - Place Export action button on:
       * Project Detail Dashboard [ProjectDetail.jsx](file:///home/jovyan/Medical-Image-Annotation-Web-App/client/src/pages/ProjectDetail.jsx).
       * Left Drawer toolbar [LeftDrawer.jsx](file:///home/jovyan/Medical-Image-Annotation-Web-App/client/src/components/LeftDrawer.jsx).
     - Verify with UI component tests [ExportModal.test.js](file:///home/jovyan/Medical-Image-Annotation-Web-App/client/src/components/ExportModal.test.js).

---

## CURRENT PROGRESS STATUS
* **Completed Tracks:**
  - Setup and Audit [x]
  - Nvidia NIM AI Assistant Integration [x]
  - Dataset Export Framework [x]
* **Next Track:**
  - Imitation learning annotation monitoring workspace [ ]
