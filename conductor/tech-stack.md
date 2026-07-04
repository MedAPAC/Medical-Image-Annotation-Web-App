# Technology Stack: MediAnnotate

## Frontend
* **Core Framework:** React 19 (Single-Page Application).
* **Router:** React Router DOM (v7).
* **Styling:** TailwindCSS (v4) with PostCSS and Autoprefixer.
* **Canvas Drawing:** Fabric.js (v5) for 2D geometry editing.
* **Medical Image Parsing & Rendering:**
  * Cornerstone.js (Cornerstone Core & Tools) for 2D DICOM rendering, windowing, and drawing overlays.
  * Cornerstone WADO Image Loader for loading DICOM datasets from WADO HTTP servers.
  * NIfTI Reader JS for client-side parsing of NIfTI medical volumes.
  * VTK.js for multi-planar reconstruction (MPR) and 3D visualization.
  * Dicom Parser for client-side DICOM file tag indexing.
* **State & Sync:** Axios for HTTP client operations.

## Backend
* **Runtime:** Node.js 18+ (utilizing native Fetch API).
* **Framework:** Express (v5) with helmet and cors middleware.
* **Security & Auth:** JWT (jsonwebtoken) and bcrypt.
* **File Uploads:** Multer.
* **Real-time Synchronization:** Server-Sent Events (SSE / EventSource) for realtime task coordination.
* **Internationalization:** i18next with Express middleware and file-system backend.
* **AI Integrations:** Nvidia NIM API proxy route leveraging OpenAI-compatible endpoints (`meta/llama-3.2-3b-instruct`).

## Database
* **Primary Database:** MongoDB (mongodb Node.js driver v6).

## Deployment & Containerization
* **Development/Local:** Docker Compose (using compose.yaml) with multi-container setups (Express API, React client, MongoDB).
