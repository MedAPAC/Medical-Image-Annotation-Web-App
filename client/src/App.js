import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import NiftiViewer from "./NiftiViewer";
import DicomViewer from "./DicomViewer";
import AnnotationCanvas from "./AnnotationCanvas";
import { useTranslation } from "react-i18next";
import "./App.css";
import "./i18n";
import { Link } from "react-router-dom";
import SignupPage from "./pages/signup";
import LoginPage from "./pages/login";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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



const shapes = [
  { name: "ellipse", icon: elipseIcon },
  { name: "rectangle", icon: boundingIcon },
  { name: "polygon", icon: polygonIcon },
  { name: "polyline", icon: polylineIcon },
  { name: "brush", icon: brushIcon },
];

const sectionIcons = {
  window: windowIcon,
  labels: labelsIcon,
  opacity: opacityIcon,
  brush: brushSettingIcon,
};


function App() {
  const [page, setPage] = useState("upload");
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedShape, setSelectedShape] = useState("polygon");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [labelOptions, setLabelOptions] = useState(["L1", "L2", "L3"]);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [windowCenter, setWindowCenter] = useState(null);
  const [windowWidth, setWindowWidth] = useState(null);
  const [uploadMode, setUploadMode] = useState("nifti");
  const [brushColor, setBrushColor] = useState("rgba(173, 216, 230)");
  const [brushSize, setBrushSize] = useState(10);
  const [toolChangeId, setToolChangeId] = useState(0);
  const [annotationOpacity, setAnnotationOpacity] = useState(0.4);
  const annotationRefs = useRef({});
  const { t, i18n } = useTranslation();
  const [classificationByFile, setClassificationByFile] = React.useState({});
  const [showSlices, setShowSlices] = useState(false);
const [dragStart, setDragStart] = useState(null);
const [dragEnd, setDragEnd] = useState(null);
const [openSection, setOpenSection] = useState(null);
  const [totalSlices, setTotalSlices] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isZoomMode, setIsZoomMode] = useState(false);
const [zoomRegion, setZoomRegion] = useState(null);
const [inputsByFileAndSlice, setInputsByFileAndSlice] = useState({});
  const currentClassification = classificationByFile[selectedFileName] || null;
  const [classificationByFileAndSlice, setClassificationByFileAndSlice] =
    useState({});
  const [currentSlice, setCurrentSlice] = useState(0);
const slicesRef = useRef(null);
const [leftDrawerOpen, setLeftDrawerOpen] = useState(null); 
const [rightPanelOpen, setRightPanelOpen] = useState(null);
const [viewType, setViewType] = useState("axial");


useEffect(() => {
  if (showSlices && slicesRef.current) {
    const selected = slicesRef.current.querySelector(`#slice-${currentSlice}`);
    selected?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}, [showSlices, currentSlice]);


  const changeLang = (lng) => {
    i18n.changeLanguage(lng);
    axios.defaults.headers.common["Accept-Language"] = lng;
    document.documentElement.lang = lng; 
  };
const getInputsForCurrent = () => inputsByFileAndSlice[selectedFileName]?.[currentSlice] || 
{ checkbox: false, number: "", text: "", radio: "", select: "", };
 const updateInputsForCurrent = (updates) => { setInputsByFileAndSlice((prev) => ({ ...prev, [selectedFileName]: { ...(prev[selectedFileName] || {}), [currentSlice]: { ...(prev[selectedFileName]?.[currentSlice] || {}), ...updates, }, }, })); };
  const addFiles = (newFiles) => {
    const validFiles = newFiles.filter((file) => {
      const lowerName = file.name.toLowerCase();
      if (uploadMode === "nifti") {
        return lowerName.endsWith(".nii") || lowerName.endsWith(".nii.gz");
      } else if (uploadMode === "dicom") {
        return lowerName.endsWith(".dcm");
      }
      return false;
    });
    const existingNames = new Set(files.map((f) => f.name));
    const filtered = validFiles.filter((f) => !existingNames.has(f.name));
    setFiles((prev) => [...prev, ...filtered]);
  };

const buttons = [
  { id: "classification", icon: labelsIcon, isImage: true },
  { id: "slices", icon: sliceIcon, isImage: true },
  { id: "zoom", icon: zoomIcon, isImage: true },
  { id: "help", icon: helpIcon, isImage: true },
];



  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  };

  const handleFileChange = (e) => {
    const inputFiles = Array.from(e.target.files);
    addFiles(inputFiles);
    e.target.value = null;
  };

  const handleUpload = async () => {
    const newUploadedFiles = [...uploadedFiles];
    for (const file of files) {
      const alreadyUploaded = newUploadedFiles.find(
        (f) => f.originalName === file.name
      );
      if (alreadyUploaded) continue;

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await axios.post("http://localhost:5000/upload", formData, {
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: percent,
            }));
          },
        });

        const lowerName = file.name.toLowerCase();
        let type = "unknown";
        if (lowerName.endsWith(".nii") || lowerName.endsWith(".nii.gz"))
          type = "nifti";
        else if (lowerName.endsWith(".dcm")) type = "dicom";

        newUploadedFiles.push({
          originalName: file.name,
          filename: res.data.filename,
          type,


        });
      } catch (err) {
        console.error("Upload error:", err);
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
      }
    }

    setUploadedFiles(newUploadedFiles);
    if (newUploadedFiles.length > 0) {
      setSelectedFileName(newUploadedFiles[0].originalName);
    }
  };

  const allUploaded =
    files.length > 0 &&
    files.every((f) => uploadProgress[f.name] === 100) &&
    uploadedFiles.length === files.length;

