# Specification: Dataset Export Framework

## Overview
Implement a comprehensive dataset export framework that allows clinical supervisors and developers to export annotated medical datasets in popular machine learning formats (YOLO, COCO, Pascal VOC) and define custom structured templates. The export process supports downloading annotations only (lightweight mode) or packaging annotations with raw medical images.

## Functional Requirements
1. **Built-in Export Formats**:
   - **YOLO**: Normalized bounding box coordinates `[class_id, x_center, y_center, width, height]` with a companion `classes.txt` file.
   - **COCO**: Standardized JSON structure containing `images`, `annotations` (absolute bounding boxes `[x, y, width, height]`), and `categories`.
   - **Pascal VOC**: Individual XML files containing image details and `object` coordinates (`xmin`, `ymin`, `xmax`, `ymax`).

2. **Custom Template Exporter**:
   - Provide a dynamic text-based template engine allowing users to specify a file convention using loops and placeholders.
   - Example placeholders: `{{filename}}`, `{{label}}`, `{{x_min}}`, `{{y_min}}`, `{{width}}`, `{{height}}`, `{{image_width}}`, `{{image_height}}`.
   - Supports rendering custom CSV, JSON, or TXT formats easily.

3. **Export Configurations & Controls**:
   - **Include Raw Images Toggle**: Checkbox to toggle between full dataset download (images + annotations) and annotations-only download.
   - **Filters**: Filter exports by task status (e.g., `completed` only) and specific active labels.
   - **Format Selection**: Dropdown to select YOLO, COCO, Pascal VOC, or Custom Template.

4. **HMI Integration**:
   - **Workspace Panel**: Export button in the annotation workspace to download current task annotations.
   - **Project Dashboard**: Bulk export button in the Project Detail view to compile all tasks in the project.

5. **Delivery Channels**:
   - **Direct Download**: Packages files into a ZIP archive and triggers browser download.
   - **Server Storage**: Saves export to backend storage and returns a link.
   - **Google Drive Sync**: Saves the exported ZIP archive to the user's integrated Google Drive folder.

## Acceptance Criteria
- [ ] Users can trigger the Export dialog from both the Project Dashboard and Workspace view.
- [ ] Users can toggle "Include Raw Images" off and download only annotation files.
- [ ] Exports in YOLO, COCO, and Pascal VOC correctly format coordinates (normalized vs. absolute).
- [ ] Custom templates replace placeholders correctly.
- [ ] The export output can be successfully downloaded as a ZIP file or synced to Google Drive.
