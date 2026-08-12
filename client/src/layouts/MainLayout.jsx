import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Navbar from '../components/layout/Navbar'

function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const closeSidebar = () => setSidebarOpen(false)
  const openSidebar = () => setSidebarOpen(true)

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <div className="flex-1 min-w-0">
        <Navbar onMenuClick={openSidebar} />

        <main className="bg-gray-50 min-h-screen dark:bg-gray-950">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  )
}

export default MainLayout
