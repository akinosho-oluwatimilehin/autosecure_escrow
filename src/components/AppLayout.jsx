import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CarFront, LogOut, Moon, Settings, ShieldCheck, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function AppLayout({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="app-frame">
      <header className="topbar">
        <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
          <span className="brand-mark"><ShieldCheck size={18} /></span>
          <span>AutoSecure Escrow</span>
        </Link>
        <nav className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/marketplace"><CarFront size={16} /> Marketplace</Link>
          {user?.role === 'DEALERSHIP' && <Link to="/seller">Seller Hub</Link>}
          {user?.role === 'REPAIR_SHOP' && <Link to="/inspections">Inspections</Link>}
          {user?.role === 'LOGISTICS' && <Link to="/carrier">Carrier</Link>}
          <Link to="/settings"><Settings size={16} /> Settings</Link>

          <button
            type="button"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            {theme === 'dark' ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} color="#14b8a6" />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          <button type="button" onClick={handleLogout}><LogOut size={16} /> Logout</button>
        </nav>
      </header>
      <main className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
          {user && (
            <span className="status-pill">
              {user.first_name ? `${user.first_name} ${user.last_name}` : user.username} · {user.role}
            </span>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}
