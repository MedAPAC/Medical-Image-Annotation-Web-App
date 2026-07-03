# Implementation Plan - Track: Pluggable Semi-Supervised Annotation & Interactive Tooling

This document outlines the phased plan to implement the modular, pluggable semi-supervised annotation system.

## Phase 1: Core Interfaces and Mock Inference Engine [checkpoint: b4c5fc1]
- [x] Task: Define Base Input and Output Structures [999d104]
    - [x] Write tests defining the structures of `BasePrompt` and `BaseModelOutput`
    - [x] Implement `BasePrompt` with Point, Box, and Text prompt subclasses
    - [x] Implement `BaseModelOutput` with Polygon, Mask, Box, Classification, and Keypoint output subclasses
    - [x] Verify test suite runs and all type definitions pass compile checks
- [x] Task: Implement Pluggable Inference Runner [e68c24a]
    - [x] Write unit tests for pluggable `InferenceRunner` lifecycle and registration
    - [x] Implement abstract `InferenceRunner` and registration registry in the client application
    - [x] Implement `MockInferenceRunner` that simulates model predictions (polygons, masks, boxes, classification labels) using random/placeholder math
    - [x] Verify tests pass and runner returns correct mocked model outputs
- [x] Task: Implement Backend Placeholder API Routes [382a1c5]
    - [x] Write integration tests for backend inference API placeholder endpoints
    - [x] Implement HTTP POST endpoints in the Express server to receive prompts and return mock inference outputs
    - [x] Verify endpoints respond correctly with JSON payloads
- [x] Task: Conductor - User Manual Verification 'Core Interfaces and Mock Inference Engine' (Protocol in workflow.md)

## Phase 2: Interactive Prompting and Multi-Output Canvas Rendering [checkpoint: TBD]
- [ ] Task: Canvas Prompting Controls
    - [ ] Write tests for capturing points, boxes, and text prompts on the editor canvas
    - [ ] Implement mouse click listener (positive/negative clicks) and bounding box selection on Fabric.js canvas
    - [ ] Implement text input element in annotation panel to allow text prompts (for open-vocabulary detection)
    - [ ] Implement owner configuration options to enable/disable individual prompt modes
    - [ ] Verify inputs are correctly formatted into corresponding prompt subclass instances
- [ ] Task: Multi-Output Canvas Rendering
    - [ ] Write tests for rendering polygon nodes, mask overlays, box handles, keypoints, and metadata sync
    - [ ] Implement Fabric.js renderer for polygon nodes (with draggable, editable vertices)
    - [ ] Implement mask rendering layer (semi-transparent pixel overlays on top of Cornerstone viewports)
    - [ ] Implement keypoints rendering and bounding box rendering with scaling anchors
    - [ ] Verify that model outputs render correctly on the canvas and remain editable by the annotator
- [ ] Task: Sync Classification Labels with Sidebar
    - [ ] Write tests verifying dynamic update of task classification attributes from model predictions
    - [ ] Implement sidebar updater to synchronize predicted labels/attributes with task metadata properties
    - [ ] Verify task attributes panels refresh instantly when classification predictions are received
- [ ] Task: Conductor - User Manual Verification 'Interactive Prompting and Multi-Output Canvas Rendering' (Protocol in workflow.md)

## Phase 3: Bi-directional Polygon/Mask Converter [checkpoint: TBD]
- [ ] Task: Polygon-to-Mask Conversion Utility
    - [ ] Write unit tests for converting vector coordinates of arbitrary polygons to a 2D binary grid mask
    - [ ] Implement the polygon-to-mask rasterization function
    - [ ] Verify correctness of rasterized masks against original polygon shapes
- [ ] Task: Mask-to-Polygon Conversion Utility
    - [ ] Write unit tests for tracing boundary contours of a binary grid mask and generating polygon path coords
    - [ ] Implement mask contour tracing algorithm (such as Marching Squares or boundary tracking)
    - [ ] Verify correctness of traced polygons against original binary mask grids
- [ ] Task: Interactive Conversion Controls
    - [ ] Write integration tests for manual conversion triggers in the UI
    - [ ] Implement action buttons in the workspace viewer to trigger "Convert Polygon to Mask" and "Convert Mask to Polygon"
    - [ ] Verify that conversion operations update the canvas correctly and preserve editing functionality
- [ ] Task: Conductor - User Manual Verification 'Bi-directional Polygon/Mask Converter' (Protocol in workflow.md)
