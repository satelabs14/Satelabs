import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { path: '/courses', icon: '📚', label: 'Courses' },
  { path: '/labs', icon: '🧪', label: 'Labs' },
  { path: '/quiz', icon: '📝', label: 'Quizzes' },
  { path: '/certificates', icon: '🎓', label: 'Certificates' },
  { path: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
  { path: '/profile', icon: '👤', label: 'Profile' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">

      {/* Logo */}
      <div className="sidebar-logo">
  <div className="logo-wrapper">
    <img
      src={logo}
      alt="SateLabs"
      className="sidebar-logo-full"
    />

    <h2 className="sidebar-brand">
      Sate<span>Labs</span>
    </h2>
  </div>
</div>

      {/* User Info */}
      <div className="sidebar-user">
        <div className="user-avatar">
          {user?.username?.[0]?.toUpperCase() || 'U'}
        </div>

        <div className="user-info">
          <p className="user-name">
            {user?.username || 'User'}
          </p>

          <p className="user-points mono">
            {user?.points || 0} XP
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon">
              {item.icon}
            </span>

            <span className="nav-label">
              {item.label}
            </span>

            <span className="nav-indicator" />
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">

        <div className="rank-badge">
          <span className="rank-label mono">
            RANK
          </span>

          <span className="rank-value">
            {user?.rank || 'Recruit'}
          </span>
        </div>

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          <span>⏻</span>
          Logout
        </button>

      </div>
    </aside>
  );
}