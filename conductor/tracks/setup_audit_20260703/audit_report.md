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

---

## 4. Key Gaps & Vulnerabilities Identified

### Design Gaps
* **Missing 2D Image (X-ray) Viewer:** 
  The file classifier (`fileTypes.js`) correctly labels `.png` and `.jpeg` files as `type: "image"`. However, the frontend `MainViewer.jsx` only checks `isDicom ? <DicomViewer /> : <NiftiViewer />`. This causes standard 2D image formats (like chest X-rays) to be fed into the `NiftiViewer`, throwing render crashes.
* **DICOM Metadata Inspection Gap:**
  Although `dicomParser` is loaded client-side to parse headers for decoding, there is no UI section/panel exposing DICOM tags (e.g. Scanner Modality, Exposure time, Patient Age group) to the clinician.
* **Session Expiry Warning:**
  No warning banner or idle timeout checks exist to protect exposed patient views on workstations.
