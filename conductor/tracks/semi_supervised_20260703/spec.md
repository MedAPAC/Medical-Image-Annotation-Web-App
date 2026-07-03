# Track Specification: Pluggable Semi-Supervised Annotation & Interactive Tooling

## 1. Overview
This track implements a flexible, pluggable semi-supervised AI annotation framework. The system is designed to allow the integration of different AI model runtimes (interactive models like SAM/MedSAM, text-guided open-vocabulary detectors like Grounding DINO / CLIP, automatic segmentation like U-Net, or external APIs) and support diverse model outputs (polygons, masks, bounding boxes, keypoints, multi-label classification attributes, and text description). Crucially, the system will enable manual editing of predicted annotations and provide bi-directional conversion between vector polygons and raster pixel-level masks.

## 2. Functional Requirements
### A. Pluggable Inference Engine
*   **Modular Runner Interface:** Abstract the inference runtime into a pluggable interface (`InferenceRunner`) with client-side (e.g., ONNX Runtime Web), local backend proxy (e.g., executing Python scripts or dockerized services), and cloud API integrations.
*   **Base Classes for Inputs and Outputs:** Define base classes/interfaces for:
    *   *Input Prompts:* A base prompt class (`BasePrompt`) extended by point, box, and text prompts.
    *   *Model Outputs:* A base output class (`BaseModelOutput`) extended by polygon, mask, box, classification, and keypoint outputs.
    This architecture ensures the engine is open for extension but closed for modification, allowing future developers to easily implement new prompt types or output representations.
*   **API Placeholder Service:** Implement a mock API client service and REST endpoints in the Express server to serve as a placeholder for third-party or hospital-hosted cloud inference APIs.
*   **Local Test Suite / Mock Models:** Enable download/loading of lightweight dummy/random weights/models (or mock endpoints) to run integration tests for the prediction pipeline without heavy GPU requirements.

### B. Flexible Trigger & Prompt Interface
*   **Prompt Type Options (Configurable):** Allow the project owner/system to configure which inputs the active model accepts:
    *   *Point Prompts:* Click points (positive/negative clicks) on the image.
    *   *Box Prompts:* Bounding boxes enclosing the region of interest.
    *   *Text / Language Prompts:* Free-text input fields (e.g., "lung nodule", "fracture") passed to language-guided open-vocabulary models (e.g. Grounding DINO, CLIP).
*   **Automatic Pre-labeling (U-Net Mode):** Trigger inference automatically on image loading to predict segmentations/labels without requiring user prompt coordinates or text.

### C. Multi-Output Canvas Rendering & Sync
*   **Output Handler:** Parse and render multiple model output structures onto the Fabric.js annotation canvas and sidebar panels:
    *   *Polygons:* Render as editable vector shapes with draggable control nodes/vertices.
    *   *Masks:* Render as translucent colorized pixel overlays on the image canvas.
    *   *Bounding Boxes:* Render as standard rectangular bounds with scaling anchors.
    *   *Keypoints / Landmarks:* Render point landmarks on the canvas.
    *   *Multi-Label Classification & Attributes:* Parse predicted classification tags, confidence levels, or attributes, and dynamically update the task's metadata, classification labels, and attributes panels.
*   **Draggable Refinement:** Ensure annotators can manually reposition vertices of predicted polygons or shift bounding boxes directly in the UI.

### D. Bi-directional Mask/Polygon Converter (Core Utility)
*   **Polygon-to-Mask Conversion:** Convert Fabric.js/SVG polygon vector coordinates into a 2D binary grid mask (pixel mask matrix matching the viewport dimensions).
*   **Mask-to-Polygon Conversion:** Trace the boundaries of pixel-level binary masks (using contour-finding algorithms like Marching Squares) to generate smooth Fabric.js vector polygon objects.

## 3. Acceptance Criteria
*   Pluggable `InferenceRunner` architecture created with documented interfaces.
*   Abstract Base Classes/interfaces (`BasePrompt` and `BaseModelOutput`) implemented.
*   Working dummy/mock model integrations for end-to-end local validation.
*   Interactive canvas UI that accepts user point, box, or text prompts and displays model-generated predictions.
*   Automatic synchronization of predicted classification labels and attributes with the task sidebar panels.
*   Successful bi-directional conversion between polygons and masks, supported by unit tests.
*   All public modules fully typed and documented following code guidelines.

## 4. Out of Scope
*   Training or fine-tuning of machine learning models.
*   Production-ready hospital API integration (only placeholder API structure is in-scope).
