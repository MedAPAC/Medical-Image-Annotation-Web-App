# Initial Concept

MediAnnotate is an existing medical image annotation web application. The supervisor (an AI engineer) wants to:
1. Update their knowledge of the project's features, HMI, and UI/UX design.
2. Identify bugs, security vulnerabilities, and technical loopholes in the codebase to assign them to the developer team.

---

# Product Guide: MediAnnotate

## Project Vision & Goals
MediAnnotate is a secure clinical medical image annotation platform designed to bridge the gap between healthcare experts and machine learning engineering. The platform facilitates slice-by-slice medical imaging review (DICOM, NIfTI, PNG, JPEG), collaborative labeling workflows, and high-integrity dataset generation for downstream AI applications.

### Double-Sided Revision Objectives:
1. **AI Supervisor Dashboard & Feature Ideation:** Empower the AI Supervisor (non-web developer) to understand the project architecture, easily conceptualize new HMI/UX features, and design advanced AI-assisted annotation flows (e.g., active learning, pre-segmentation inference).
2. **Quality Assurance & Security Auditing:** Establish rigorous checkpoints to find bugs, security loopholes, and performance constraints in the development codebase so they can be assigned to the developer team for remediation.

---

## User Personas
* **AI Engineer / Supervisor (User):** Non-web developer overseeing dataset quality, specifying annotation attributes, analyzing metadata exports, and assigning tasks. Needs a clear view of the HMI workflows and API-level data models to plan AI integrations.
* **Clinical Annotator / Reviewer:** Medical professionals navigating slices and drawing annotations (bounding boxes, polygons, etc.). Needs an ergonomic, highly responsive, and language-localized interface.
* **Developer Team:** Technical implementers responsible for patching code, fixing bugs, and implementing new HMI features defined by the supervisor.

---

## Technical Foundation & Architecture
* **Frontend:** React 19 single-page application utilizing Cornerstone.js (2D DICOM), VTK.js (3D NIfTI/DICOM), Fabric.js (canvas-based 2D shape editing), and TailwindCSS.
* **Backend:** Express API (Node.js 18+) handling data validation, multi-lingual files, token authentication, and WebSockets/EventSource for realtime coordination.
* **Database:** MongoDB for live state storage (audit logs, annotation geometry, user assignments).
* **Backup/Sync:** Google Drive Integration for exporting versioned JSON datasets and archiving medical raw files.
* **Localization (i18n):** Multi-language framework supporting English, Dutch, and German.

---

## Focus Features
* **2D Clinical Image Support:** Optimized annotation workspace for standard 2D images, such as X-rays (DICOM, PNG, or JPEG formats), with pan, zoom, and contrast adjustment tools.
* **DICOM Metadata Inspector:** A dedicated panel in the annotation viewer displaying the parsed internal DICOM header metadata (e.g., Patient Age, Modality, Study Date, Manufacturer, Window Settings), enabling clinicians to inspect critical scan attributes.
* **Collaboration & Auditability:** Real-time sync, task assignment, and full provenance/integrity checks (SHA-256) on datasets.

---

## Focus Areas for Code Audits & Bug Hunting
To help the supervisor delegate issues to the dev team, the code style and development workflow will focus on auditing:
1. **Security & Data Privacy:** Confirming strict JWT verification, lack of hardcoded secrets, DICOM de-identification pipelines, and proper role-based route protection.
2. **Resource Integrity:** Validating SHA-256 signatures on annotation exports and medical file uploads.
3. **Performance & Memory Leaks:** Auditing Cornerstone/VTK canvas rendering, large image upload limits, and Express memory overhead during file streaming.
4. **HMI/UX Glitches:** Checking for state synchronization bugs in multi-slice views, coordinate conversion offsets, and translation key mismatches.
