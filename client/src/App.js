import React from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import "./i18n";
import UILocalizer from "./i18n/UILocalizer";
import { AuthProvider } from "./AuthContext";
import SignupPage from "./pages/SignUp";
import ProjectsPage from "./pages/Projects";
import ProjectDetailPage from "./pages/ProjectDetail";
import LoginPage from "./pages/Login";
import AnnotationPage from "./pages/Annotation";
import UploadPage from "./pages/Upload";
import HomePage from "./pages/Home";
import TasksPage from "./pages/Tasks";
import TaskDetailPage from "./pages/TaskDetail";
import TeamManagementPage from "./pages/TeamManagement";

function App() {
  return (
    <AuthProvider>
      <Router>
        <UILocalizer />
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/annotation/:taskId" element={<AnnotationPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
          <Route path="/teams" element={<TeamManagementPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
