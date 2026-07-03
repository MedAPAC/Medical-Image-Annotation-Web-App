# Codebase Architecture and HMI Audit Report

This report documents the structure, API routing patterns, and HMI (Human-Machine Interface) capabilities of the MediAnnotate codebase. It also identifies design loopholes and bugs for resolution.

---

## 1. Project Directory Structure Map

### Server Layout (Backend API)
* `server/index.js`: Main server entry point, connects to MongoDB, mounts middlewares, and runs the HTTP / EventSource listener.
* `server/src/`: Core backend modules.
  * `config/`: Configuration for MongoDB (`database.js`), constants, secrets, and file upload parameters (`uploads.js`).
  * `middleware/`: Security headers (`security.js`), JWT verification (`auth.js`), team access controls (`access.js`), and request logging/auditing (`audit.js`).
  * `realtime/`: SSE/WebSockets for annotation concurrency and task state synchronization.
  * `routes/`: Express endpoint route handlers (Auth, Annotation, Google Drive, Profile, Project, Task, Team).
  * `security/`: Encryption routines for third-party tokens (Google OAuth).
  * `services/`: Operations abstraction layer (Google Drive operations, user-team relations).
  * `utils/`: Custom errors, accepted file types classification, and filesystem utilities.
* `server/test/`: Security, token validation, and integration tests.

### Client Layout (React Frontend)
* `client/src/`: Single-page app code.
  * `index.js`, `App.js`: Top-level mount and context provider wrapping.
  * `AuthContext.js`: Manages user credentials, login states, and headers.
  * `DicomViewer.js`: Cornerstone-based image series rendering and multi-slice volume building.
  * `NiftiViewer.js`: VTK.js-based 3D volume slices rendering.
  * `AnnotationCanvas.js`: Fabric.js-based 2D overlay layer for drawing vector geometries.
  * `pages/`: UI view screens (Annotation viewer, Task manager, login/signup, profile, team controls).
  * `components/`: Modular widgets (toolbar, slices panel, header, modal dialogues).
  * `i18n/`: Internationalization components (English, German, Dutch, Persian RTL).
  * `styles/`: Visual presentation stylesheets.

---

## 2. API Routing & Controller Architecture

All routes register dynamic controllers using dependencies injected via a central `context` object in `server/src/routes/index.js`. 

### Key API Endpoints
* **Authentication (`authRoutes.js`):**
  * `POST /api/auth/signup` / `POST /signup`: Clinician signup.
  * `POST /api/auth/login` / `POST /login`: JWT access token generation.
  * `GET /api/auth/verify`: Auth status validation.
* **Projects & Tasks (`projectRoutes.js`, `taskRoutes.js`):**
  * `GET /api/projects`: List projects.
  * `POST /api/projects`: Create project.
  * `GET /api/tasks/:id`: Fetch specific task, metadata, and assigned files list.
  * `POST /api/tasks/:id/upload`: Upload image/volume files (DICOM, NIfTI, PNG, JPEG).
* **Annotations (`annotationRoutes.js`):**
  * `GET /api/tasks/:id/annotations`: Fetch existing labels and coordinates for file slices.
  * `POST /api/tasks/:id/annotations`: Save annotation geometry and check SHA-256 integrity.

---

## 3. Frontend Canvas & HMI Layer

### Rendering Pipeline
1. **DicomViewer:** Leverages `cornerstone-core` and WADO image loader. It decodes slice sets into a unified 3D typed-array volume, enabling the doctor to toggle between **Axial, Coronal, and Sagittal** planes.
2. **NiftiViewer:** Loads `.nii` or `.nii.gz` file streams and renders them using `VTK.js`.
3. **AnnotationCanvas:** A transparent overlay canvas using `Fabric.js` placed directly on top of the image wrapper. It handles mouse/pointer inputs to draw and modify bounding boxes, polygons, and polylines.

