import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  MdMenu,
  MdSearch,
  MdDarkMode,
  MdLightMode,
  MdNotifications,
  MdLogout,
} from 'react-icons/md'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import useRealtimeNotifications from '../../hooks/useRealtimeNotifications'
import { getUnreadCount } from '../../api'
import { getRoleLabel } from '../../utils/permissions'

function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { darkMode, toggleTheme } = useTheme()
  const navigate = useNavigate()

  useRealtimeNotifications()

  const { data: unread } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => getUnreadCount().then((r) => r.data),
    refetchInterval: 60000,
  })
  const unreadCount = unread?.data?.unreadCount ?? 0

  const role = user?.role || 'Admin'
  const displayName = user?.name || role
  const initials = displayName.charAt(0).toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const iconButtonClass =
    'flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/80 sm:px-6">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className={`-ml-2 ${iconButtonClass} lg:hidden`}
        aria-label="Open sidebar"
      >
        <MdMenu className="text-xl" />
      </button>

      {/* Search */}
      <div className="relative ml-2 hidden w-full max-w-md sm:block">
        <MdSearch className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search students, courses, or faculty..."
          className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className={`${iconButtonClass} hover:text-primary-600 dark:hover:text-primary-400`}
          aria-label="Toggle theme"
        >
          {darkMode ? <MdLightMode className="text-xl" /> : <MdDarkMode className="text-xl" />}
        </button>

        {/* Notifications with live unread badge */}
        <button
          onClick={() => navigate('/notifications')}
          className={`relative ${iconButtonClass} hover:text-primary-600 dark:hover:text-primary-400`}
          aria-label="Notifications"
        >
          <MdNotifications className="text-xl" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          {unreadCount === 0 && (
            <span className="absolute right-2 top-2 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
            </span>
          )}
        </button>

        <span className="hidden h-6 w-px bg-gray-200 dark:bg-gray-700 sm:block" />

        {/* Profile */}
        <div className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-semibold text-white">
            {initials}
          </span>
          <div className="hidden leading-tight sm:block">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              {displayName}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {typeof getRoleLabel === 'function' ? getRoleLabel(role) : role}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`${iconButtonClass} text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30`}
          aria-label="Logout"
          title="Logout"
        >
          <MdLogout className="text-xl" />
        </button>
      </div>
    </header>
  )
}

export default Navbar
