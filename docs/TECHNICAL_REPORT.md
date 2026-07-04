# CAVEMAN TECH REPORT - ARCHITECTURE AND HMI OF MEDICAL IMAGE APP

ME WRITE BIG REPORT. EXPLAIN HOW MEDICAL APP WORK AND WHAT NEW STUFF WE MAKE.

---

## 1. WHERE STUFF IS (LAYOUT)

### SERVER LAYOUT (BACKEND API)
* `server/index.js`: BIG BOSS. Start server, connect to MongoDB, load middleware, listen to port.
* `server/src/`: Core backend brain.
  * `config/`: MongoDB config (`database.js`), secret key, upload folder config (`uploads.js`).
  * `middleware/`: Security headers (`security.js`), login shield (`auth.js`), team access check (`access.js`), action logger (`audit.js`).
  * `realtime/`: Server-Sent Events (SSE) for doctors draw together in real-time.
  * `routes/`: Express endpoint route handlers (Auth, Annotation, Google Drive, Profile, Project, Task, Team).
  * `security/`: Encrypt keys for Google Drive OAuth.
  * `services/`: Operations abstraction layer (Google Drive operations, user-team relations).
  * `utils/`: Error helpers, allowed files list, disk helpers.
  * **NEW ROUTE** `routes/aiRoutes.js`: Proxy chat to Nvidia NIM LLM.
  * **NEW ROUTE** `routes/exportRoutes.js`: Exporter backend route. Handles ZIP and Google Drive.
  * **NEW UTILS** `utils/exportConverters.js`: Turn draw shapes to YOLO, COCO, Pascal VOC.
* `server/test/`: Test folder. Has tests for auth, export, and AI chat.

### CLIENT LAYOUT (REACT FRONTEND)
* `client/src/`: React frontend brain.
  * `index.js`, `App.js`: Root setup.
  * `AuthContext.js`: Keep JWT login token.
  * `DicomViewer.js`: Cornerstone-based viewer for 3D DICOM slices.
  * `NiftiViewer.js`: VTK.js-based 3D NIfTI slices viewer.
  * `AnnotationCanvas.js`: Fabric.js overlay on top of viewer. Let doctors draw boxes, lines, polygons.
  * `pages/`: Page screens (Annotation page, Project detail page, dashboard, login, team).
  * `components/`: Smaller buttons and panels (toolbar, sidebar, modals).
  * `i18n/`: Translate to English, German, Dutch, Persian.
  * `styles/`: Visual presentation stylesheets.
  * **NEW COMPONENT** `components/AssistantPanel.jsx`: Chat sidebar panel for NIM AI chat.
  * **NEW COMPONENT** `components/ExportModal.jsx`: Modal popup to choose ML formats and download.

---

## 2. API ROUTING & CONTROLLER

Dynamic controller routes setup in `server/src/routes/index.js`. 

### MAIN CHANNELS (ENDPOINTS)
* **Auth (`authRoutes.js`):**
  * `POST /api/auth/signup`: Doctor sign up.
  * `POST /api/auth/login`: Give JWT token to doctor.
  * `GET /api/auth/verify`: Check if login valid.
* **Projects & Tasks (`projectRoutes.js`, `taskRoutes.js`):**
  * `GET /api/projects`: List projects.
  * `POST /api/projects`: Create project.
  * `GET /api/tasks/:id`: Fetch task, image file list.
  * `POST /api/tasks/:id/upload`: Upload NIfTI, DICOM, PNG, JPG.
* **Annotations (`annotationRoutes.js`):**
  * `GET /api/tasks/:id/annotations`: Fetch shapes for image slices.
  * `POST /api/tasks/:id/annotations`: Save shape coordinates. Check integrity hash.
* **NEW AI ASSISTANT (`aiRoutes.js`):**
  * `POST /api/ai/chat`: Secure proxy to Nvidia NIM API. Check doctor token first, then call NIM LLM.
  * `POST /api/tickets/create`: Make bug report ticket in MongoDB.
* **NEW DATASET EXPORTER (`exportRoutes.js`):**
  * `POST /api/export/dataset`: Compress images and annotations to ZIP. Sync to Google Drive if needed.

---

## 3. FRONTEND DRAW AND VIEW HMI

### HOW RENDER WORK
1. **DicomViewer:** Load DICOM files. Cache volume. Doctor can change view plane: **Axial, Coronal, Sagittal**.
2. **NiftiViewer:** Load `.nii` files. Render using `VTK.js`.
3. **AnnotationCanvas:** Fabric.js transparent overlay on top of viewer. Handles mouse events.
4. **Coordinate Mapping:** Vector coordinates from Fabric.js scaled to actual image pixels. Point numbers rounded to 3 decimals.

---

## 4. WHAT NEW FEATURES WE MAKE (WHAT CHANGED)

### FEATURE A: NVIDIA NIM AI CHAT ASSISTANT
* **What Changed:** We add AI chatbot inside annotation workspace. Doctor can ask questions about medical instructions or log bug tickets.
* **New Backend:** 
  - `POST /api/ai/chat` proxy with native fetch to Nvidia NIM endpoint. Secures NIM API key on server.
  - `POST /api/tickets/create` stores bug tickets in MongoDB with audit trails.
* **New Frontend:**
  - `AssistantPanel.jsx` added. Renders message history with Markdown parser.
  - Auto-scrolls to bottom on new messages.
  - Interactive "Create Ticket" button appears if AI suggest it.
  - "Bot" icon added to toolbar. Clicking it opens chat tab on right panel.

### FEATURE B: DATASET EXPORT FRAMEWORK
* **What Changed:** Clinicians can export dataset in standard formats (YOLO, COCO, Pascal VOC) or make custom format using templates.
* **New Backend Exporter:**
  - `exportConverters.js` parses coordinates:
    * **YOLO**: Normalized coordinates `[class_id, x_center, y_center, w, h]` and `classes.txt`.
    * **COCO**: JSON schema with annotations, images, categories.
    * **Pascal VOC**: XML elements (`xmin`, `ymin`, `xmax`, `ymax`).
  - Custom Template Engine: Replaces placeholders like `{{filename}}`, `{{label}}`, `{{x_min}}` with actual shape values.
  - Packaging: Zips annotations and optionally raw image files.
  - Google Drive Sync: Uploads exported ZIP file to Google Drive using secure API.
* **New Frontend Exporter UI:**
  - `ExportModal.jsx` provides formats dropdown, include-images toggle, label filters, custom template input.
  - Export trigger integrated in Project Dashboard and Workspace Left Drawer.

---

## 5. SECURITY AND AUDIT GATE

* Server audit safe. No known backend vulnerabilities.
* Google Drive tokens encrypted at rest.
* HIPAA/GDPR session lock under development.
