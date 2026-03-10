import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./authContext";

import LoginPage from "./pages/LoginPage";
import AdminDashboardLayout, { DashboardOverview } from "./pages/Admin/Dashboard";
import UsersPage from "./pages/Admin/Users";
import ClassroomsPage from "./pages/Admin/Classrooms";
import ClassroomDetail from "./pages/Admin/Classrooms/ClassroomDetail";
import ExamsPage from "./pages/Admin/Exams";
import ExamDetail from "./pages/Admin/ExamDetail";
import ExamEditor from "./pages/Admin/ExamEditor"; // New Editor
import SettingsPage from "./pages/Admin/Settings";
import RecycleBin from "./pages/Admin/RecycleBin";
import SubmissionsPage from "./pages/Admin/Submissions";
import SubmissionDetail from "./pages/Admin/SubmissionDetail";
import LogsPage from "./pages/Admin/Logs";
import StudentDashboard from "./pages/Student/Dashboard";
import ExamCodeEntry from "./pages/Student/ExamCodeEntry";
import ExamPlayer from "./pages/Student/ExamPlayer";

function PrivateRoute({ children, role }) {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    // Redirect to appropriate dashboard if role doesn't match
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <PrivateRoute role="admin">
                <AdminDashboardLayout />
              </PrivateRoute>
            }
          >
            <Route path="dashboard" element={<DashboardOverview />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="classrooms" element={<ClassroomsPage />} />
            <Route path="classrooms/:id" element={<ClassroomDetail />} />
            <Route path="exams" element={<ExamsPage />} />
            <Route path="exams/editor" element={<ExamEditor />} />
            <Route path="exams/editor/:id" element={<ExamEditor />} />
            <Route path="exams/:id" element={<ExamDetail />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="submissions" element={<SubmissionsPage />} />
            <Route path="submissions/:id" element={<SubmissionDetail />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="recycle-bin" element={<RecycleBin />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <PrivateRoute role="student">
                <StudentDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/student/join"
            element={
              <PrivateRoute role="student">
                <ExamCodeEntry />
              </PrivateRoute>
            }
          />
          <Route
            path="/student/exam/:id"
            element={
              <PrivateRoute role="student">
                <ExamPlayer />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
