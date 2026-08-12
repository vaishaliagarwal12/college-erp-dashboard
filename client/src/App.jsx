import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import { useAuth } from "./context/useAuth";
import { ROLES, canAccess } from "./utils/permissions";

import Login from "./pages/login/Login";
import Unauthorized from "./pages/unauthorized/Unauthorized";
import Dashboard from "./pages/dashboard/Dashboard";
import Students from "./pages/students/Students";
import AddStudent from "./pages/students/AddStudent";
import EditStudent from "./pages/students/EditStudent";
import StudentDetails from "./pages/students/StudentDetails";

import Faculty from "./pages/faculty/Faculty";
import AddFaculty from "./pages/faculty/AddFaculty";
import EditFaculty from "./pages/faculty/EditFaculty";
import FacultyDetails from "./pages/faculty/FacultyDetails";

import Departments from "./pages/department/Departments";
import AddDepartment from "./pages/department/AddDepartment";
import EditDepartment from "./pages/department/EditDepartment";
import DepartmentDetails from "./pages/department/DepartmentDetails";

import Courses from "./pages/courses/Courses";
import AddCourse from "./pages/courses/AddCourse";
import EditCourse from "./pages/courses/EditCourse";
import CourseDetails from "./pages/courses/CourseDetails";

import Timetable from "./pages/timetable/Timetable";
import Reports from "./pages/reports/Reports";

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

function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  const role = user?.role;

  if (canAccess(role, allowedRoles)) {
    return children;
  }

  return <Unauthorized />;
}

function ProtectedApp() {
  const adminOnly = [ROLES.ADMIN];

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />

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
        {/* Faculty Routes */}
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
        <Route path="*" element={<GuestRedirect to="/login" />} />
      </Routes>
    );
  }

  return <ProtectedApp />;
}

export default App;