### Canvas & Cornerstone HMI Mechanics
* **Cornerstone Multi-planar Viewport:**
  * Uses `cornerstone-core` and WADO image loader to load and cache DICOM files.
  * Decodes slices into a single linear buffer (`volume.data`) representing voxel intensities.
  * Dynamically extracts and interpolates sagittal and coronal planes relative to the axial slice set bounds.
  * Connects to a hidden canvas element where Cornerstone handles rasterization, while the outer canvas renders the processed viewport.
* **Fabric.js Vector Layer:**
  * Coordinates of hand-drawn shapes on Fabric.js are mapped to the standard `image-pixel` coordinate system using transformation matrices (`calcTransformMatrix`).
  * Vertex points are rounded to 3 decimal places to ensure consistent export formats.
  * The canvas intercepts mouse down, move, and up events when in active drawing mode (e.g. polygon, polyline, ellipse, rectangle, or brush mask tools).
  * Synchronization with the backend is achieved by sending structured shape arrays (representing points and labels) to `/api/tasks/:id/annotations`.

---

## 4. Key Gaps & Vulnerabilities Identified

### 4.1 Security Gaps & Loopholes
1. **Lack of Automated Workstation Session Lockout (HIPAA/GDPR Compliance Gap):**
   * **Vulnerability:** When a clinician leaves a workstation, the active annotation session remains open indefinitely.
   * **Remediation:** Implement an inactive timer in `client/src/App.js` that automatically logs the user out and clears access tokens after 15 minutes of idle time.
2. **Missing Multi-Factor Authentication (MFA):**
   * **Vulnerability:** Access depends entirely on password authentication. Weak or reused passwords could lead to unauthorized access to medical records.
   * **Remediation:** Implement an optional MFA feature configured by the project owner/creator. When enabled, users must authenticate with an email-based One-Time Passcode (OTP) sent to their registered address during login.
3. **Local Database Encryption-at-Rest Gap:**
   * **Vulnerability:** MongoDB connection strings do not enforce volume encryption or SSL by default.
   * **Remediation:** Update `compose.yaml` to specify MongoDB configuration options that mandate TLS/SSL and encrypt local persistent directories.

### 4.2 Codebase Bugs & Gaps
1. **Frontend Crash on Standard 2D Images (X-rays, etc.):**
   * **Bug:** Files categorized as `type: "image"` (PNG/JPEG) are passed to `NiftiViewer` in `client/src/components/MainViewer.jsx`, triggering JavaScript runtime crashes.
   * **Remediation:** Add a dedicated branch in `MainViewer.jsx` to render a 2D viewport when `file?.type === 'image'`.
2. **DICOM Metadata Panel Missing:**
   * **Gap:** Clinicians cannot inspect critical tags (e.g., Modality, Study Date, Patient Age) in the viewer.
   * **Remediation:** Map parsed headers using `dicomParser` in `DicomViewer.js` and render them in a collapsible right drawer.

---

## 5. Summary of Recommended Dev Tasks

| Task | Category | Severity | File Targets |
| :--- | :--- | :---: | :--- |
| **Fix 2D Image View Crash** | Bug | High | [MainViewer.jsx](file:///home/mamdaliof/Documents/GitHub/mamdaliof-obsidian/02-Projects/Medical-Image-Annotation-Web-App/client/src/components/MainViewer.jsx) |
| **Build DICOM Metadata Sidebar** | Feature | Medium | [DicomViewer.js](file:///home/mamdaliof/Documents/GitHub/mamdaliof-obsidian/02-Projects/Medical-Image-Annotation-Web-App/client/src/DicomViewer.js) |
| **Implement 15-Minute Session Lock** | Security | High | [App.js](file:///home/mamdaliof/Documents/GitHub/mamdaliof-obsidian/02-Projects/Medical-Image-Annotation-Web-App/client/src/App.js) |
| **Enforce MongoDB TLS & Encryption** | Security | Critical | [compose.yaml](file:///home/mamdaliof/Documents/GitHub/mamdaliof-obsidian/02-Projects/Medical-Image-Annotation-Web-App/compose.yaml) |

