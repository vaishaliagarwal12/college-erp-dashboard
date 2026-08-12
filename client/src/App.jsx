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

import Courses from './pages/Courses/Courses'
import AddCourse from './pages/Courses/AddCourse'
import EditCourse from './pages/Courses/EditCourse'
import CourseDetails from './pages/Courses/CourseDetails'

// ERP modules
import Admissions from './pages/Admissions/Admissions'
import Attendance from './pages/Attendance/Attendance'
import Exams from './pages/Exams/Exams'
import Results from './pages/Results/Results'
import Timetable from './pages/Timetable/Timetable'
import Curriculum from './pages/Curriculum/Curriculum'
import Workload from './pages/Workload/Workload'
import Files from './pages/Files/Files'
import Fees from './pages/Fees/Fees'
import Notifications from './pages/Notifications/Notifications'
import Analytics from './pages/Analytics/Analytics'
import Jobs from './pages/Jobs/Jobs'

function App() {
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
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="change-password" element={<ChangePassword />} />

          {/* Students CRUD */}
          <Route path="students" element={<Students />} />
          <Route path="students/add" element={<AddStudent />} />
          <Route path="students/edit/:id" element={<EditStudent />} />
          <Route path="students/details/:id" element={<StudentDetails />} />

          {/* Faculty CRUD */}
          <Route path="faculty" element={<Faculty />} />
          <Route path="faculty/add" element={<AddFaculty />} />
          <Route path="faculty/edit/:id" element={<EditFaculty />} />
          <Route path="faculty/details/:id" element={<FacultyDetails />} />

          {/* Departments CRUD */}
          <Route path="departments" element={<Departments />} />
          <Route path="departments/add" element={<AddDepartment />} />
          <Route path="departments/edit/:id" element={<EditDepartment />} />
          <Route path="departments/details/:id" element={<DepartmentDetails />} />

          {/* Courses CRUD */}
          <Route path="courses" element={<Courses />} />
          <Route path="courses/add" element={<AddCourse />} />
          <Route path="courses/edit/:id" element={<EditCourse />} />
          <Route path="courses/details/:id" element={<CourseDetails />} />

          {/* Other ERP modules */}
          <Route path="admissions" element={<Admissions />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="exams" element={<Exams />} />
          <Route path="results" element={<Results />} />
          <Route path="timetable" element={<Timetable />} />
          <Route path="curriculum" element={<Curriculum />} />
          <Route path="workload" element={<Workload />} />
          <Route path="files" element={<Files />} />
          <Route path="fees" element={<Fees />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="jobs" element={<Jobs />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  )
}

export default App
