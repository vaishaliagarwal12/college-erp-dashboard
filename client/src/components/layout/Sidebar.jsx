import { useState } from 'react'
import {
  FaTachometerAlt,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaBuilding,
  FaBook,
  FaCalendarAlt,
  FaUniversity,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaClipboardCheck,
  FaFlask,
  FaFileAlt,
  FaBookOpen,
  FaBalanceScale,
  FaFolder,
  FaCreditCard,
  FaBell,
  FaChartBar,
  FaTools,
  FaGraduationCap,
} from 'react-icons/fa'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { canAccess } from '../../utils/permissions'

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: <FaTachometerAlt /> },
  { name: 'Admissions', path: '/admissions', icon: <FaGraduationCap /> },
  { name: 'Students', path: '/students', icon: <FaUserGraduate /> },
  { name: 'Faculty', path: '/faculty', icon: <FaChalkboardTeacher /> },
  { name: 'Departments', path: '/departments', icon: <FaBuilding /> },
  { name: 'Courses', path: '/courses', icon: <FaBook /> },
  { name: 'Attendance', path: '/attendance', icon: <FaClipboardCheck /> },
  { name: 'Exams', path: '/exams', icon: <FaFlask /> },
  { name: 'Results', path: '/results', icon: <FaFileAlt /> },
  { name: 'Timetable', path: '/timetable', icon: <FaCalendarAlt /> },
  { name: 'Curriculum', path: '/curriculum', icon: <FaBookOpen /> },
  { name: 'Workload', path: '/workload', icon: <FaBalanceScale /> },
  { name: 'Files', path: '/files', icon: <FaFolder /> },
  { name: 'Fees', path: '/fees', icon: <FaCreditCard /> },
  { name: 'Notifications', path: '/notifications', icon: <FaBell /> },
  { name: 'Analytics', path: '/analytics', icon: <FaChartBar /> },
  { name: 'Jobs', path: '/jobs', icon: <FaTools /> },
]

const iconButtonClass =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors duration-200 hover:bg-gray-800 hover:text-white'

function Sidebar({ open, onClose }) {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true'
    } catch {
      return false
    }
  })

  const persistCollapsed = (value) => {
    setCollapsed(value)
    try {
      localStorage.setItem('sidebar-collapsed', value ? 'true' : 'false')
    } catch {
      /* storage unavailable */
    }
  }

  const compact = collapsed && !open
  const visibleItems = menuItems.filter((item) =>
    typeof canAccess === 'function' ? canAccess(user?.role, item.roles) : true
  )

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-gray-900 shadow-xl transition-all duration-300 lg:static lg:translate-x-0 ${
        compact ? 'w-20' : 'w-72'
      } ${open ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* Brand */}
      <div
        className={`flex items-center border-b border-gray-800 py-5 ${
          compact ? 'justify-center px-2' : 'justify-between px-5'
        }`}
      >
        <div className={`flex items-center gap-3 ${compact ? 'flex-col' : ''}`}>
          <div className="rounded-xl bg-primary-600 p-2.5 shadow-card">
            <FaUniversity className="text-xl text-white" />
          </div>

          {!compact && (
            <div className="leading-tight">
              <h1 className="text-lg font-bold text-white">College ERP</h1>
              <p className="text-xs text-gray-400">Admin Dashboard</p>
            </div>
          )}
        </div>

        {!compact && (
          <button
            onClick={onClose}
            className={`${iconButtonClass} lg:hidden`}
            aria-label="Close sidebar"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            title={compact ? item.name : undefined}
            className={({ isActive }) =>
              `group relative flex items-center rounded-lg text-sm font-medium transition-all duration-200 ${
                compact ? 'justify-center py-3' : 'gap-3 px-3.5 py-2.5'
              } ${
                isActive
                  ? 'bg-primary-600 text-white shadow-card'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active route indicator */}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-white transition-opacity duration-200 ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                <span className="text-lg">{item.icon}</span>

                {!compact && <span className="flex-1">{item.name}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-800 px-3 py-3">
        {!compact ? (
          <>
            <p className="px-2 text-xs text-gray-500">© 2026 College ERP</p>
            <button
              onClick={() => persistCollapsed(true)}
              className={`${iconButtonClass} hidden lg:flex`}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <FaChevronLeft />
            </button>
          </>
        ) : (
          <button
            onClick={() => persistCollapsed(false)}
            className={`${iconButtonClass} w-full`}
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <FaChevronRight />
          </button>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
