import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../context/AuthContext';
import './Dashboard.css';

const StatCard = ({ label, value, icon, accent, sub }) => (
  <div className={`stat-card stat-${accent}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-body">
      <p className="stat-value mono">{value}</p>
      <p className="stat-label">{label}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  </div>
);

const CourseCard = ({ course, onComplete }) => (
  <div className="course-card">
    <div className="course-header">
      <h3 className="course-title">{course.title}</h3>
      <span className="course-xp">+{course.points} XP</span>
    </div>
    <p className="course-desc">{course.description}</p>
    
    <div className="course-progress">
      <div className="progress-info">
        <span className="progress-label">Progress</span>
        <span className="progress-percent">{course.progress_percentage}%</span>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${course.progress_percentage}%` }}
        ></div>
      </div>
    </div>
    
    <div className="course-meta">
      <span className="meta-item">
        <span className="meta-icon">📚</span>
        {course.completed_modules}/{course.total_modules} modules
      </span>
    </div>
    
    <Link to={`/courses/${course.id}`} className="btn-secondary">
      {course.progress_percentage === 100 ? 'View Certificate' : 'Continue Learning'} →
    </Link>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await axios.get(`${API_BASE}/dashboard/stats`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('satelabs_token')}`
          }
        });
        setStats(response.data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="page dashboard-page">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  const statItems = [
    { 
      label: 'Current XP', 
      value: stats?.current_xp || 0, 
      icon: '⚡', 
      accent: 'cyan',
      sub: 'experience points'
    },
    { 
      label: 'Your Rank', 
      value: stats?.current_rank || 'Recruit', 
      icon: '👑', 
      accent: 'amber',
      sub: 'current rank'
    },
    { 
      label: 'Modules Done', 
      value: stats?.completed_modules || 0, 
      icon: '✓', 
      accent: 'green',
      sub: 'completed'
    },
    { 
      label: 'Certificates', 
      value: stats?.certificates_earned || 0, 
      icon: '🏆', 
      accent: 'purple',
      sub: 'earned'
    },
  ];

  return (
    <div className="page dashboard-page cyber-grid">
      {/* Page Header */}
      <div className="page-header">
        <p className="page-eyebrow">// LEARNING DASHBOARD</p>
        <h1 className="page-title">Welcome back, {user?.username}</h1>
        <p className="page-subtitle">Track your progress and continue learning</p>
      </div>

      {/* XP & Rank Banner */}
      <div className="xp-banner">
        <div className="xp-content">
          <div className="xp-left">
            <h2 className="xp-value mono">{stats?.current_xp || 0}</h2>
            <p className="xp-label">Experience Points</p>
          </div>
          <div className="xp-divider"></div>
          <div className="xp-right">
            <h2 className="rank-value">{stats?.current_rank || 'Recruit'}</h2>
            <p className="rank-label">Current Rank</p>
            <div className="rank-info">
              {stats?.current_rank === 'Recruit' && <span>Next: Analyst (101 XP)</span>}
              {stats?.current_rank === 'Analyst' && <span>Next: Hunter (301 XP)</span>}
              {stats?.current_rank === 'Hunter' && <span>Next: Specialist (701 XP)</span>}
              {stats?.current_rank === 'Specialist' && <span>Next: Elite (1501 XP)</span>}
              {stats?.current_rank === 'Elite' && <span>🌟 Maximum Rank Achieved!</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="stats-grid">
        {statItems.map(item => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      {/* Learning Summary */}
      <div className="summary-grid">
        <div className="summary-card">
          <h3>Learning Summary</h3>
          <div className="summary-items">
            <div className="summary-item">
              <span className="summary-label">Active Courses</span>
              <span className="summary-value">{stats?.active_courses || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Completed Courses</span>
              <span className="summary-value">{stats?.completed_courses || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Completed Labs</span>
              <span className="summary-value">{stats?.completed_labs || 0}</span>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <h3>Rank Progression</h3>
          <div className="rank-bars">
            <div className="rank-item" style={{opacity: stats?.current_rank === 'Recruit' || ['Analyst', 'Hunter', 'Specialist', 'Elite'].includes(stats?.current_rank) ? 1 : 0.3}}>
              <span>Recruit</span>
              <span className="rank-range">0-100</span>
            </div>
            <div className="rank-item" style={{opacity: ['Analyst', 'Hunter', 'Specialist', 'Elite'].includes(stats?.current_rank) ? 1 : 0.3}}>
              <span>Analyst</span>
              <span className="rank-range">101-300</span>
            </div>
            <div className="rank-item" style={{opacity: ['Hunter', 'Specialist', 'Elite'].includes(stats?.current_rank) ? 1 : 0.3}}>
              <span>Hunter</span>
              <span className="rank-range">301-700</span>
            </div>
            <div className="rank-item" style={{opacity: ['Specialist', 'Elite'].includes(stats?.current_rank) ? 1 : 0.3}}>
              <span>Specialist</span>
              <span className="rank-range">701-1500</span>
            </div>
            <div className="rank-item" style={{opacity: stats?.current_rank === 'Elite' ? 1 : 0.3}}>
              <span>Elite</span>
              <span className="rank-range">1501+</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Courses */}
      {stats?.courses && stats.courses.length > 0 && (
        <div className="active-courses-section">
          <div className="section-header">
            <h2>Your Courses</h2>
            <Link to="/courses" className="view-all-link">View all courses →</Link>
          </div>
          <div className="courses-grid">
            {stats.courses.slice(0, 3).map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/courses" className="action-btn action-primary">
          <span>📚</span> Browse Courses
        </Link>
        <Link to="/leaderboard" className="action-btn action-secondary">
          <span>🏆</span> View Leaderboard
        </Link>
        <Link to="/profile" className="action-btn action-tertiary">
          <span>👤</span> Profile Settings
        </Link>
      </div>
    </div>
  );
}
