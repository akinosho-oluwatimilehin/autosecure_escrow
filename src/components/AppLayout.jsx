import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CarFront, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AppLayout({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-frame">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><ShieldCheck size={18} /></span>
          <span>AutoSecure Escrow</span>
        </div>
        <nav className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/marketplace"><CarFront size={16} /> Marketplace</Link>
          {user?.role === 'REPAIR_SHOP' && <Link to="/inspections">Inspections</Link>}
          {user?.role === 'LOGISTICS' && <Link to="/carrier">Carrier</Link>}
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
              {user.username} · {user.role}
            </span>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}
