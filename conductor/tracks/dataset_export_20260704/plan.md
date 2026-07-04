# Implementation Plan - Dataset Export Framework

This document outlines the phased plan to implement the Dataset Export Framework.

## Phase 1: Backend Format Exporters and ZIP Packaging [checkpoint: TBD]
- [~] Task: Annotation Format Converters
    - [ ] Write unit tests for YOLO coordinate converter
    - [ ] Implement YOLO annotation formatter `[class_id, x_center, y_center, w, h]`
    - [ ] Write unit tests for COCO JSON converter
    - [ ] Implement COCO JSON dataset compiler
    - [ ] Write unit tests for Pascal VOC XML builder
    - [ ] Implement Pascal VOC XML writer
    - [ ] Write unit tests for Custom Template parser
    - [ ] Implement Custom Template parser using regex placeholder substitution
- [ ] Task: Export API Route and Packaging
    - [ ] Write integration tests for `POST /api/export/dataset` verifying filters and settings
    - [ ] Implement Express route `POST /api/export/dataset` compiling ZIP file containing annotations (and optionally images)
    - [ ] Integrate Google Drive sync upload for exported ZIP files
- [ ] Task: Conductor - User Manual Verification 'Backend Format Exporters and ZIP Packaging' (Protocol in workflow.md)

## Phase 2: React Export Modals and HMI Actions [checkpoint: TBD]
- [ ] Task: Export Configuration Dialog
    - [ ] Write component tests for `ExportModal.jsx` rendering options and toggles
    - [ ] Implement `ExportModal.jsx` component supporting format select, filters, and image download toggles
    - [ ] Add trigger logic for direct download, server download, and Google Drive upload
- [ ] Task: Workspace and Project Dashboard Integrations
    - [ ] Write tests for export button clicks on Annotation Workspace and Project views
    - [ ] Add "Export Dataset" button to Project Detail dashboard
    - [ ] Add "Export Annotations" action button to the Annotation workspace left/right drawer
- [ ] Task: Conductor - User Manual Verification 'React Export Modals and HMI Actions' (Protocol in workflow.md)
