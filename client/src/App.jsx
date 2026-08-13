import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/useAuth";
import { ROLES } from "./utils/permissions";

// Auth pages
import Login from "./pages/Login/Login";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail/VerifyEmail";
import ChangePassword from "./pages/ChangePassword/ChangePassword";
import Unauthorized from "./pages/unauthorized/Unauthorized";

// Dashboard
import Dashboard from "./pages/Dashboard/Dashboard";

// CRUD modules (Standardized PascalCase paths)
import Students from "./pages/Students/Students";
import AddStudent from "./pages/Students/AddStudent";
import EditStudent from "./pages/Students/EditStudent";
import StudentDetails from "./pages/Students/StudentDetails";

import Faculty from "./pages/Faculty/Faculty";
import AddFaculty from "./pages/Faculty/AddFaculty";
import EditFaculty from "./pages/Faculty/EditFaculty";
import FacultyDetails from "./pages/Faculty/FacultyDetails";

import Departments from "./pages/Departments/Departments";
import AddDepartment from "./pages/Departments/AddDepartment";
import EditDepartment from "./pages/Departments/EditDepartment";
import DepartmentDetails from "./pages/Departments/DepartmentDetails";

import Courses from "./pages/Courses/Courses";
import AddCourse from "./pages/Courses/AddCourse";
import EditCourse from "./pages/Courses/EditCourse";
import CourseDetails from "./pages/Courses/CourseDetails";

import Timetable from "./pages/Timetable/Timetable";
import Reports from "./pages/reports/Reports";
import Settings from "./pages/Settings/Settings";

// Feature modules
import Analytics from "./pages/Analytics/Analytics";
import Attendance from "./pages/Attendance/Attendance";
import Exams from "./pages/Exams/Exams";
import Results from "./pages/Results/Results";
import Fees from "./pages/Fees/Fees";
import Files from "./pages/Files/Files";
import Notifications from "./pages/Notifications/Notifications";
import Admissions from "./pages/Admissions/Admissions";
import Curriculum from "./pages/Curriculum/Curriculum";
import Workload from "./pages/Workload/Workload";
import Jobs from "./pages/Jobs/Jobs";

function GuestRedirect({ to }) {
  const location = useLocation();
  return <Navigate to={to} replace state={{ from: location }} />;
}

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <span className="spinner" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Loading your workspace…
        </p>
      </div>
    </div>
  );
}

function AdminApp() {
  const adminOnly = [ROLES.ADMIN];

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <Students />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students/add"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <AddStudent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students/edit/:id"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <EditStudent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students/details/:id"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <StudentDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <Faculty />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/add"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <AddFaculty />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/edit/:id"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <EditFaculty />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/details/:id"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <FacultyDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/departments"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <Departments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/departments/add"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <AddDepartment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/departments/edit/:id"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <EditDepartment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/departments/details/:id"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <DepartmentDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <Courses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses/add"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <AddCourse />
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses/edit/:id"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <EditCourse />
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses/details/:id"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <CourseDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/timetable"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <Timetable />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <Analytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <Attendance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/exams"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <Exams />
            </ProtectedRoute>
          }
        />

        <Route
          path="/results"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <Results />
            </ProtectedRoute>
          }
        />

        <Route
          path="/fees"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <Fees />
            </ProtectedRoute>
          }
        />

        <Route
          path="/files"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <Files />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admissions"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <Admissions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/curriculum"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <Curriculum />
            </ProtectedRoute>
          }
        />

        <Route
          path="/workload"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <Workload />
            </ProtectedRoute>
          }
        />

        <Route
          path="/jobs"
          element={
            <ProtectedRoute allowedRoles={adminOnly}>
              <Jobs />
            </ProtectedRoute>
          }
        />

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/change-password" element={<ChangePassword />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </MainLayout>
  );
}

function App() {
  const { token, isInitializing } = useAuth();

  if (isInitializing) {
    return <AuthLoading />;
  }

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="*" element={<GuestRedirect to="/login" />} />
      </Routes>
    );
  }

  return (
    <>
      <AdminApp />
      <Toaster position="top-right" />
    </>
  );
}

export default App;
