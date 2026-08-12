import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout'

// Auth pages
import Login from './pages/Login/Login'
import ForgotPassword from './pages/ForgotPassword/ForgotPassword'
import ResetPassword from './pages/ResetPassword/ResetPassword'
import VerifyEmail from './pages/VerifyEmail/VerifyEmail'
import ChangePassword from './pages/ChangePassword/ChangePassword'
import Unauthorized from './pages/unauthorized/Unauthorized'

// Dashboard
import Dashboard from './pages/Dashboard/Dashboard'

// CRUD modules (Standardized PascalCase paths)
import Students from './pages/Students/Students'
import AddStudent from './pages/Students/AddStudent'
import EditStudent from './pages/Students/EditStudent'
import StudentDetails from './pages/Students/StudentDetails'

import Faculty from './pages/Faculty/Faculty'
import AddFaculty from './pages/Faculty/AddFaculty'
import EditFaculty from './pages/Faculty/EditFaculty'
import FacultyDetails from './pages/Faculty/FacultyDetails'

import Departments from './pages/Departments/Departments'
import AddDepartment from './pages/Departments/AddDepartment'
import EditDepartment from './pages/Departments/EditDepartment'
import DepartmentDetails from './pages/Departments/DepartmentDetails'

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
    <>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected routes inside MainLayout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  )
}

export default App
