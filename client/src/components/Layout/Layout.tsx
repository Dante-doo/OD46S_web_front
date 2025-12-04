import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaTruck,
  FaUsers,
  FaRoute,
  FaCalendarAlt,
  FaChartLine,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaUser,
} from 'react-icons/fa';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', icon: FaTachometerAlt, label: 'Dashboard' },
    { path: '/vehicles', icon: FaTruck, label: 'Caminhões' },
    { path: '/users', icon: FaUsers, label: 'Usuários' },
    { path: '/routes', icon: FaRoute, label: 'Rotas' },
    { path: '/assignments', icon: FaCalendarAlt, label: 'Escalas' },
    { path: '/executions', icon: FaChartLine, label: 'Relatórios' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/garbage-truck.png" alt="Coleta Urbana" className="logo-icon" />
            {sidebarOpen && <span className="logo-text">Coleta Urbana</span>}
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                title={!sidebarOpen ? item.label : ''}
              >
                <Icon className="nav-icon" />
                {sidebarOpen && <span className="nav-label">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <FaUser className="user-icon" />
            {sidebarOpen && (
              <div className="user-details">
                <div className="user-name">{user?.name || 'Admin'}</div>
                <div className="user-email">{user?.email || ''}</div>
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sair">
            <FaSignOutAlt />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <header className="main-header">
          <div className="header-content">
            <h1 className="page-title">
              {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
            </h1>
            <div className="header-actions">
              <div className="user-badge">
                <FaUser />
                <span>{user?.name || 'Admin'}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

