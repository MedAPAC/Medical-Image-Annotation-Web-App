// annotation/components/Panels/HelpPanel.jsx
import React from "react";

const HelpPanel = ({ t }) => {
  return (
    <>
      <div><b>{t("classification")}:</b> {t("Assign classification to a slice")}</div>
      <div><b>{t("Slices Settings")}:</b> {t("Navigate and jump between slices")}</div>
      <div><b>{t("Zoom")}:</b> {t("Zoom into selected region, use mouse wheel to zoom in/out, or reset zoom")}</div>
      <div><b>{t("Window Settings")}:</b> {t("Adjust window center and width for better contrast visualization")}</div>
      <div><b>{t("Labels")}:</b> {t("Select or assign labels for structures or findings")}</div>
      <div><b>{t("Annotation Tools")}:</b> {t("Draw shapes (circle, rectangle, etc.) to highlight regions of interest")}</div>
      <div><b>{t("Opacity Settings")}:</b> {t("Adjust annotation transparency for better image clarity")}</div>
      <div><b>{t("Brush Settings")}:</b> {t("Use brush tool to annotate regions, adjust size and color")}</div>
    </>
  );
};

export default HelpPanel;