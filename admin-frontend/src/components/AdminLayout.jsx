import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { Menu } from 'lucide-react';
import './AdminLayout.css';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="admin-layout">
      <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="admin-layout-content">
        {/* Mobile Header */}
        <header className="admin-mobile-header">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="mobile-menu-btn"
          >
            <Menu size={24} />
          </button>
          <span className="mobile-header-title">Admin Panel</span>
        </header>

        {/* Main Content Area */}
        <main className="admin-main-area custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
