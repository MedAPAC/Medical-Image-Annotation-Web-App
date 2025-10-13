import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import NiftiViewer from "./NiftiViewer";
import DicomViewer from "./DicomViewer";
import AnnotationCanvas from "./AnnotationCanvas";
import { useTranslation } from "react-i18next";
import "./App.css";
import "./i18n";
import { Link, useNavigate } from "react-router-dom";
import SignupPage from "./pages/signup";
import ProjectsPage from "./pages/Projects";
import LoginPage from "./pages/login";
import UploadPage from "./pages/Upload";
import HomePage from "./pages/Home";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import {
  Circle,
  Sun,
  RectangleHorizontal,
  Contrast,
  PenTool,
  Box,
  Shapes,
  Brush,
  LogOut,
  User,
} from "lucide-react";

const shapes = [
  { name: "ellipse", icon: Circle },
  { name: "rectangle", icon: RectangleHorizontal },
  { name: "polygon", icon: Shapes },
  { name: "polyline", icon: PenTool },
  { name: "cuboid", icon: Box },
  { name: "brush", icon: Brush },
];

// Header component with authentication
function Header({ page, setPage }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const changeLang = (lng) => {
    i18n.changeLanguage(lng);
    axios.defaults.headers.common["Accept-Language"] = lng;
    document.documentElement.lang = lng; 
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
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

      <div style={{ display: "flex", gap: "20px" }}>
        <button 
          onClick={() => navigate('/projects')}
          style={{ 
            textDecoration: "none",
            cursor: "pointer",
            fontSize: "16px",
            color: page === "projects" ? "#0066cc" : "#004c99",
            transition: "color 0.3s, transform 0.3s",
            background: "none",
            border: "none"
          }}
          onMouseOver={(e) => {
            e.target.style.color = "#0066cc";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseOut={(e) => {
            e.target.style.color = page === "projects" ? "#0066cc" : "#004c99";
            e.target.style.transform = "scale(1)";
          }}
        >
          Projects
        </button>
        <button
          onClick={() => navigate('/upload')}
          style={{ 
            textDecoration: "none",
            cursor: "pointer",
            fontSize: "16px",
            color: page === "upload" ? "#0066cc" : "#004c99",
            transition: "color 0.3s, transform 0.3s",
            background: "none",
            border: "none"
          }}
          onMouseOver={(e) => {
            e.target.style.color = "#0066cc";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseOut={(e) => {
            e.target.style.color = page === "upload" ? "#0066cc" : "#004c99";
            e.target.style.transform = "scale(1)";
          }}
        >
          Upload
        </button>
        <button
          onClick={() => navigate('/home')}
          style={{
            cursor: "pointer",
            fontSize: "16px",
            color: page === "home" ? "#0066cc" : "#004c99",
            transition: "color 0.3s, transform 0.3s",
            background: "none",
            border: "none"
          }}
          onMouseOver={(e) => {
            e.target.style.color = "#0066cc";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseOut={(e) => {
            e.target.style.color = page === "home" ? "#0066cc" : "#004c99";
            e.target.style.transform = "scale(1)";
          }}
        >
          Home
        </button>
        <button
          onClick={() => navigate('/')}
          style={{
            cursor: "pointer",
            fontSize: "16px",
            color: page === "tasks" ? "#0066cc" : "#004c99",
            transition: "color 0.3s, transform 0.3s",
            background: "none",
            border: "none"
          }}
          onMouseOver={(e) => {
            e.target.style.color = "#0066cc";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseOut={(e) => {
            e.target.style.color = page === "tasks" ? "#0066cc" : "#004c99";
            e.target.style.transform = "scale(1)";
          }}
        >
          Tasks
        </button>
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        {isAuthenticated ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={16} />
              <span style={{ fontSize: "14px", color: "#004c99" }}>
                {user?.name || user?.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: "6px 12px",
                backgroundColor: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "background-color 0.3s",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#b91c1c")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#dc2626")}
            >
              <LogOut size={14} />
              Logout
            </button>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}

// Main App component
function AppContent() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to home page if authenticated, otherwise show home page
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/home');
    } else {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);
  
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
  const [brushColor, setBrushColor] = useState("#00FF00");
  const [brushSize, setBrushSize] = useState(10);
  const [toolChangeId, setToolChangeId] = useState(0);
  const [sliceClassifications, setSliceClassifications] = useState({});
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

  const currentClassification = classificationByFile[selectedFileName] || null;
  const [classificationByFileAndSlice, setClassificationByFileAndSlice] = useState({});
  const [currentSlice, setCurrentSlice] = useState(0);

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
        if (ref?.current?.exportAnnotations) {
          const annotations = ref.current.exportAnnotations();
          const classification = classificationByFileAndSlice[originalName] || null;
          await axios.post("http://localhost:5000/save-annotations", {
            filename,
            annotations,
            classification,
          });
        }
      }
      alert("All Changes Saved Successfully!.");
    } catch (err) {
      alert("Failed to Save Changes. Please Try Again!.");
    }
  };

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
              `http://localhost:5000/annotations/${filename}`
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
      <>
        <Header page={page} setPage={setPage} />
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
      <Header page={page} setPage={setPage} />

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
        <div
          style={{
            flexBasis: "250px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "rgba(255,255,255,0.7)",
            border: "1px solid #bae6fd",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          }}
        >
          {[
            { id: "window", title: t("windowSettings"), icon: Sun },
            { id: "labels", title: t("labels"), icon: Shapes },
            { id: "shapes", title: t("shapes"), icon: Circle },
            { id: "opacity", title: t("opacity"), icon: Brush },
            { id: "brush", title: t("brushSettings"), icon: PenTool },
          ].map(({ id, title, icon: Icon }) => (
            <div key={id} style={{ borderBottom: "1px solid #e2e8f0" }}>
              <button
                onClick={() => setOpenSection(openSection === id ? null : id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "10px 12px",
                  background: openSection === id ? "#eff6ff" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 500,
                  color: "#334155",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icon size={18} /> {title}
                </span>
                <span>{openSection === id ? "▲" : "▼"}</span>
              </button>

              {/* Accordion Content */}
              {openSection === id && (
                <div style={{ padding: "10px 12px", background: "#fff" }}>
                  {id === "window" && (
                    <>
                      <label>
                        {t("windowCenter")}:
                        <input
                          type="number"
                          value={windowCenter ?? ""}
                          onChange={(e) =>
                            setWindowCenter(e.target.value === "" ? null : Number(e.target.value))
                          }
                        />
                      </label>
                      <label>
                        {t("windowWidth")}:
                        <input
                          type="number"
                          value={windowWidth ?? ""}
                          onChange={(e) =>
                            setWindowWidth(e.target.value === "" ? null : Number(e.target.value))
                          }
                        />
                      </label>
                      <button onClick={() => { setWindowCenter(null); setWindowWidth(null); }}>
                        {t("reset")}
                      </button>
                    </>
                  )}

                  {id === "labels" && (
                    <>
                      <input
                        type="text"
                        placeholder={t("enterLabel")}
                        value={selectedLabel}
                        onChange={(e) => setSelectedLabel(e.target.value)}
                      />
                      <select
                        value={selectedLabel}
                        onChange={(e) => setSelectedLabel(e.target.value)}
                      >
                        <option value="">{t("selectLabel")}</option>
                        {labelOptions.map((label) => (
                          <option key={label} value={label}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </>
                  )}

                  {id === "shapes" && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {shapes.map(({ name, icon: ShapeIcon }) => (
                        <button
                          key={name}
                          onClick={() => {
                            setSelectedShape(name);
                            setToolChangeId((prev) => prev + 1);
                          }}
                          style={{
                            padding: "6px",
                            borderRadius: "50%",
                            border:
                              selectedShape === name
                                ? "2px solid #2563eb"
                                : "1px solid #cbd5e1",
                            background:
                              selectedShape === name ? "#eff6ff" : "#fff",
                          }}
                          title={name}
                        >
                          <ShapeIcon
                            size={20}
                            color={selectedShape === name ? "#1d4ed8" : "#334155"}
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {id === "opacity" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={annotationOpacity}
                        onChange={(e) => setAnnotationOpacity(Number(e.target.value))}
                      />
                      <span>{Math.round(annotationOpacity * 100)}%</span>
                    </div>
                  )}

                  {id === "brush" && selectedShape === "brush" && (
                    <>
                      <label>
                        {t("brushColor")}:
                        <input
                          type="color"
                          value={brushColor}
                          onChange={(e) => setBrushColor(e.target.value)}
                        />
                      </label>
                      <label>
                        {t("brushSize")}:
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={brushSize}
                          onChange={(e) => setBrushSize(Number(e.target.value))}
                        />
                        {brushSize}
                      </label>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          {selectedFileName &&
            (() => {
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

              return (
                <div
                  style={{
                    background: "#fff",
                    borderRadius: "16px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                    padding: "16px",
                    position: "relative",
                    width: "600px",
                    height: "680px",
                    border: "4px solid " +
                      (classificationByFileAndSlice[selectedFileName]?.[currentSlice] === "positive"
                        ? "green"
                        : classificationByFileAndSlice[selectedFileName]?.[currentSlice] === "negative"
                        ? "red"
                        : "#cbd5e1"),
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: zoomRegion
                      ? `${(zoomRegion.x + zoomRegion.width / 2) / 6}% ${(zoomRegion.y + zoomRegion.height / 2) / 6}%`
                      : "center center",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
                    {file.originalName}
                  </h2>
                  <div
                    style={{
                      position: "relative",
                      width: "600px",
                      height: "600px",
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: "1px solid #e2e8f0",
                      cursor: isZoomMode ? "crosshair" : "default",
                    }}
                    onMouseDown={(e) => {
                      if (!isZoomMode) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                      setDragEnd(null);
                    }}
                    onMouseMove={(e) => {
                      if (!isZoomMode || !dragStart) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      setDragEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                    onMouseUp={() => {
                      if (isZoomMode && dragStart && dragEnd) {
                        const dx = Math.abs(dragEnd.x - dragStart.x);
                        const dy = Math.abs(dragEnd.y - dragStart.y);

                        // Simple zoom factor based on ROI size
                        const zoom = Math.min(600 / dx, 600 / dy);
                        setZoomLevel(Math.min(Math.max(zoom, 1), 5)); // clamp 1–5
                        setZoomRegion({ x: dragStart.x, y: dragStart.y, width: dx, height: dy });

                        // Exit zoom mode automatically
                        setIsZoomMode(false);
                      }
                      setDragStart(null);
                      setDragEnd(null);
                    }}
                  >
                    {/* Your DicomViewer / NiftiViewer */}
                    {isDicom ? (
                      <DicomViewer
                        imageIds={imageIds}
                        windowCenter={windowCenter}
                        windowWidth={windowWidth}
                        onSliceChange={setCurrentSlice}
                        setTotalSlices={setTotalSlices}
                      />
                    ) : (
                      <NiftiViewer
                        url={`http://localhost:5000/uploads/${file.filename}`}
                        windowCenter={windowCenter}
                        windowWidth={windowWidth}
                        onSliceChange={setCurrentSlice}
                        setTotalSlices={setTotalSlices}
                      />
                    )}

                    {/* Annotation Overlay */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 10,
                      }}
                    >
                      <AnnotationCanvas
                        ref={annotationRefs.current[file.originalName]}
                        mode={selectedShape}
                        width={600}
                        height={600}
                        selectedLabel={selectedLabel}
                        brushColor={brushColor}
                        brushSize={brushSize}
                        toolChangeId={toolChangeId}
                        annotationOpacity={annotationOpacity}
                      />
                    </div>

                    {/* ROI Selection Rectangle (draw feedback) */}
                    {dragStart && dragEnd && (
                      <div
                        style={{
                          position: "absolute",
                          left: Math.min(dragStart.x, dragEnd.x),
                          top: Math.min(dragStart.y, dragEnd.y),
                          width: Math.abs(dragEnd.x - dragStart.x),
                          height: Math.abs(dragEnd.y - dragStart.y),
                          border: "2px dashed #3b82f6",
                          backgroundColor: "rgba(59,130,246,0.2)",
                          pointerEvents: "none",
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })()}
        </div>

        {/* Right Sidebar (Accordion Style like Left Sidebar) */}
        <div
          style={{
            flexBasis: "250px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "rgba(255,255,255,0.7)",
            border: "1px solid #bae6fd",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          }}
        >
          {[
            { id: "classification", title: t("classification"), icon: Circle },
            { id: "slices", title: t("slices"), icon: RectangleHorizontal },
            { id: "annotations", title: t("annotations"), icon: Brush },
            { id: "zoom", title: t("zoom"), icon: Shapes },
          ].map(({ id, title, icon: Icon }) => (
            <div key={id} style={{ borderBottom: "1px solid #e2e8f0" }}>
              {/* Accordion Header */}
              <button
                onClick={() => setOpenSection(openSection === id ? null : id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "10px 12px",
                  background: openSection === id ? "#eff6ff" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 500,
                  color: "#334155",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icon size={18} /> {title}
                </span>
                <span>{openSection === id ? "▲" : "▼"}</span>
              </button>

              {/* Accordion Content */}
              {openSection === id && (
                <div style={{ padding: "10px 12px", background: "#fff" }}>
                  {id === "classification" && selectedFileName && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span style={{ fontWeight: 500, color: "#334155" }}>
                        {t("classification")} (Slice {currentSlice + 1}):
                      </span>
                      <button
                        onClick={() =>
                          setClassificationByFileAndSlice((prev) => ({
                            ...prev,
                            [selectedFileName]: {
                              ...(prev[selectedFileName] || {}),
                              [currentSlice]: "positive",
                            },
                          }))
                        }
                        style={{
                          padding: "8px",
                          backgroundColor: "#059669",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        {t("positive")} (P)
                      </button>
                      <button
                        onClick={() =>
                          setClassificationByFileAndSlice((prev) => ({
                            ...prev,
                            [selectedFileName]: {
                              ...(prev[selectedFileName] || {}),
                              [currentSlice]: "negative",
                            },
                          }))
                        }
                        style={{
                          padding: "8px",
                          backgroundColor: "#dc2626",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        {t("negative")} (N)
                      </button>
                      <button
                        onClick={() => {
                          setClassificationByFileAndSlice((prev) => {
                            const updated = { ...(prev[selectedFileName] || {}) };
                            delete updated[currentSlice];
                            return { ...prev, [selectedFileName]: updated };
                          });
                        }}
                        style={{
                          padding: "8px",
                          backgroundColor: "#f59e0b",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        {t("clear")}
                      </button>
                    </div>
                  )}

                  {id === "slices" && (
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => setShowSlices((prev) => !prev)}
                        style={{
                          padding: "8px",
                          backgroundColor: "#3b82f6",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          width: "100%",
                        }}
                      >
                        {t("slices")}
                      </button>
                      {showSlices && (
                        <div
                          style={{
                            position: "absolute",
                            top: "110%",
                            left: 0,
                            right: 0,
                            background: "#fff",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            maxHeight: "200px",
                            overflowY: "auto",
                            zIndex: 20,
                          }}
                        >
                          {Array.from({ length: totalSlices }, (_, i) => (
                            <div
                              key={i}
                              onClick={() => {
                                setCurrentSlice(i);
                                setShowSlices(false);
                              }}
                              style={{
                                padding: "6px 10px",
                                cursor: "pointer",
                                background: i === currentSlice ? "#e0f2fe" : "#fff",
                                borderBottom: "1px solid #f1f5f9",
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
                    </div>
                  )}

                  {id === "annotations" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <button
                        onClick={handleSaveAllAnnotations}
                        style={{
                          padding: "8px",
                          backgroundColor: "#059669",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        {t("save")}
                      </button>
                      <button
                        onClick={() => {
                          const ref = annotationRefs.current[selectedFileName];
                          if (ref?.current?.clearAnnotations) ref.current.clearAnnotations();
                        }}
                        style={{
                          padding: "8px",
                          backgroundColor: "#dc2626",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        {t("clearAll")}
                      </button>
                      <button
                        onClick={() => {
                          const ref = annotationRefs.current[selectedFileName];
                          if (ref?.current?.deleteSelected) ref.current.deleteSelected();
                        }}
                        style={{
                          padding: "8px",
                          backgroundColor: "#f59e0b",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        {t("deleteSelected")}
                      </button>
                    </div>
                  )}

                  {id === "zoom" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <button
                        onClick={() => setIsZoomMode((prev) => !prev)}
                        style={{
                          padding: "8px",
                          backgroundColor: isZoomMode ? "#f59e0b" : "#3b82f6",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        {isZoomMode ? t("cancelZoom") : t("selectZoomArea")}
                      </button>
                      <button
                        onClick={() => {
                          setZoomLevel(1);
                          setZoomRegion(null);
                          setIsZoomMode(false);
                        }}
                        style={{
                          padding: "8px",
                          backgroundColor: "#64748b",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        {t("resetZoom")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main App component with Router and AuthProvider
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;