import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import './Layout.css';

export default function Layout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">⬡</div>
        <div className="loading-bar">
          <div className="loading-fill" />
        </div>
        <p className="loading-text mono">INITIALIZING SATELABS...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main cyber-grid">
        <Outlet />
      </main>
    </div>
  );
}
