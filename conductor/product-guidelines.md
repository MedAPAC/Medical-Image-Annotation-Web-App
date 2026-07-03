# Product Guidelines: MediAnnotate

## 1. UI/UX Aesthetics & Branding
* **Hybrid/Adaptive Theme:** The application must support a seamless transition between Dark Mode and Light Mode via a prominent, easily accessible toggle.
* **Reading Room Optimization:** Dark Mode is the primary design target, utilizing low-brightness, high-contrast dark tones optimized for clinical reading rooms to reduce visual fatigue.
* **Hospital Workstation Compatibility:** Light Mode should utilize clean, professional clinical blue/white schemes to ensure legibility on standard hospital ward screens.

## 2. Interaction Design & HMI (Human-Machine Interface)
* **Hybrid Precision Controls:** Integrate fluid mouse/pointer-based drawing with rapid keyboard hotkeys.
  * *Mouse/Stylus:* Precise point placement for polygons, brush masks, and bounding boxes on the canvas.
  * *Keyboard:* Quick keys for view manipulation (Zoom, Pan, Window/Contrast adjustments) and fast slice navigation (Arrow keys).
* **Responsive State Feedback:** Ensure visual cues (e.g. cursor shape changes, hover highlights, vertex selection handles) are responsive to prevent clinical annotator frustration.

## 3. Prose, Copywriting & Help System
* **Helpful Guidance Tone:** User interface microcopy, labels, and system messages should be supportive and educational.
* **Contextual Tooltips:** Provide inline, hoverable tooltips explaining the behavior, hotkeys, and best practices for each drawing tool, making the platform self-documenting for clinical training.
* **Standard Medical Terminology:** Ensure correct usage of clinical terminology (e.g. Axial, Coronal, Sagittal, Hounsfield units) rather than generic geometry jargon.

## 4. Security & De-identification UX
* **Strict Whitelist Anonymization:**
  * **Default Policy:** Strict, complete de-identification. By default, all personal health information (PHI) tags and potential identifiers in DICOM/NIfTI metadata are completely stripped.
  * **Configurable Whitelist:** Project owners can configure a custom metadata whitelist to selectively preserve non-identifiable parameters (e.g. Scanner Model, Slice Thickness, anonymized Modality details) for publication or machine learning feature extraction.
* **Anonymization Status Badges:** Display clear, color-coded badges in the file viewer indicating whether the active image's metadata is fully anonymized, partially whitelisted, or contains raw patient data.
