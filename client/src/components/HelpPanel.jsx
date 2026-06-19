// annotation/components/Panels/HelpPanel.jsx
import React from "react";

const HelpPanel = ({ t }) => {
  const guidance = [
    {
      title: t("Drawing"),
      body: t("Choose a tool, select the correct label, then draw directly on the image. Finish polygon and polyline annotations with Enter."),
    },
    {
      title: t("Editing"),
      body: t("Use Select mode to reveal vertex handles. Drag a handle to refine the shape, or press Delete/Backspace to remove the selected annotation."),
    },
    {
      title: t("Labels"),
      body: t("The active project label is applied to each new annotation. Labels stay attached to the annotation edge so they do not cover the image unnecessarily."),
    },
    {
      title: t("Files and slices"),
      body: t("Use the file selector for separate NIfTI files. DICOM slices from one upload are treated as one series. Current annotations are kept when you change files or slices."),
    },
    {
      title: t("Collaboration"),
      body: t("When another user saves this task, your page receives the update live. If you have unsaved local edits, the app warns you instead of replacing your work."),
    },
    {
      title: t("Zoom"),
      body: t("Use region zoom for fine detail. While zoom-region mode is active, drawing pauses until the region is selected or zoom is reset."),
    },
    {
      title: t("Windowing"),
      body: t("Adjust window center and width to improve contrast for DICOM or NIfTI images. Reset returns the viewer to automatic display settings."),
    },
    {
      title: t("Saving"),
      body: t("Save before leaving the task. Saving stores annotations, slice classifications, and attribute values for the active file, then notifies other open viewers."),
    },
  ];

  return (
    <div className="help-guide">
      {guidance.map((item) => (
        <div className="help-card" key={item.title}>
          <h4>{item.title}</h4>
          <p>{item.body}</p>
        </div>
      ))}
    </div>
  );
};

export default HelpPanel;
