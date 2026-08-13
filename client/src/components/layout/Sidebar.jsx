import { useState } from "react";
import {
  FaTachometerAlt,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaBuilding,
  FaBook,
  FaCalendarAlt,
  FaFileAlt,
  FaChartBar,
  FaClipboardCheck,
  FaClipboardList,
  FaMoneyBill,
  FaFolderOpen,
  FaBell,
  FaUserPlus,
  FaBookOpen,
  FaTasks,
  FaCogs,
  FaCog,
  FaUniversity,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../context/useAuth";
import { ROLES, canAccess } from "../../utils/permissions";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: <FaTachometerAlt /> },
  {
    name: "Students",
    path: "/students",
    icon: <FaUserGraduate />,
    roles: [ROLES.ADMIN],
  },
  {
    name: "Faculty",
    path: "/faculty",
    icon: <FaChalkboardTeacher />,
    roles: [ROLES.ADMIN],
  },
  {
    name: "Departments",
    path: "/departments",
    icon: <FaBuilding />,
    roles: [ROLES.ADMIN],
  },
  {
    name: "Courses",
    path: "/courses",
    icon: <FaBook />,
    roles: [ROLES.ADMIN],
  },
  {
    name: "Timetable",
    path: "/timetable",
    icon: <FaCalendarAlt />,
    roles: [ROLES.ADMIN],
  },
  {
    name: "Attendance",
    path: "/attendance",
    icon: <FaClipboardCheck />,
    roles: [ROLES.ADMIN],
  },
  {
    name: "Exams",
    path: "/exams",
    icon: <FaFileAlt />,
    roles: [ROLES.ADMIN],
  },
  {
    name: "Results",
    path: "/results",
    icon: <FaClipboardList />,
    roles: [ROLES.ADMIN],
  },
  {
    name: "Fees",
    path: "/fees",
    icon: <FaMoneyBill />,
    roles: [ROLES.ADMIN],
  },
  {
    name: "Admissions",
    path: "/admissions",
    icon: <FaUserPlus />,
    roles: [ROLES.ADMIN],
  },
  {
    name: "Curriculum",
    path: "/curriculum",
    icon: <FaBookOpen />,
    roles: [ROLES.ADMIN],
  },
  {
    name: "Workload",
    path: "/workload",
    icon: <FaTasks />,
    roles: [ROLES.ADMIN],
  },
  {
    name: "Files",
    path: "/files",
    icon: <FaFolderOpen />,
    roles: [ROLES.ADMIN],
  },
  {
    name: "Notifications",
    path: "/notifications",
    icon: <FaBell />,
    roles: [ROLES.ADMIN],
  },
  {
    name: "Analytics",
    path: "/analytics",
    icon: <FaChartBar />,
    roles: [ROLES.ADMIN],
  },
  {
    name: "Jobs",
    path: "/jobs",
    icon: <FaCogs />,
    roles: [ROLES.ADMIN],
  },
  {
    name: "Reports",
    path: "/reports",
    icon: <FaFileAlt />,
    roles: [ROLES.ADMIN],
  },
  {
    name: "Settings",
    path: "/settings",
    icon: <FaCog />,
    roles: [ROLES.ADMIN],
  },
];

const iconButtonClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors duration-200 hover:bg-surface-container dark:text-on-primary-container dark:hover:bg-primary-container";

function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  const persistCollapsed = (value) => {
    setCollapsed(value);
    try {
      localStorage.setItem("sidebar-collapsed", value ? "true" : "false");
    } catch {
      /* storage unavailable */
    }
  };

  const compact = collapsed && !open;
  const visibleItems = menuItems.filter((item) =>
    canAccess(user?.role, item.roles)
  );

  const navClasses = ({ isActive }) =>
    `group relative flex items-center rounded-lg text-sm transition-all duration-200 active:scale-[0.98] ${
      compact ? "justify-center py-3" : "gap-3 px-4 py-3"
    } ${
      isActive
        ? `bg-secondary-fixed/30 font-bold text-on-secondary-fixed-variant dark:bg-secondary dark:text-white ${
            compact ? "" : "border-l-4 border-secondary dark:border-secondary-fixed-dim"
          }`
        : "text-on-surface-variant hover:bg-surface-container dark:text-on-primary-container dark:hover:bg-primary-container"
    }`;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-outline-variant bg-surface shadow-xl transition-all duration-300 dark:border-primary-container dark:bg-primary lg:static lg:translate-x-0 ${
        compact ? "w-20" : "w-72"
      } ${open ? "translate-x-0" : "-translate-x-full"}`}
    >
      {/* Brand */}
      <div
        className={`flex items-center border-b border-outline-variant py-5 dark:border-primary-container ${
          compact ? "justify-center px-2" : "justify-between px-5"
        }`}
      >
        <div className={`flex items-center gap-3 ${compact ? "flex-col" : ""}`}>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-fixed text-secondary dark:bg-secondary dark:text-white">
            <FaUniversity className="text-lg" />
          </div>

          {!compact && (
            <div className="leading-tight">
              <h1 className="text-lg font-bold text-primary dark:text-on-primary">
                College ERP
              </h1>
              <p className="text-xs font-medium text-on-surface-variant dark:text-on-primary-container">
                Admin Dashboard
              </p>
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
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            title={compact ? item.name : undefined}
            className={navClasses}
          >
            {() => (
              <>
                <span className="text-lg">{item.icon}</span>

                {!compact && <span className="flex-1">{item.name}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-outline-variant px-3 py-3 dark:border-primary-container">
        {!compact ? (
          <>
            <p className="px-2 text-xs font-medium text-on-surface-variant dark:text-on-primary-container">
              © 2026 College ERP
            </p>
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
  );
}

export default Sidebar;
