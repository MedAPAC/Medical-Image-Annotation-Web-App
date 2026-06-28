import {
  Brush,
  Circle,
  CircleHelp,
  Eraser,
  Images,
  Layers3,
  Trash2,
  Paintbrush,
  Pentagon,
  PenLine,
  Save,
  SlidersHorizontal,
  Square,
  Tags,
  ZoomIn,
} from 'lucide-react';

export const SHAPES = [
  { name: 'ellipse', label: 'Ellipse', icon: Circle, shortcut: 'E' },
  { name: 'rectangle', label: 'Bounding box', icon: Square, shortcut: 'R' },
  { name: 'polygon', label: 'Polygon', icon: Pentagon, shortcut: 'P' },
  { name: 'polyline', label: 'Polyline', icon: PenLine, shortcut: 'L' },
  { name: 'brush', label: 'Brush', icon: Brush, shortcut: 'B' },
];

export const SECTION_ICONS = {
  labels: { icon: Tags, label: 'Active label' },
  window: { icon: SlidersHorizontal, label: 'Windowing' },
  opacity: { icon: Layers3, label: 'Overlay opacity' },
  brush: { icon: Paintbrush, label: 'Brush settings' },
};

export const LEFT_BUTTONS = [
  { id: 'classification', label: 'Classification and attributes', icon: Tags },
  { id: 'slices', label: 'Slice navigation', icon: Images },
  { id: 'zoom', label: 'Zoom controls', icon: ZoomIn },
  { id: 'help', label: 'Help and guidance', icon: CircleHelp },
];

export const RIGHT_BUTTONS = [
  {
    id: 'save',
    label: 'Save annotations',
    color: '#2563eb',
    icon: Save,
    onClick: () => {},
  },
  {
    id: 'clearAll',
    label: 'Clear all annotations',
    color: '#dc2626',
    icon: Eraser,
    onClick: (selectedFileName, annotationRefs) => {
      const ref = annotationRefs.current[selectedFileName];
      ref?.current?.clearAnnotations();
    },
  },
  {
    id: 'deleteSelected',
    label: 'Delete selected annotation',
    color: '#d97706',
    icon: Trash2,
    onClick: (selectedFileName, annotationRefs) => {
      const ref = annotationRefs.current[selectedFileName];
      ref?.current?.deleteSelected();
    },
  },
];

export const VIEW_TYPES = ['axial', 'coronal', 'sagittal'];
export const CLASSIFICATIONS = ['positive', 'negative', 'clear'];
