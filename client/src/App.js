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
import LoginPage from "./pages/login"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import {
  Circle,
  RectangleHorizontal,
  PenTool,
  Box,
  Shapes,
  Brush,
} from "lucide-react";

const shapes = [
  { name: "ellipse", icon: Circle },
  { name: "rectangle", icon: RectangleHorizontal },
  { name: "polygon", icon: Shapes },
  { name: "polyline", icon: PenTool },
  { name: "cuboid", icon: Box },
  { name: "brush", icon: Brush },
];

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
  const [brushColor, setBrushColor] = useState("#00FF00");
  const [brushSize, setBrushSize] = useState(10);
  const [toolChangeId, setToolChangeId] = useState(0);
  const [sliceClassifications, setSliceClassifications] = useState({});
  const annotationRefs = useRef({});
  const { t, i18n } = useTranslation();
  const [classificationByFile, setClassificationByFile] = React.useState({});
  const currentClassification = classificationByFile[selectedFileName] || null;
  const [classificationByFileAndSlice, setClassificationByFileAndSlice] = useState({});
  const [currentSlice, setCurrentSlice] = useState(0);


  const changeLang = (lng) => {
  i18n.changeLanguage(lng);
  axios.defaults.headers.common["Accept-Language"] = lng;
};
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

      </Routes>
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
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
  </div>
