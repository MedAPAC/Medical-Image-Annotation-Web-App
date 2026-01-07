// annotation/utils/constants.js
import boundingIcon from "./icons/bounding.png";
import brushIcon from "./icons/brush.png";
import elipseIcon from "./icons/elipse.png";
import polygonIcon from "./icons/polygon.png";
import polylineIcon from "./icons/polyline.svg";
import windowIcon from "./icons/window.png";
import labelsIcon from "./icons/label.png";
import opacityIcon from "./icons/opacity.png";
import brushSettingIcon from "./icons/brushsetting.png";
import sliceIcon from "./icons/slice.jpg";
import zoomIcon from "./icons/zoom.svg";
import helpIcon from "./icons/help.png";
import saveIcon from "./icons/save.jpg";
import trashIcon from "./icons/trash.png";
import deleteIcon from "./icons/delete.png";

export const SHAPES = [
  { name: "ellipse", icon: elipseIcon },
  { name: "rectangle", icon: boundingIcon },
  { name: "polygon", icon: polygonIcon },
  { name: "polyline", icon: polylineIcon },
  { name: "brush", icon: brushIcon },
];

export const SECTION_ICONS = {
  window: windowIcon,
  labels: labelsIcon,
  opacity: opacityIcon,
  brush: brushSettingIcon,
};

export const LEFT_BUTTONS = [
  { id: "classification", icon: labelsIcon, isImage: true },
  { id: "slices", icon: sliceIcon, isImage: true },
  { id: "zoom", icon: zoomIcon, isImage: true },
  { id: "help", icon: helpIcon, isImage: true },
];

export const RIGHT_BUTTONS = [
  { 
    id: "save", 
    color: "#10b981", 
    icon: saveIcon, 
    onClick: (params) => {} // Will be passed from parent
  },
  { 
    id: "clearAll", 
    color: "#ef4444", 
    icon: trashIcon, 
    onClick: (selectedFileName, annotationRefs) => {
      const ref = annotationRefs.current[selectedFileName];
      ref?.current?.clearAnnotations();
    }
  },
  { 
    id: "deleteSelected", 
    color: "#f59e0b", 
    icon: deleteIcon, 
    onClick: (selectedFileName, annotationRefs) => {
      const ref = annotationRefs.current[selectedFileName];
      ref?.current?.deleteSelected();
    }
  },
];

export const VIEW_TYPES = ["axial", "coronal", "sagittal"];
export const CLASSIFICATIONS = ["positive", "negative", "clear"];