const handleSaveAllAnnotations = async () => {
  try {
    for (const { originalName, filename } of uploadedFiles) {
      const ref = annotationRefs.current[originalName];
      const annotations = ref?.current?.exportAnnotations
        ? ref.current.exportAnnotations()
        : null;

      const classificationData = classificationByFileAndSlice[originalName] || {};
      const inputData = inputsByFileAndSlice[originalName] || {};

      const sliceData = Object.keys({
        ...classificationData,
        ...inputData,
      }).reduce((acc, sliceIndex) => {
        acc[sliceIndex] = {
          classification: classificationData[sliceIndex] || null,
          inputs: inputData[sliceIndex] || {},
        };
        return acc;
      }, {});

      await axios.post("http://localhost:5000/save-annotations", {
        filename,
        annotations,
        slices: sliceData,
      });
    }

    alert("All Changes Saved Successfully!");
  } catch (err) {
    console.error(err);
    alert("Failed to Save Changes. Please Try Again!");
  }
};
 const buttons_right = [
  { id: "save", color: "#10b981", icon: saveIcon, onClick: handleSaveAllAnnotations },
  { id: "clearAll", color: "#ef4444", icon: trashIcon, onClick: () => {
      const ref = annotationRefs.current[selectedFileName];
      ref?.current?.clearAnnotations();
    },
  },
  { id: "deleteSelected", color: "#f59e0b", icon: deleteIcon, onClick: () => {
      const ref = annotationRefs.current[selectedFileName];
      ref?.current?.deleteSelected();
    },
  },
];
useEffect(() => {
  const handleKeyDown = (e) => {
    if (!selectedFileName) return;

    if (e.key === "ArrowRight") {
      setCurrentSlice((prev) =>
        Math.min(prev + 1, totalSlices - 1)
      );
    } else if (e.key === "ArrowLeft") {
      setCurrentSlice((prev) =>
        Math.max(prev - 1, 0)
      );
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [selectedFileName, totalSlices]);

    useEffect(() => {
  if (page === "annotate") {
    window.scrollTo(0, 0);
  }
}, [page]);

  useEffect(() => {
    if (page === "annotate") {
      uploadedFiles.forEach(async ({ originalName, filename }) => {
        const ref = annotationRefs.current[originalName];
        if (ref?.current?.importAnnotations) {
          try {
            const res = await axios.get(
              `http://localhost:5000/annotations/${filename}.json`
            );
            if (res.data) {
              ref.current.importAnnotations(res.data);
            }
          } catch (err) {
            console.warn(`No saved annotations found for ${originalName}`);
          }
        }
      });
    }
  }, [page, uploadedFiles]);

  if (page === "upload") {
    return (
      <Router>
        <>
          {/* <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#d0e7ff",
              padding: "10px 20px",
              fontFamily: "Arial, sans-serif",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            }}
          >
            <div>
              <select
                onChange={(e) => changeLang(e.target.value)}
                defaultValue="en"
                style={{
                  fontSize: "16px",
                  padding: "6px",
                  border: "1px solid #a0cfff",
                  borderRadius: "4px",
                  backgroundColor: "#f5faff",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#e1f0ff")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "#f5faff")}
              >
                <option value="" disabled></option>
                <option value="en">🇬🇧 EN</option>
                <option value="fa">🇮🇷 فارسی</option>
                <option value="nl">🇳🇱 NL</option> 
              </select>
            </div>

            <div style={{ display: "flex", gap: "20px" }}>
              {["Projects", "Tasks"].map((item) => (
                <span
                  key={item}
                  style={{
                    cursor: "pointer",
                    fontSize: "16px",
                    color: "#004c99",
                    transition: "color 0.3s, transform 0.3s",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.color = "#0066cc";
                    e.target.style.transform = "scale(1.05)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.color = "#004c99";
                    e.target.style.transform = "scale(1)";
                  }}
                >
                  {item}
                </span>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <Link to="/login" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#a0d4ff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                    transition: "background-color 0.3s",
                  }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = "#87c8ff")}
                  onMouseOut={(e) => (e.target.style.backgroundColor = "#a0d4ff")}
                >
                  Login
                </button>
              </Link>
              <Link to="/signup" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#007acc",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                    transition: "background-color 0.3s",
                  }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = "#005fa3")}
                  onMouseOut={(e) => (e.target.style.backgroundColor = "#007acc")}
                >
                  Sign Up
                </button>
              </Link>
            </div>
          </div>
          <Routes>
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes> */}
          <div className="upload-container">
            <h1 className="upload-title">{t("uploadTitle")}</h1>
            <div className="upload-mode-selector">
              <label>
                <input
                  type="radio"
                  name="uploadMode"
                  value="nifti"
                  checked={uploadMode === "nifti"}
                  onChange={() => {
                    setFiles([]);
                    setUploadProgress({});
                    setUploadedFiles([]);
                    setSelectedFileName(null);
                    setUploadMode("nifti");
                  }}
                />
                NIfTI
              </label>
              <label>
                <input
                  type="radio"
                  name="uploadMode"
                  value="dicom"
                  checked={uploadMode === "dicom"}
                  onChange={() => {
                    setFiles([]);
                    setUploadProgress({});
                    setUploadedFiles([]);
                    setSelectedFileName(null);
                    setUploadMode("dicom");
                  }}
                />
                DICOM
              </label>
            </div>

            <div
              className="upload-dropzone"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById("fileInput").click()}
            >
              <p dir={i18n.dir(i18n.language)}>
                {uploadMode === "dicom"
                  ? t("dragDropDicom")
                  : t("dragDropNifti")}{" "}
              </p>
              <input
                id="fileInput"
                type="file"
                multiple
                {...(uploadMode === "dicom"
                  ? { webkitdirectory: "true", directory: "true", accept: ".dcm" }
                  : { accept: ".nii,.nii.gz" })}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="upload-file-list">
              {files.map((file) => {
                const progress = uploadProgress[file.name] || 0;
                return (
                  <div key={file.name} className="upload-file">
                    <div className="upload-file-header">
                      <span className="file-name">{file.name}</span>
                      <span className="file-progress">{progress}%</span>
                    </div>
                    <div className="upload-progress-bar">
                      <div
                        className="upload-progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="upload-actions">
              <button
                onClick={handleUpload}
                disabled={files.length === 0 || allUploaded}
                className="btn-primary"
              >
                {t("upload")}
              </button>
              <button
                onClick={() => setPage("annotate")}
                disabled={!allUploaded}
                className="btn-success"
              >
                {t("next")}
              </button>
            </div>
          </div>
        </>
      </Router>
    );
  }

return (
  <div
    style={{
      minHeight: "100vh",
      background: "linear-gradient(to bottom, #f8fafc, #fff)",
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#d0e7ff",
        padding: "10px 20px",
        fontFamily: "Arial, sans-serif",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
      }}
    >
      <div>
        <select
          onChange={(e) => changeLang(e.target.value)}
          defaultValue="en"
          style={{
            fontSize: "16px",
            padding: "6px",
            border: "1px solid #a0cfff",
            borderRadius: "4px",
            backgroundColor: "#f5faff",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#e1f0ff")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#f5faff")}
        >
          <option value="" disabled></option>
          <option value="en">🇬🇧 EN</option>
          <option value="fa">🇮🇷 فارسی</option>
          <option value="nl">🇳🇱 NL</option> 
        </select>
      </div>
    </div>

{/* Main Layout */}
<div
  style={{
    flex: 1,
    display: "grid",
    gridTemplateColumns: "250px 1fr 250px",
    gap: "16px",
    padding: "16px",
    height: "100%",
  }}
>
  {/* Left Sidebar (Tools) */}
<div style={{ flexBasis: "48px", flexShrink: 0 }}> </div>
{/* Left Sidebar */}
<div
  style={{
    position: "fixed",
    top: "56px", // below navbar
    left: 0,
    bottom: 0,
    width: "56px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRight: "1px solid #e2e8f0",
    padding: "16px 0",
    boxShadow: "0 0 8px rgba(0,0,0,0.1)",
    zIndex: 50,
    gap: "16px",
  }}
>
{/* Shapes Section (always visible) */}
<div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
  {shapes.map(({ name, icon }) => (
    <button
      key={name}
      onClick={() => {
        setSelectedShape(name);
        setToolChangeId((prev) => prev + 1);
      }}
      style={{
        width: "48px",
        height: "48px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "12px",
        border: selectedShape === name ? "2px solid #2563eb" : "1px solid #cbd5e1",
        background: selectedShape === name ? "#eff6ff" : "#fff",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseOver={(e) => {
        if (selectedShape !== name) e.currentTarget.style.background = "#f0f9ff";
      }}
      onMouseOut={(e) => {
        if (selectedShape !== name) e.currentTarget.style.background = "#fff";
      }}
    >
      {typeof icon === "string" ? (
        <img
          src={icon}
          alt={name}
          style={{
            width: 24,
            height: 24,
            filter: selectedShape === name ? "invert(34%) sepia(87%) saturate(3390%) hue-rotate(212deg) brightness(95%) contrast(95%)" : "none",
          }}
        />
      ) : (
        <icon size={24} color={selectedShape === name ? "#1d4ed8" : "#334155"} />
      )}
    </button>
  ))}
</div>


{/* Expandable Sections */}
  {["window", "labels", "opacity", "brush"].map((id) => (
    <button
      key={id}
      onClick={() => setOpenSection(openSection === id ? null : id)}
      style={{
        width: "48px",
        height: "48px",
        border: "none",
        borderRadius: "12px",
        background: openSection === id ? "#e0f2fe" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "background 0.2s",
        padding: 0,
      }}
    >
      <img
        src={sectionIcons[id]}
        alt={id}
        style={{
          width: 24,
          height: 24,
          filter: openSection === id 
            ? "invert(34%) sepia(87%) saturate(3390%) hue-rotate(212deg) brightness(95%) contrast(95%)" 
            : "none",
        }}
      />
    </button>
  ))}
</div>

{/* Left Drawer for expandable sections */}
<div
  style={{
    position: "fixed",
    top: "56px",
    left: openSection ? "80px" : "-280px", // slide in next to sidebar
    bottom: 0,
    width: "280px",
    background: "#fff",
    borderRight: "1px solid #e2e8f0",
    boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
    overflowY: "auto",
    zIndex: 40,
    transition: "left 0.3s ease",
    padding: "16px",
  }}
>
{/* Window Settings */}
{openSection === "window" && (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      backgroundColor: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      padding: "12px",
    }}
  >
    <span
      style={{
        fontWeight: 600,
        color: "#1e293b",
        fontSize: "14px",
        textAlign: "center",
        width: "100%",
      }}
    >
      {t("Window Settings")}
    </span>

    {["windowCenter", "windowWidth"].map((key) => (
      <div key={key} style={{ display: "flex", flexDirection: "column" }}>
        <label
          style={{
            fontWeight: 600,
            color: "#1e293b",
            fontSize: "14px",
            marginBottom: "4px",
          }}
        >
          {t(key)}
        </label>
        <input
          type="number"
          value={key === "windowCenter" ? windowCenter ?? "" : windowWidth ?? ""}
          onChange={(e) =>
            key === "windowCenter"
              ? setWindowCenter(e.target.value === "" ? null : Number(e.target.value))
              : setWindowWidth(e.target.value === "" ? null : Number(e.target.value))
          }
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
            fontSize: "14px",
            outline: "none",
            transition: "all 0.2s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
        />
      </div>
    ))}

    <button
      onClick={() => {
        setWindowCenter(null);
        setWindowWidth(null);
      }}
      style={{
        padding: "8px 12px",
        backgroundColor: "#3b82f6",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: 500,
        fontSize: "14px",
        transition: "all 0.2s",
        alignSelf: "flex-start",
      }}
      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
    >
      {t("reset")}
    </button>
  </div>
)}

{/* Labels */}
{openSection === "labels" && (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      backgroundColor: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      padding: "12px",
    }}
  >
    <span
      style={{
        fontWeight: 600,
        color: "#1e293b",
        fontSize: "14px",
        textAlign: "center",
        width: "100%",
      }}
    >
      {t("Labels")}
    </span>

    <select
      value={selectedLabel}
      onChange={(e) => setSelectedLabel(e.target.value)}
      style={{
        padding: "8px 12px",
        borderRadius: "6px",
        border: "1px solid #cbd5e1",
        fontSize: "14px",
        outline: "none",
        transition: "all 0.2s",
        cursor: "pointer",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
    >
      <option value="">{t("selectLabel")}</option>
      {labelOptions.map((label) => (
        <option key={label} value={label}>
          {label}
        </option>
      ))}
    </select>
  </div>
)}

{/* Opacity */}
{openSection === "opacity" && (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      backgroundColor: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      padding: "12px",
      alignItems: "center",
    }}
  >
    <span
      style={{
        fontWeight: 600,
        color: "#1e293b",
        fontSize: "14px",
        textAlign: "center",
        width: "100%",
      }}
    >
      {t("Opacity")}
    </span>

    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "8px 12px",
        backgroundColor: "#fff",
        borderRadius: "8px",
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
        width: "100%",
      }}
    >
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={annotationOpacity}
        onChange={(e) => setAnnotationOpacity(Number(e.target.value))}
        style={{
          flex: 1,
          cursor: "pointer",
          accentColor: "#3b82f6",
          height: "6px",
          borderRadius: "4px",
          background: "linear-gradient(to right, #3b82f6, #76a4d8ff)",
          outline: "none",
        }}
      />
      <span
        style={{
          marginLeft: "8px",
          fontSize: "12px",
          fontWeight: 500,
          color: "#1e293b",
          minWidth: "32px",
          textAlign: "right",
        }}
      >
        {Math.round(annotationOpacity * 100)}%
      </span>
    </div>
  </div>
)}



{/* Brush Settings */}
{openSection === "brush" && selectedShape === "brush" && (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      backgroundColor: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      padding: "12px",
    }}
  >
    <span
      style={{
        fontWeight: 600,
        color: "#1e293b",
        fontSize: "14px",
        textAlign: "center",
        width: "100%",
      }}
    >
      {t("Brush Settings")}
    </span>

    <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {t("brushColor")}:
      <input
        type="color"
        value={brushColor}
        onChange={(e) => setBrushColor(e.target.value)}
        style={{ cursor: "pointer" }}
      />
    </label>

    <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {t("brushSize")}:
      <input
        type="range"
        min="1"
        max="50"
        value={brushSize}
        onChange={(e) => setBrushSize(Number(e.target.value))}
        style={{ flex: 1, cursor: "pointer" }}
      />
      <span style={{ minWidth: "24px", textAlign: "right" }}>{brushSize}</span>
    </label>
  </div>
)}
</div>
{/* Main Viewer */}
<div
  style={{
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  }}
>
  {selectedFileName && (() => {
    const file = uploadedFiles.find((f) => f.originalName === selectedFileName);
    if (!file) return null;

    if (!annotationRefs.current[file.originalName]) {
      annotationRefs.current[file.originalName] = React.createRef();
    }

    const isDicom = file.type === "dicom";
    const dicomFiles = isDicom ? uploadedFiles.filter((f) => f.type === "dicom") : [];
    const imageIds = dicomFiles.map(
      (f) => `wadouri:http://localhost:5000/uploads/${f.filename}`
    );

    const classification =
      classificationByFileAndSlice[selectedFileName]?.[currentSlice];
    const borderColor =
      classification === "positive"
        ? "#16a34a"
        : classification === "negative"
        ? "#dc2626"
        : "#94a3b8";

    const glowColor =
      classification === "positive"
        ? "rgba(22,163,74,0.3)"
        : classification === "negative"
        ? "rgba(220,38,38,0.3)"
        : "rgba(148,163,184,0.25)";

    return (
      <div
        style={{
          borderRadius: "16px",
          boxShadow: `0 3px 12px rgba(0,0,0,0.08), 0 0 0 2px ${glowColor}`,
          position: "relative",
          border: `1px solid ${borderColor}`,
          transition: "all 0.3s ease",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "max-content",
          height: "max-content",
          padding: "8px",
        }}
      >
        {/* Image + Annotation Wrapper */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          {/* Image + overlays */}
          <div
            style={{
              position: "relative",
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid #e2e8f0",
              background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
           {isDicom ? (
  <DicomViewer
    imageIds={imageIds}
    windowCenter={windowCenter}
    windowWidth={windowWidth}
    currentSlice={currentSlice}
    onSliceChange={setCurrentSlice}
    setTotalSlices={setTotalSlices}
     zoomLevel={zoomLevel}
  zoomRegion={zoomRegion}
  isZoomMode={isZoomMode}
    viewType={viewType} // ✅ Added
    style={{
      display: "block",
      maxWidth: "100%",
      maxHeight: "100%",
      objectFit: "contain",
    }}
  />
) : (
  <NiftiViewer
    url={`http://localhost:5000/uploads/${file.filename}`}
    windowCenter={windowCenter}
    windowWidth={windowWidth}
    currentSlice={currentSlice}
    onSliceChange={setCurrentSlice}
    setTotalSlices={setTotalSlices}
      isZoomMode={isZoomMode}
  zoomRegion={zoomRegion}
  zoomLevel={zoomLevel}
    viewType={viewType} 
    style={{
      display: "block",
      maxWidth: "100%",
      maxHeight: "100%",
      objectFit: "contain",
    }}
  />
)}

            {/* Annotation Layer */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 10,
                pointerEvents: "auto", // enable drawing
              }}
            >
              <AnnotationCanvas
                ref={annotationRefs.current[file.originalName]}
                mode={selectedShape}
                width={500}
                height={500}
                selectedLabel={selectedLabel}
                brushColor={brushColor}
                brushSize={brushSize}
                toolChangeId={toolChangeId}
                annotationOpacity={annotationOpacity}
              />
            </div>

            {/* Classification Tag */}
            {classification && (
              <div
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  backgroundColor: borderColor,
                  color: "#fff",
                  padding: "2px 6px",
                  borderRadius: "8px",
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "capitalize",
                  boxShadow: `0 0 5px ${glowColor}`,
                  zIndex: 20,
                  pointerEvents: "none", // does not block drawing
                }}
              >
                {classification}
              </div>
            )}
          </div>

          {/* Slice Info Badge */}
          <div
            style={{
              marginTop: "4px",
              fontSize: "12px",
              color: "#1e293b",
              backgroundColor: "#f1f5f9",
              padding: "4px 8px",
              borderRadius: "12px",
              display: "inline-block",
              fontWeight: 500,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              minWidth: "80px",
              textAlign: "center",
              pointerEvents: "none", 
              zIndex: 15,
            }}
          >
            Slice {currentSlice + 1} / {isDicom ? imageIds.length : totalSlices}
          </div>
        </div>
      </div>
    );
  })()}
</div>
</div>

{/* Right Toolbar */}
<div
  style={{
    position: "fixed",
    top: "56px", 
    right: 0,
    bottom: 0,
    width: "56px", 
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    padding: "12px 0",
    backgroundColor: "#f9fafb",
    borderLeft: "1px solid #e5e7eb",
    boxShadow: "-2px 0 6px rgba(0,0,0,0.05)",
    zIndex: 50,
  }}
>

  {buttons_right.map(({ id, color, icon, onClick }) => (
    <button
      key={id}
      onClick={onClick}
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "8px",
        border: "none",
        backgroundColor: color,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "scale(1.08)";
        e.currentTarget.style.boxShadow = "0 3px 8px rgba(0,0,0,0.15)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <img src={icon} alt={id} style={{ width: "18px", height: "18px" }} />
    </button>
  ))}


  <div style={{ flexGrow: 1 }} /> {/* Spacer */}

  {buttons.map(({ id, icon, isImage }) => (
    <button
      key={id}
      onClick={() => setRightPanelOpen(rightPanelOpen === id ? null : id)}
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "8px",
        border: "none",
        backgroundColor: rightPanelOpen === id ? "#e0f2fe" : "transparent",
        color: "#0f172a",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background-color 0.2s, transform 0.15s",
      }}
      onMouseOver={(e) => {
        if (rightPanelOpen !== id) e.currentTarget.style.backgroundColor = "#f1f5f9";
      }}
      onMouseOut={(e) => {
        if (rightPanelOpen !== id) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {isImage ? (
        <img src={icon} alt={id} style={{ width: 20, height: 20 }} />
      ) : (
        <icon size={20} /> // React component
      )}
    </button>
  ))}
</div>


<div
  style={{
    position: "fixed",
    top: "56px",
    right: rightPanelOpen ? "56px" : "-300px",
    bottom: 0,
    width: "280px",
    backgroundColor: "#ffffff",
    borderLeft: "1px solid #e5e7eb",
    boxShadow: "-4px 0 12px rgba(0,0,0,0.08)",
    overflowY: "auto",
    transition: "right 0.3s ease",
    zIndex: 40,
    padding: "20px 16px",
  }}
>
  
{rightPanelOpen === "classification" && (
  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
    
    {/* 🔹 Section 1: View Type */}
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "10px",
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
      }}
    >
      <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "14px" }}>
        {t("View Type")}
      </span>
      <div style={{ display: "flex", gap: "6px" }}>
        {["axial", "coronal", "sagittal"].map((view) => {
          const isActive = viewType === view;
          return (
            <button
              key={view}
              onClick={() => setViewType(view)}
              style={{
                padding: "6px 10px",
                backgroundColor: isActive ? "#3b82f6" : "#e2e8f0",
                color: isActive ? "#fff" : "#1e293b",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "12px",
                transition: "transform 0.1s, box-shadow 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {t(view.charAt(0).toUpperCase() + view.slice(1))}
            </button>
          );
        })}
      </div>
    </div>

    {/* 🔹 Section 2: Classification */}
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "10px",
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
      }}
    >
      <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "14px" }}>
        {t("Classification")} (Slice {currentSlice + 1}):
      </span>

      {/* Classification Buttons */}
      <div style={{ display: "flex", gap: "6px" }}>
        {["positive", "negative", "clear"].map((cls) => {
          const bgColor =
            cls === "positive"
              ? "#059669"
              : cls === "negative"
              ? "#dc2626"
              : "#f59e0b";
          return (
            <button
              key={cls}
              onClick={() => {
                if (cls === "clear") {
                  setClassificationByFileAndSlice((prev) => {
                    const updated = { ...(prev[selectedFileName] || {}) };
                    delete updated[currentSlice];
                    return { ...prev, [selectedFileName]: updated };
                  });
                } else {
                  setClassificationByFileAndSlice((prev) => ({
                    ...prev,
                    [selectedFileName]: {
                      ...(prev[selectedFileName] || {}),
                      [currentSlice]: cls,
                    },
                  }));
                }
              }}
              style={{
                padding: "6px 10px",
                backgroundColor: bgColor,
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "12px",
                transition: "transform 0.1s, box-shadow 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {t(cls)}
            </button>
          );
        })}
      </div>

      {/* Additional Inputs Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginTop: "8px",
        }}
      >
        {/* Checkbox Example */}
        <label
          style={{
            fontSize: "12px",
            color: "#1e293b",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <input
            type="checkbox"
            checked={getInputsForCurrent().checkbox}
            onChange={(e) =>
              updateInputsForCurrent({ checkbox: e.target.checked })
            }
            style={{ width: "14px", height: "14px", cursor: "pointer" }}
          />
          {t("Checkbox Example")}
        </label>

        {/* Number Input */}
        <label
          style={{
            fontSize: "12px",
            color: "#1e293b",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {t("Number Input Example")}:
          <input
            type="number"
            value={getInputsForCurrent().number}
            onChange={(e) =>
              updateInputsForCurrent({ number: e.target.value })
            }
            style={{
              padding: "6px 8px",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              fontSize: "12px",
              outline: "none",
              transition: "border 0.2s",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.border = "1px solid #2563eb")
            }
            onBlur={(e) =>
              (e.currentTarget.style.border = "1px solid #cbd5e1")
            }
          />
        </label>

        {/* Text Input */}
        <label
          style={{
            fontSize: "12px",
            color: "#1e293b",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {t("Text Input Example")}:
          <input
            type="text"
            value={getInputsForCurrent().text}
            onChange={(e) =>
              updateInputsForCurrent({ text: e.target.value })
            }
            style={{
              padding: "6px 8px",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              fontSize: "12px",
              outline: "none",
              transition: "border 0.2s",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.border = "1px solid #2563eb")
            }
            onBlur={(e) =>
              (e.currentTarget.style.border = "1px solid #cbd5e1")
            }
          />
        </label>

        {/* Radio Inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#1e293b",
            }}
          >
            {t("Radio Example")}:
          </span>
          {["Option A", "Option B", "Option C"].map((opt, idx) => (
            <label
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "#1e293b",
              }}
            >
              <input
                type="radio"
                name={`radioExample-${selectedFileName}-${currentSlice}`}
                checked={getInputsForCurrent().radio === opt}
                onChange={() => updateInputsForCurrent({ radio: opt })}
                style={{ width: "14px", height: "14px", cursor: "pointer" }}
              />
              {opt}
            </label>
          ))}
        </div>

        {/* Select Example */}
        <label
          style={{
            fontSize: "12px",
            color: "#1e293b",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {t("Select Example")}:
          <select
            value={getInputsForCurrent().select}
            onChange={(e) =>
              updateInputsForCurrent({ select: e.target.value })
            }
            style={{
              padding: "6px 8px",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer",
              outline: "none",
              transition: "border 0.2s",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.border = "1px solid #2563eb")
            }
            onBlur={(e) =>
              (e.currentTarget.style.border = "1px solid #cbd5e1")
            }
          >
            <option value="">{t("Choose...")}</option>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
            <option value="3">Option 3</option>
          </select>
        </label>
      </div>
    </div>
  </div>
)}

 {rightPanelOpen === "slices" && (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      backgroundColor: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      padding: "12px",
      position: "relative",
    }}
  >



    {/* 🔹 Choose Slice Button */}
    <button
      onClick={() => setShowSlices((prev) => !prev)}
      style={{
        padding: "6px 10px",
        backgroundColor: "#3b82f6",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: 500,
        fontSize: "13px",
        transition: "background 0.2s",
        width: "100%",
      }}
      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
    >
      {t("Choose a Slice")}
    </button>

    {showSlices && (
      <div
        ref={slicesRef}
        style={{
          position: "absolute",
          top: "105%",
          left: 0,
          right: 0,
          background: "#fff",
          border: "1px solid #cbd5e1",
          borderRadius: "8px",
          maxHeight: "250px",
          overflowY: "auto",
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        {Array.from({ length: totalSlices }, (_, i) => (
          <div
            key={i}
            id={`slice-${i}`}
            onClick={() => {
              const clamped = Math.min(i, totalSlices - 1);
              setCurrentSlice(clamped);
              setShowSlices(false);
            }}
            style={{
              padding: "8px 12px",
              cursor: "pointer",
              background: i === currentSlice ? "#e0f2fe" : "#fff",
              borderBottom: "1px solid #f1f5f9",
              fontSize: "12px",
              fontWeight: 500,
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#f0f9ff")}
            onMouseOut={(e) =>
              (e.currentTarget.style.background =
                i === currentSlice ? "#e0f2fe" : "#fff")
            }
          >
            Slice {i + 1}
          </div>
        ))}
      </div>
    )}

    <div
      style={{
        width: "90%",
        margin: "0 auto",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <input
        type="range"
        min={0}
        max={Math.max(totalSlices - 1, 0)}
        value={currentSlice}
        onChange={(e) => setCurrentSlice(Number(e.target.value))}
        style={{
          width: "100%",
          cursor: "pointer",
          height: "6px",
          marginBottom: "6px",
        }}
      />
      <div style={{ fontSize: "11px", color: "#64748b" }}>
        {t("Slice")} {currentSlice + 1} / {totalSlices}
      </div>
    </div>
  </div>
)}

 {rightPanelOpen === "zoom" && (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      backgroundColor: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      padding: "12px",
      position: "relative",
    }}
  >
    <span
      style={{
        fontWeight: 600,
        color: "#1e293b",
        fontSize: "14px",
        textAlign: "center",
        width: "100%",
      }}
    >
      {t("Zoom Controls")}
    </span>

    <button
      onClick={() => setIsZoomMode((prev) => !prev)}
      style={{
        padding: "6px 10px",
        backgroundColor: isZoomMode ? "#f59e0b" : "#6366f1",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: 500,
        fontSize: "13px",
        transition: "transform 0.1s, box-shadow 0.2s",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "scale(1.05)";
        e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {isZoomMode ? t("Cancel Zoom") : t("Select Zoom Area")}
    </button>

    <button
      onClick={() => {
        setZoomLevel(1);
        setZoomRegion(null);
        setIsZoomMode(false);
      }}
      style={{
        padding: "6px 10px",
        backgroundColor: "#64748b",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: 500,
        fontSize: "13px",
        transition: "transform 0.1s, box-shadow 0.2s",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "scale(1.05)";
        e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {t("Reset Zoom")}
    </button>
  </div>
)}

  {rightPanelOpen === "help" && (
    <> <div><b>{t("classification")}:</b> {t("Assign classification to a slice")}</div>
  <div><b>{t("Slices Settings")}:</b> {t("Navigate and jump between slices")}</div>
  <div><b>{t("Zoom")}:</b> {t("Zoom into selected region, use mouse wheel to zoom in/out, or reset zoom")}</div>
  <div><b>{t("Window Settings")}:</b> {t("Adjust window center and width for better contrast visualization")}</div>
  <div><b>{t("Labels")}:</b> {t("Select or assign labels for structures or findings")}</div>
  <div><b>{t("Annotation Tools")}:</b> {t("Draw shapes (circle, rectangle, etc.) to highlight regions of interest")}</div>
  <div><b>{t("Opacity Settings")}:</b> {t("Adjust annotation transparency for better image clarity")}</div>
  <div><b>{t("Brush Settings")}:</b> {t("Use brush tool to annotate regions, adjust size and color")}</div></>
  )}
</div>
  
</div>
);
  
}

export default App;