</div>


      <div className="max-w-7xl mx-auto mb-6 flex flex-col gap-4">
        <div className="max-w-7xl mx-auto w-full rounded-xl bg-white/70 backdrop-blur border border-sky-100 shadow-sm px-4 py-3 flex flex-wrap items-center gap-6">
          <div className="flex gap-6 items-center">
            <label className="flex items-center gap-2 text-slate-700">
              <span className="font-medium">{t("windowCenter")}</span>
              <input
                type="number"
                className="border border-slate-200 bg-white rounded-md w-24 px-2 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300"
                value={windowCenter ?? ""}
                onChange={(e) =>
                  setWindowCenter(
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              />
            </label>
            <label className="flex items-center gap-2 text-slate-700">
              <span className="font-medium">{t("windowWidth")}</span>
              <input
                type="number"
                className="border border-slate-200 bg-white rounded-md w-24 px-2 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300"
                value={windowWidth ?? ""}
                onChange={(e) =>
                  setWindowWidth(
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              />
            </label>
            <button
              onClick={() => {
                setWindowCenter(null);
                setWindowWidth(null);
              }}
              className="ml-1 px-3 py-1.5 rounded-md text-sm bg-slate-200 hover:bg-slate-300 text-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              {t("reset")}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder={t("enterLabel")}
              className="px-3 py-2 border border-slate-200 bg-white rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
              value={selectedLabel}
              onChange={(e) => setSelectedLabel(e.target.value)}
            />
            <select
              className="px-3 py-2 border border-slate-200 bg-white rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300"
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
          </div>

          <div className="flex gap-2">
            {shapes.map(({ name, icon: Icon }) => (
              <button
                key={name}
                onClick={() => {
                  setSelectedShape(name);
                  setToolChangeId((prev) => prev + 1);
                }}
                className={`p-2 rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
                  selectedShape === name
                    ? "border-blue-600 bg-blue-50 shadow-sm"
                    : "border-slate-200 hover:bg-slate-100"
                }`}
                title={name}
                aria-label={`Select ${name} tool`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    selectedShape === name ? "text-blue-700" : "text-slate-700"
                  }`}
                />
              </button>
            ))}

          </div>
{selectedFileName && (
  <div className="classification-section flex items-center gap-4 mt-4">
  <span className="font-medium text-slate-700">{t("classification")} (Slice {currentSlice + 1}):</span>

  <button
    onClick={() => setClassificationByFileAndSlice((prev) => ({
      ...prev,
      [selectedFileName]: {
        ...(prev[selectedFileName] || {}),
        [currentSlice]: "positive",
      }
    }))}
className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-sm transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
    aria-label="Mark as Positive"
  >
    {t("positive")} (P)
  </button>

  <button
    onClick={() => setClassificationByFileAndSlice((prev) => ({
      ...prev,
      [selectedFileName]: {
        ...(prev[selectedFileName] || {}),
        [currentSlice]: "negative",
      }
    }))}
              className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 shadow-sm transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"

    aria-label="Mark as Negative"
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
className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 shadow-sm transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
            aria-label="Clear Classification"
  >
    {t("clear")}
  </button>
</div>

)}
          <div className="flex gap-3 items-center ml-auto">
            <button
              onClick={handleSaveAllAnnotations}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-sm transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
              aria-label="Save all annotations"
            >
                        {t("save")}
            </button>
            <button
              onClick={() => {
                const ref = annotationRefs.current[selectedFileName];
                if (ref?.current?.clearAnnotations) {
                  ref.current.clearAnnotations();
                }
              }}
              className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 shadow-sm transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
              aria-label="Clear all annotations"
            >
              {t("clearAll")}
            </button>
            <button
              onClick={() => {
                const ref = annotationRefs.current[selectedFileName];
                if (ref?.current?.deleteSelected) {
                  ref.current.deleteSelected();
                }
              }}
              className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 shadow-sm transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
              aria-label="Delete selected annotation"
            >
              {t("deleteSelected")}
            </button>
          </div>
        </div>

        {selectedShape === "brush" && (
          <div className="w-full rounded-xl bg-white/70 backdrop-blur border border-sky-100 shadow-sm px-4 py-3 flex items-center gap-6">
            <label className="flex items-center gap-2 text-slate-700">
              <span className="font-medium">{t("brushColor")}:</span>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="h-9 w-9 p-0 border border-slate-200 rounded cursor-pointer"
              />
            </label>
            <label className="flex items-center gap-3 text-slate-700">
              <span className="font-medium">{t("brushSize")}:</span>
              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="accent-blue-600"
              />
              <span className="inline-flex min-w-[2ch] justify-center font-medium text-slate-800">
                {brushSize}
              </span>
            </label>
          </div>
        )}

      </div>

      <div className="max-w-7xl mx-auto">
        {selectedFileName &&
          (() => {
            const file = uploadedFiles.find(
              (f) => f.originalName === selectedFileName
            );
            if (!file) return null;

            if (!annotationRefs.current[file.originalName]) {
              annotationRefs.current[file.originalName] = React.createRef();
            }

            const isDicom = file.type === "dicom";
            const dicomFiles = isDicom
              ? uploadedFiles.filter((f) => f.type === "dicom")
              : [];
            const imageIds = dicomFiles.map(
              (f) => `wadouri:http://localhost:5000/uploads/${f.filename}`
            );

            return (
              <div className="viewer-container">

<div
  key={file.originalName}
  className="bg-white rounded-2xl shadow-md p-4 relative mx-auto"
  style={{
    width: 600,
    height: 680,
    borderWidth: "4px",
    borderStyle: "solid",
    borderColor:
      classificationByFileAndSlice[selectedFileName]?.[currentSlice] === "positive"
        ? "green"
        : classificationByFileAndSlice[selectedFileName]?.[currentSlice] === "negative"
        ? "red"
        : "rgba(203, 213, 225, 1)",
  }}
>


                <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-3">
                  {file.originalName}
                </h2>
                <div
                  style={{ position: "relative", width: 600, height: 600 }}
                  className="rounded-xl overflow-hidden ring-1 ring-slate-200"
                >
                <div className="viewer-wrapper">
                  {isDicom ? (
                    <DicomViewer
                      imageIds={imageIds}
                      windowCenter={windowCenter}
                      windowWidth={windowWidth}
                      onSliceChange={setCurrentSlice}
                    />
                  ) : (
                    <NiftiViewer
                      url={`http://localhost:5000/uploads/${file.filename}`}
                      windowCenter={windowCenter}
                      windowWidth={windowWidth}
                      onSliceChange={setCurrentSlice}
                    />
                  )}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: 600,
                      height: 600,
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
                    />
                    </div>
                  </div>
                </div>
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
}

export default App;
