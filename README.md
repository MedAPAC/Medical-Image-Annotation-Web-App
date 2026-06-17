# Medical Image Annotation Web App

A full-stack web application for creating medical imaging projects, assigning annotation tasks, uploading image volumes, drawing annotations, classifying slices, and saving structured annotation data. The app is built with a React frontend, an Express/Node.js backend, and MongoDB as the live database.

The application is designed for medical image annotation workflows involving standard images, DICOM files, and NIfTI volumes. It includes project and task management, multi-user access controls, real-time annotation update notifications, optional Google Drive backup/export-sync, and a production-oriented annotation workspace.

## Table of Contents

- [Overview](#overview)
- [Feature Highlights](#feature-highlights)
- [Screenshots and GIFs](#screenshots-and-gifs)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Google Drive Backup Setup](#google-drive-backup-setup)
- [Core Workflows](#core-workflows)
- [Annotation Data Format](#annotation-data-format)
- [API Overview](#api-overview)
- [Development Commands](#development-commands)
- [Production Notes](#production-notes)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Overview

This project supports a complete annotation workflow:

1. Users create accounts and authenticate.
2. Project owners configure labels and classification attributes.
3. Owners add individual users or teams as project owners.
4. Owners create tasks and assign users or teams.
5. Users upload image files, DICOM files, or NIfTI files to tasks.
6. Annotators open the annotation page, navigate slices, draw annotations, classify slices, and save work.
7. Annotation data is saved to MongoDB as the source of truth.
8. If enabled, files and JSON snapshots are mirrored to Google Drive as a backup/export layer.

MongoDB remains the live operational database. Google Drive is optional and is used only for backup, file mirroring, and export-sync.

## Feature Highlights

### Project Management

- Create, view, update, and delete projects.
- Configure annotation labels such as rectangle, polygon, polyline, ellipse, and brush.
- Configure attributes such as text, number, checkbox, radio, and select.
- Add project owners by email.
- Add all members of a user-created team as project owners.
- Edit project labels and attributes from the project detail page.

### Task Management

- Create tasks under projects.
- Assign tasks to individual users.
- Assign tasks to all members of a user-created team.
- Track task status, priority, progress, timers, uploaded files, and metadata.
- Upload multiple files per task.
- Manage task files and task-level details.

### Medical Image Support

- Standard image uploads, including JPEG and PNG.
- DICOM support through DICOM parsing/viewing tools.
- NIfTI support through NIfTI reader utilities.
- Slice navigation for volumetric datasets.
- File-type-aware viewer behavior.

### Annotation Workspace

- Canvas-based annotation tools.
- Bounding boxes, polygons, polylines, ellipse annotations, and brush workflows.
- Slice-level classification panel.
- Label and attribute controls.
- Real-time update notification channel for concurrent annotation sessions.
- Unsaved-change protection before navigation or reload.
- One-based saved slice indexing for exported annotation data.

### Collaboration and Access Control

- JWT-based authentication.
- Project owners control project-level access.
- Task assignees and project owners can access relevant task data.
- Teams can be created and managed by their creator.
- Team creators can use their own teams for owner/assignee expansion.

### Optional Google Drive Backup

- Connect a Google Drive account.
- Enable Drive backup per project.
- Use an existing shared Drive folder or let the app create a folder.
- Mirror uploaded task files to Drive.
- Save annotation JSON snapshots to Drive.
- Create project export JSON snapshots.
- Keep MongoDB as the live source of truth.

## Screenshots and GIFs

Use a predictable documentation media layout so the README stays clean and easy to maintain.

Place README screenshots here:

```text
docs/media/screenshots/
```

Place README GIFs here:

```text
docs/media/gifs/
```

Recommended filenames:

```text
docs/media/screenshots/project-dashboard.png
docs/media/screenshots/project-detail.png
docs/media/screenshots/task-detail.png
docs/media/screenshots/annotation-workspace.png
docs/media/screenshots/google-drive-backup.png

docs/media/gifs/create-project.gif
docs/media/gifs/upload-medical-files.gif
docs/media/gifs/draw-polygon.gif
docs/media/gifs/navigate-slices.gif
docs/media/gifs/save-annotations.gif
```

Existing demo GIFs are currently stored in:

```text
assets/
```

Current examples:

- `assets/boundingbox.gif`
- `assets/editpolygon.gif`
- `assets/polygon.gif`
- `assets/scroller.gif`

Suggested README placement:

```md
![Annotation workspace](docs/media/screenshots/annotation-workspace.png)
![Polygon drawing workflow](docs/media/gifs/draw-polygon.gif)
```

If an image is only for documentation, prefer `docs/media/...`. If an image is imported by React code, place it under `client/src/assets/` or `client/public/` depending on how it is used by the app.

## Architecture

```text
React Client
  |
  | HTTP / JSON / multipart uploads
  v
Express Server
  |
  | MongoDB driver
  v
MongoDB

Optional:
Express Server
  |
  | Google OAuth + Drive API
  v
Google Drive backup folder
```

### Data Ownership

- MongoDB stores users, projects, tasks, teams, timers, and annotation documents.
- The server filesystem stores uploaded task files locally.
- Google Drive stores optional backup copies and export snapshots only.
- The frontend never stores Google refresh tokens.

## Tech Stack

### Frontend

- React
- React Router
- Axios
- Fabric.js
- Cornerstone/DICOM tooling
- NIfTI reader utilities
- VTK.js
- i18next
- Lucide React icons
- CSS modules/stylesheets under `client/src/styles`

### Backend

- Node.js
- Express
- MongoDB native driver
- Multer for uploads
- bcrypt for password hashing
- JSON Web Tokens for authentication
- Google Drive API integration through server-side OAuth calls

### Database

- MongoDB database: `annotationApp`
- Key collections:
  - `users`
  - `projects`
  - `tasks`
  - `annotations`
  - `teamsCollection`
  - `task_timers`
  - `google_drive_connections`

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

Install the following before running the application:

- Node.js 18 or newer recommended
- npm
- MongoDB 4 or newer
- Git
- A modern browser such as Chrome, Edge, or Firefox

Optional for Google Drive backup:

- Google Cloud project
- OAuth consent screen
- OAuth 2.0 client credentials
- Google Drive API enabled

## Quick Start

Clone the repository:

```bash
git clone <repository-url>
cd Medical-Image-Annotation-Web-App
```

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies:

```bash
cd ../client
npm install --legacy-peer-deps
```

Start MongoDB locally.

Start the backend:

```bash
cd server
npm start
```

Start the frontend in another terminal:

```bash
cd client
npm start
```

Open:

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

The current server has local defaults in `server/index.js` for development. For production, move secrets and environment-specific values into environment variables.

Recommended server environment variables:

```bash
PORT=5000
MONGO_URL=mongodb://localhost:27017
MONGO_DB_NAME=annotationApp
JWT_SECRET=replace-with-a-strong-secret

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5000/api/integrations/google-drive/callback
```

Important production note: do not use the development JWT secret in production.

## Google Drive Backup Setup

Google Drive is optional. The app works without it.

Google Drive backup is intended for:

- Uploaded image/DICOM/NIfTI file backup
- Annotation JSON snapshot backup
- Project export JSON snapshots

Google Drive is not used as the live database.

### Google Cloud Setup

1. Create or open a Google Cloud project.
2. Enable the Google Drive API.
3. Configure the OAuth consent screen.
4. Create OAuth 2.0 credentials for a web application.
5. Add this redirect URI:

```text
http://localhost:5000/api/integrations/google-drive/callback
```

6. Set these server environment variables:

```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/integrations/google-drive/callback
```

7. Restart the backend.
8. Open a project detail page.
9. Use the Google Drive Backup panel to connect Drive.
10. Enable backup for the project.

### Folder Behavior

When enabling project backup, the user can:

- Paste an existing Google Drive folder URL or ID.
- Leave the field empty so the app creates a project backup folder.

The folder should be shared manually with project participants if they need direct Drive access.

The app creates subfolders for:

```text
files/
annotations/
exports/
```

## Core Workflows

### Create a Project

1. Go to Projects.
2. Create a project.
3. Add labels and attributes.
4. Add additional owners by email if needed.
5. Add owner teams if needed.
6. Save and open the project.

### Create a Task

1. Go to Tasks or open a project detail page.
2. Create a task.
3. Select a project.
4. Add optional description, subset, priority, and assignees.
5. Assign individual users or teams.
6. Upload files now or later from the task detail page.

### Annotate a Task

1. Open a task.
2. Upload or select a file.
3. Open the annotation workspace.
4. Navigate slices if the file is volumetric.
5. Draw annotations and apply classifications.
6. Save changes.

### Enable Drive Backup

1. Open a project detail page.
2. Connect Google Drive.
3. Enter an existing folder ID/URL or leave blank to create one.
4. Enable backup.
5. Use Sync Now to export existing files and annotations.

## Annotation Data Format

Saved annotation data uses one-based slice keys.

Example:

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

The schema version is defined in:

```text
client/src/annotationFormat.js
```

Google Drive annotation snapshots use a project/task/file wrapper around the saved slice map.

## API Overview

### Authentication

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/verify`
- `POST /api/auth/logout`
- `PUT /api/user/profile`
- `PUT /api/user/password`

### Projects

- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/projects/:id/owners`
- `DELETE /api/projects/:id/owners`

### Tasks

- `GET /api/tasks`
- `GET /api/projects/:projectId/tasks`
- `GET /api/tasks/:taskId`
- `POST /api/tasks`
- `PUT /api/tasks/:taskId`
- `PUT /api/tasks/:taskId/assign`
- `PUT /api/tasks/:taskId/progress`
- `DELETE /api/tasks/:taskId`

### Task Files

- `POST /api/tasks/:taskId/files`
- `DELETE /api/tasks/:taskId/files/:fileId`

### Annotations

- `POST /save-annotations`
- `GET /annotations/:taskId`
- `GET /annotation-events/:taskId`

### Teams

- `GET /api/teams`
- `POST /api/teams`
- `PUT /api/teams/:id`
- `DELETE /api/teams/:id`

### Google Drive Integration

- `GET /api/integrations/google-drive/status`
- `POST /api/integrations/google-drive/connect`
- `GET /api/integrations/google-drive/callback`
- `DELETE /api/integrations/google-drive/disconnect`
- `POST /api/projects/:id/drive-backup/enable`
- `POST /api/projects/:id/drive-backup/disable`
- `POST /api/projects/:id/drive-backup/sync`

## Development Commands

Backend:

```bash
cd server
npm start
```

Frontend:

```bash
cd client
npm start
```

Production frontend build:

```bash
cd client
npm run build
```

Server syntax check:

```bash
node --check server/index.js
```

## Production Notes

Before deploying:

- Move secrets into environment variables.
- Replace the development JWT secret.
- Configure a production MongoDB instance.
- Configure HTTPS.
- Restrict CORS to trusted domains.
- Set upload size and storage policies intentionally.
- Decide retention policies for medical files and annotation exports.
- Add structured logging and request tracing.
- Add backup policies for MongoDB and uploaded files.
- Validate Google Drive OAuth scopes and consent-screen requirements.
- Review privacy, access-control, and compliance requirements for medical data.

## Troubleshooting

### MongoDB Connection Fails

Check that MongoDB is running:

```bash
mongod --version
```

Confirm the server is using the expected MongoDB URL.

### Frontend Cannot Reach Backend

Confirm the backend is running:

```text
http://localhost:5000
```

Confirm the frontend is using the correct API base URLs.

### File Upload Fails

Check:

- File type is supported.
- File size is within server limits.
- `server/uploads/` exists and is writable.
- The user has permission to access the task.

### Google Drive Shows Not Configured

Set:

```bash
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
```

Restart the backend after setting them.

### Google Drive Backup Fails

Check:

- The connected Google account has access to the selected folder.
- The folder ID or URL is valid.
- The Google Drive API is enabled in Google Cloud.
- OAuth redirect URI exactly matches the server route.
- The app has the required Drive scope.

## Contributing

When changing the app:

- Keep MongoDB as the live source of truth.
- Treat Google Drive backup as optional and non-blocking.
- Do not break existing annotation tools or file formats.
- Keep saved annotation slices one-based.
- Run a frontend build before submitting large UI changes.
- Keep README images and GIFs under `docs/media/`.

## License

Add your project license here.
