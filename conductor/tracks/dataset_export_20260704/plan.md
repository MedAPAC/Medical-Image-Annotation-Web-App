# Implementation Plan - Dataset Export Framework

This document outlines the phased plan to implement the Dataset Export Framework.

## Phase 1: Backend Format Exporters and ZIP Packaging [checkpoint: f4c69bf]
- [x] Task: Annotation Format Converters (3ad666a)
    - [x] Write unit tests for YOLO coordinate converter
    - [x] Implement YOLO annotation formatter `[class_id, x_center, y_center, w, h]`
    - [x] Write unit tests for COCO JSON converter
    - [x] Implement COCO JSON dataset compiler
    - [x] Write unit tests for Pascal VOC XML builder
    - [x] Implement Pascal VOC XML writer
    - [x] Write unit tests for Custom Template parser
    - [x] Implement Custom Template parser using regex placeholder substitution
- [x] Task: Export API Route and Packaging (11abbb5)
    - [x] Write integration tests for `POST /api/export/dataset` verifying filters and settings
    - [x] Implement Express route `POST /api/export/dataset` compiling ZIP file containing annotations (and optionally images)
    - [x] Integrate Google Drive sync upload for exported ZIP files
- [x] Task: Conductor - User Manual Verification 'Backend Format Exporters and ZIP Packaging' (Protocol in workflow.md)

## Phase 2: React Export Modals and HMI Actions [checkpoint: TBD]
- [x] Task: Export Configuration Dialog (b62928f)
    - [x] Write component tests for `ExportModal.jsx` rendering options and toggles
    - [x] Implement `ExportModal.jsx` component supporting format select, filters, and image download toggles
    - [x] Add trigger logic for direct download, server download, and Google Drive upload
- [x] Task: Workspace and Project Dashboard Integrations (928ce80)
    - [x] Write tests for export button clicks on Annotation Workspace and Project views
    - [x] Add "Export Dataset" button to Project Detail dashboard
    - [x] Add "Export Annotations" action button to the Annotation workspace left/right drawer
- [ ] Task: Conductor - User Manual Verification 'React Export Modals and HMI Actions' (Protocol in workflow.md)
