# Track Specification: Environment Setup, Architecture Audit & Vulnerability Scan

## Overview
This track initiates the project setup and environment configuration, followed by a comprehensive audit of the application code. It focuses on establishing a clean Conda environment, scanning for architectural patterns, mapping HMI features, and auditing security and performance vulnerabilities.

## Scope & Requirements
1. **Conda & Dependency Setup:**
   - Initialize a local Conda environment named `mediannotate` using Python 3.10.
   - Install required packages (e.g. standard developer utility libraries or scripts dependencies).
   - Install local Node.js dependencies (`npm install`) for both the frontend (`client/`) and backend (`server/`).
2. **Architecture Audit:**
   - Map out the directory structure and the interactions between the React frontend and Express backend.
   - Summarize code modularity and state management.
3. **HMI Feature Mapping:**
   - Detail the canvas interaction layer (Fabric.js, Cornerstone.js, VTK.js).
   - Document how 2D medical images (X-rays) and metadata inspections can be integrated or are currently handled.
4. **Security & Bug Scanning:**
   - Inspect API endpoints, JWT token verification, and session configurations.
   - Locate and list potential loopholes, missing validations, or performance bottlenecks (canvas memory leaks, unoptimized database queries).

## Acceptance Criteria
- Conda environment successfully created and activated.
- Node.js dependencies installed in both frontend and backend directories without syntax errors.
- Comprehensive audit report generated documenting the codebase structure, HMI mechanisms, and security/performance gaps.
- Unit tests written and passing for any custom setup/helper scripts created.
