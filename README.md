# Medical Image Annotation Web Application

> A production-shaped workspace for medical image annotation, project coordination, task assignment, volumetric image review, and structured annotation export.

![Platform status](https://img.shields.io/badge/status-active_development-256fb8)
![Frontend](https://img.shields.io/badge/frontend-React-2f80d0)
![Backend](https://img.shields.io/badge/backend-Node.js_Express-15803d)
![Database](https://img.shields.io/badge/database-MongoDB-10b981)
![Medical formats](https://img.shields.io/badge/formats-DICOM_%7C_NIfTI_%7C_Images-b45309)

## Overview

Medical Image Annotation Web Application is a full-stack platform for organizing medical imaging work into projects, tasks, files, annotation sessions, and exportable datasets. It is designed for hospitals, radiology labs, clinical research teams, and AI annotation teams that need a practical workflow around DICOM, NIfTI, and standard image files.

MongoDB is the live source of truth for users, projects, tasks, teams, annotations, timers, and project state. Google Drive can be enabled as an optional project-level backup/export-sync layer for uploaded files, annotation JSON snapshots, and project exports.

## Product Snapshot

| Area | What it provides |
| --- | --- |
| Project operations | Project creation, ownership, labels, attributes, configuration import/export, and optional Drive backup |
| Task workflow | Task creation, assignment, status/progress tracking, file uploads, timers, and task detail management |
| Annotation workspace | Slice navigation, annotation canvas, label controls, classification, unsaved-change protection, and real-time update notices |
| Medical file support | Standard images, DICOM series handling, NIfTI volumes, and file-type-aware viewers |
| Collaboration | Authentication, project ownership, team expansion for owners/assignees, and protected project/task routes |
| Backup/export | Optional Google Drive folder sync while MongoDB remains the operational database |

## Visual Documentation

Use this structure for README screenshots and GIFs:

```text
docs/media/
  screenshots/
    home-dashboard.png
    projects-page.png
    project-detail.png
    task-detail.png
    annotation-workspace.png
    google-drive-backup.png
  gifs/
    create-project.gif
    upload-medical-files.gif
    draw-polygon.gif
    navigate-slices.gif
    save-annotations.gif
```

Recommended README placement:

```md
![Project detail dashboard](docs/media/screenshots/project-detail.png)
![Polygon annotation workflow](docs/media/gifs/draw-polygon.gif)
```

Keep documentation-only images in `docs/media/`. Keep assets imported by React under `client/src/` or `client/public/`.

Existing demo GIF examples are currently available in `assets/`:

- `assets/boundingbox.gif`
- `assets/editpolygon.gif`
- `assets/polygon.gif`
- `assets/scroller.gif`

## Core Features

### Project Management

- Create, view, update, and delete projects.
- Configure annotation labels and classification attributes.
- Import and export label/attribute configuration as JSON.
- Add project owners by email.
- Add all members of a user-created team as project owners.
- Enable optional Google Drive backup per project.

### Task Management

- Create tasks under projects.
- Assign tasks to individual users or teams.
- Track status, priority, progress, subset, timers, uploaded files, and metadata.
- Upload supported medical image files to task records.
- Open task detail views for review, file management, and annotation entry.

### Annotation Workspace

- Draw bounding boxes, polygons, polylines, ellipses, and brush annotations.
- Navigate volumetric slices for DICOM and NIfTI workflows.
- Apply slice-level classification and annotation attributes.
- Preserve annotations by file and slice.
- Warn users before leaving with unsaved changes.
- Save annotation data using one-based slice indexing for standard export readability.

### Collaboration and Access Control

- JWT-based authentication.
- Authenticated project and task routes.
- Project owners control project-level access.
- Task assignees and project owners can access relevant task data.
- Team creators can manage their teams and use them for project/task expansion.

### Google Drive Backup

- Optional Google OAuth connection.
- Project-level backup enable/disable controls.
- Use an existing Drive folder or let the app create a project folder.
- Sync uploaded files, annotation snapshots, and export JSON files.
- Keep Google Drive as backup/export storage, not as the live database.

## Architecture

```text
React client
  |
  | HTTP JSON, multipart uploads, annotation saves
  v
Express server
  |
  | MongoDB driver
  v
MongoDB

Optional backup path:

Express server
  |
  | Google OAuth + Drive API
  v
Google Drive project folder
```

### Data Ownership

| Data | Source of truth |
| --- | --- |
| Users, sessions, projects, teams, tasks | MongoDB |
| Annotation records and classification state | MongoDB |
| Uploaded files | Server upload storage, optionally mirrored to Drive |
| Google OAuth tokens | AES-256-GCM encrypted records in a server-side MongoDB collection |
| Drive backup files and snapshots | Google Drive backup folder |

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, React Router, Axios, Fabric.js, Cornerstone/DICOM tooling, NIfTI reader utilities, VTK.js, i18next, Lucide React |
| Backend | Node.js, Express, MongoDB native driver, Multer, bcrypt, JSON Web Tokens |
| Storage | MongoDB, local upload folders, optional Google Drive backup |
| Styling | CSS stylesheets under `client/src/styles`, shared enterprise medical design layer |

## Repository Structure

```text
Medical-Image-Annotation-Web-App/
  client/
    public/
    src/
      components/
      pages/
      styles/
      annotationFormat.js
      AuthContext.js
    package.json

  server/
    index.js
    package.json
    uploads/

  assets/
    boundingbox.gif
    editpolygon.gif
    polygon.gif
    scroller.gif

  docs/
    media/
      screenshots/
      gifs/

  requirements.txt
  client-requirements.txt
  server-requirements.txt
  setup.sh
  README.md
```

## Prerequisites

- Node.js 18 or newer
- npm
- MongoDB 4 or newer
- Git
- Chrome, Edge, Firefox, or another modern browser

Optional for Google Drive backup:

- Google Cloud project
- OAuth consent screen
- OAuth 2.0 web client credentials
- Google Drive API enabled

## Quick Start

### Docker Compose

Docker is optional; the existing local Node.js workflow remains available.

1. Install Docker Desktop or Docker Engine with Compose v2.
2. Generate a private local Docker environment:

```bash
npm run docker:env
```

3. Review `.env.docker`, especially `PUBLIC_APP_URL` and the optional Google OAuth values.
4. Validate and build the stack:

```bash
npm run docker:config
npm run docker:build
```

5. Start the containers:

```bash
npm run docker:up
```

Open `http://localhost:3000`. MongoDB and the API are not published as host ports; NGINX proxies authorized API, medical-file, upload, and realtime traffic. `mongo_data` and `uploads_data` named volumes preserve data across normal restarts.

Stop the stack without deleting data:

```bash
npm run docker:down
```

Do not use `docker compose down -v` unless permanent deletion of MongoDB and uploaded medical files is intended.

### Published Images

The release workflow in `.github/workflows/docker-publish.yml` publishes multi-architecture client and server images to GitHub Container Registry when a `v*` tag is pushed. To use published images, set `CLIENT_IMAGE` and `SERVER_IMAGE` in `.env.docker`, then run:

```bash
docker compose --env-file .env.docker pull
docker compose --env-file .env.docker up -d --no-build
```

The client image expects an API upstream named `server` by default. Override `API_UPSTREAM` when running it outside this Compose stack.

### Local Installation

Run the setup helper from the repository root:

```bash
chmod +x setup.sh
./setup.sh
```

Or install manually:

```bash
cd server
npm install

cd ../client
npm install --legacy-peer-deps
```

Start MongoDB, then run the backend:

```bash
cd server
npm start
```

In a second terminal, run the frontend:

```bash
cd client
npm start
```

Open the app:

```text
http://localhost:3000
```

Backend default:

```text
http://localhost:5000
```

MongoDB default:

```text
mongodb://localhost:27017
```

## Environment Configuration

Development has local defaults, while production startup rejects the development JWT secret and wildcard/empty CORS configuration. Use environment variables or the supported `_FILE` variants for mounted secrets.

Recommended server variables:

```bash
PORT=5000
MONGO_URL=mongodb://localhost:27017
MONGO_DB_NAME=annotationApp
JWT_SECRET=replace-with-a-strong-secret
DATA_ENCRYPTION_KEY=replace-with-a-32-byte-base64-key
CLIENT_BASE_URL=https://annotation.example.org
CORS_ORIGINS=https://annotation.example.org
TRUST_PROXY=1
ENFORCE_HTTPS=true

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5000/api/integrations/google-drive/callback
```

See `server/.env.example` for upload, rate-limit, audit-retention, JWT, MongoDB, and Google Drive settings. Do not use development credentials or an unauthenticated MongoDB deployment in production.

## Google Drive Setup

Google Drive backup is optional. The platform works normally without it.

1. Create or open a Google Cloud project.
2. Enable the Google Drive API.
3. Configure the OAuth consent screen.
4. Create OAuth 2.0 credentials for a web application.
5. Add this redirect URI:

```text
http://localhost:5000/api/integrations/google-drive/callback
```

6. Set the Google environment variables on the backend.
7. Restart the backend.
8. Open a project detail page.
9. Connect Google Drive.
10. Enable backup for the project.

When backup is enabled, the app can create or reuse a Drive folder and organize project backups into:

```text
files/
annotations/
exports/
```

Share the Drive folder manually with project participants if they need direct Drive access.

## Workflow Guide

### Create a Project

1. Go to Projects.
2. Create a project.
3. Configure labels and attributes.
4. Add project owners by email or team.
5. Open the project detail page to review configuration and tasks.

### Create and Assign a Task

1. Go to Tasks or open a project detail page.
2. Create a task under a project.
3. Add description, priority, subset, and assignee details.
4. Assign a user or a team.
5. Upload files from the task workflow.

### Annotate Medical Images

1. Open the assigned task.
2. Select or upload a supported file.
3. Open the annotation workspace.
4. Navigate slices for volumetric files.
5. Draw annotations and add classifications.
6. Save changes before leaving the page.

### Sync to Google Drive

1. Open the project detail page.
2. Connect Google Drive if not already connected.
3. Enable backup.
4. Use Sync Now to mirror existing project files and snapshots.

## Annotation Data Format

Saved annotation data uses one-based slice keys.

```json
{
  "1": {
    "sliceNumber": 1,
    "annotations": [],
    "classification": {
      "value": "example-class",
      "scope": "slice",
      "schemaVersion": "medical-image-annotation.v1"
    },
    "attributes": {}
  }
}
```

The client-side format helpers live in:

```text
client/src/annotationFormat.js
```

Google Drive snapshots wrap the saved slice map with project, task, and file metadata.

## API Map

### Authentication and User

| Method | Endpoint |
| --- | --- |
| `POST` | `/api/auth/signup` |
| `POST` | `/api/auth/login` |
| `GET` | `/api/auth/verify` |
| `POST` | `/api/auth/logout` |
| `PUT` | `/api/user/profile` |
| `PUT` | `/api/user/password` |

### Projects

| Method | Endpoint |
| --- | --- |
| `POST` | `/api/projects` |
| `GET` | `/api/projects` |
| `GET` | `/api/projects/:id` |
| `PUT` | `/api/projects/:id` |
| `DELETE` | `/api/projects/:id` |
| `POST` | `/api/projects/:id/owners` |
| `DELETE` | `/api/projects/:id/owners` |

### Tasks and Files

| Method | Endpoint |
| --- | --- |
| `GET` | `/api/tasks` |
| `GET` | `/api/projects/:projectId/tasks` |
| `GET` | `/api/tasks/:taskId` |
| `POST` | `/api/tasks` |
| `PUT` | `/api/tasks/:taskId` |
| `PUT` | `/api/tasks/:taskId/assign` |
| `PUT` | `/api/tasks/:taskId/progress` |
| `DELETE` | `/api/tasks/:taskId` |
| `POST` | `/api/tasks/:taskId/files` |
| `GET` | `/api/tasks/:taskId/files/:fileId/content` |
| `DELETE` | `/api/tasks/:taskId/files/:fileId` |

### Annotations

| Method | Endpoint |
| --- | --- |
| `POST` | `/save-annotations` |
| `GET` | `/annotations/:taskId` |
| `GET` | `/annotation-events/:taskId` |
| `POST` | `/api/annotation-events/:taskId/ticket` |

### Teams

| Method | Endpoint |
| --- | --- |
| `GET` | `/api/teams` |
| `POST` | `/api/teams` |
| `PUT` | `/api/teams/:id` |
| `DELETE` | `/api/teams/:id` |
| `POST` | `/api/users/resolve` |
| `POST` | `/api/verify-user` |

### Google Drive

| Method | Endpoint |
| --- | --- |
| `GET` | `/api/integrations/google-drive/status` |
| `POST` | `/api/integrations/google-drive/connect` |
| `GET` | `/api/integrations/google-drive/callback` |
| `DELETE` | `/api/integrations/google-drive/disconnect` |
| `POST` | `/api/projects/:id/drive-backup/enable` |
| `POST` | `/api/projects/:id/drive-backup/disable` |
| `POST` | `/api/projects/:id/drive-backup/sync` |

## Development Commands

Frontend:

```bash
cd client
npm start
npm run build
```

Backend:

```bash
cd server
npm start
npm run dev
```

Server syntax check:

```bash
node --check server/index.js
```

## Production Checklist

- Follow [SECURITY.md](SECURITY.md) and complete a formal risk assessment.
- Terminate TLS at a trusted ingress and enable TLS plus encryption at rest for MongoDB.
- Store secrets in a managed secret store and rotate them on a documented schedule.
- Forward audit records to protected centralized storage and monitor authentication/access failures.
- Add approved malware scanning and DICOM de-identification controls before accepting clinical files.
- Configure encrypted backups, retention, restore testing, and secure deletion procedures.
- Add MFA or enterprise SSO for clinical use.
- Scan dependencies and container images continuously.
- Validate annotation export format against downstream AI or research requirements.
- Confirm privacy, compliance, and institutional data-handling requirements before storing medical data.

## Troubleshooting

### MongoDB connection fails

Check that MongoDB is installed and running:

```bash
mongod --version
```

Confirm the server is using the expected `MONGO_URL`.

### Frontend cannot reach backend

Confirm the backend is running at:

```text
http://localhost:5000
```

Also check any hardcoded API base URLs in the frontend while the app is still in local-development mode.

### Upload fails

Check that:

- The file type is supported.
- The task exists and the user has access.
- `server/uploads/` exists and is writable.
- The file is inside the server upload limits.

Supported upload extensions include:

```text
.jpg, .jpeg, .png, .nii, .nii.gz, .dcm, .dicom
```

### Google Drive shows "not configured"

Set these variables and restart the backend:

```bash
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
```

### Google Drive backup fails

Check that:

- The Google Drive API is enabled.
- The OAuth redirect URI matches exactly.
- The connected Google account can access the selected folder.
- The folder URL or ID is valid.
- The Drive folder has enough storage and permissions.

## Contribution Notes

When changing this project:

- Keep MongoDB as the live source of truth.
- Keep Google Drive optional and non-blocking.
- Preserve existing annotation tools and file support.
- Keep saved annotation slice keys one-based.
- Keep DICOM series grouped as logical files in the annotation workflow.
- Run `npm run build` from `client/` before large frontend changes.
- Store README screenshots and GIFs under `docs/media/`.

## License

Add the project license here before public distribution.
