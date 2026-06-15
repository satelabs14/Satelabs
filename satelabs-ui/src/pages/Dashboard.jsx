import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../context/AuthContext';
import './Dashboard.css';

const RANKS = [
  { name: 'Initiate', min: 0, color: '#94a3b8' },
  { name: 'Explorer', min: 101, color: '#3b82f6' },
  { name: 'Operator', min: 301, color: '#10b981' },
  { name: 'Sentinel', min: 601, color: '#f59e0b' },
  { name: 'Vanguard', min: 1001, color: '#ef4444' },
  { name: 'Guardian', min: 1501, color: '#8b5cf6' },
  { name: 'Elite', min: 2501, color: '#ec4899' },
  { name: 'SateLabs Legend', min: 4001, color: '#f97316' }
];

const getAchievements = (stats) => {
  if (!stats) return [];
  const xp = stats.current_xp || 0;
  const courses = stats.completed_courses || 0;
  const modules = stats.completed_modules || 0;
  
  return [
    { id: 1, title: 'First Course', icon: '🎯', unlocked: courses > 0, desc: 'Complete 1 course' },
    { id: 2, title: 'Quiz Master', icon: '🧠', unlocked: xp >= 200, desc: 'Earn 200 XP' },
    { id: 3, title: 'Lab Explorer', icon: '🔬', unlocked: modules >= 5, desc: 'Complete 5 modules' },
    { id: 4, title: '100 XP Club', icon: '💯', unlocked: xp >= 100, desc: 'Earn 100 XP' },
    { id: 5, title: 'Cyber Enthusiast', icon: '⚡', unlocked: modules >= 15, desc: 'Complete 15 modules' }
  ];
};

const getRankInfo = (xp) => {
  let currentRank = RANKS[0];
  let nextRank = RANKS[1];
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].min) {
      currentRank = RANKS[i];
      nextRank = RANKS[i + 1] || null;
    }
  }
  return { currentRank, nextRank };
};

const glassStyle = {
  background: 'rgba(30, 41, 59, 0.7)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  padding: '1.5rem',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
};

const CircularProgress = ({ currentXp, currentRank, nextRank }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  
  let progress = 100;
  if (nextRank) {
    const range = nextRank.min - currentRank.min;
    const current = currentXp - currentRank.min;
    progress = (current / range) * 100;
  }

  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="150" height="150" style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx="75"
          cy="75"
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="10"
          fill="transparent"
        />
        <circle
          cx="75"
          cy="75"
          r={radius}
          stroke={currentRank.color}
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.5s ease-in-out' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', lineHeight: '1' }}>{currentXp}</div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>XP</div>
        {nextRank && <div style={{ fontSize: '0.7rem', color: currentRank.color, marginTop: '0.25rem' }}>{Math.round(progress)}%</div>}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div 
    style={{ 
      ...glassStyle, 
      display: 'flex', 
      alignItems: 'center', 
      gap: '1.25rem',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-5px)';
      e.currentTarget.style.boxShadow = `0 10px 20px -5px rgba(0, 0, 0, 0.3), 0 0 15px ${color}40`;
      e.currentTarget.style.borderColor = `${color}60`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    }}
  >
    <div style={{ 
      width: '48px', 
      height: '48px', 
      borderRadius: '12px', 
      background: `${color}20`, 
      color: color, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      fontSize: '1.5rem' 
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', lineHeight: '1.2' }}>{value}</div>
      <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>{title}</div>
    </div>
  </div>
);

const QuickAction = ({ title, icon, color, onClick }) => (
  <button 
    onClick={onClick}
    style={{ 
      ...glassStyle,
      padding: '1.25rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.75rem',
      border: `1px solid rgba(255, 255, 255, 0.05)`,
      background: `linear-gradient(145deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)`,
      cursor: 'pointer',
      color: '#e2e8f0',
      transition: 'all 0.3s ease',
      flex: '1',
      minWidth: '120px'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = `linear-gradient(145deg, ${color}20 0%, rgba(15, 23, 42, 0.9) 100%)`;
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.borderColor = `${color}40`;
      e.currentTarget.style.color = '#fff';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = `linear-gradient(145deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)`;
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.borderColor = `rgba(255, 255, 255, 0.05)`;
      e.currentTarget.style.color = '#e2e8f0';
    }}
  >
    <span style={{ fontSize: '1.75rem' }}>{icon}</span>
    <span style={{ fontSize: '0.85rem', fontWeight: '500', textAlign: 'center' }}>{title}</span>
  </button>
);

const EnhancedCourseCard = ({ course, onContinue }) => (
  <div style={{ 
    ...glassStyle, 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '1rem',
    transition: 'all 0.3s ease'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'scale(1.02)';
    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
  }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', flex: 1, paddingRight: '1rem' }}>{course.title}</h3>
      <span style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
        {course.total_modules * 25}+ XP
      </span>
    </div>
    
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', color: '#94a3b8' }}>
        <span>Progress</span>
        <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>{Math.round(course.progress_percentage)}%</span>
      </div>
      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${course.progress_percentage}%`, height: '100%', background: 'linear-gradient(90deg, #0891b2 0%, #06b6d4 100%)', transition: 'width 1s ease-in-out', borderRadius: '3px' }} />
      </div>
    </div>

    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
      {course.completed_modules}/{course.total_modules} modules completed
    </div>

    <button 
      onClick={() => onContinue(course.id)}
      style={{
        marginTop: 'auto',
        background: 'rgba(6, 182, 212, 0.1)',
        color: '#06b6d4',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        padding: '0.75rem',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.2s',
        width: '100%'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#06b6d4';
        e.currentTarget.style.color = '#000';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
        e.currentTarget.style.color = '#06b6d4';
      }}
    >
      Continue Learning
    </button>
  </div>
);

const Toast = ({ title, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{ position: 'fixed', top: '2rem', right: '2rem', background: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(10px)', border: `1px solid ${type === 'success' ? '#10b981' : '#06b6d4'}`, borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 1000, animation: 'slideIn 0.3s ease-out' }}>
      <span style={{ fontSize: '1.5rem' }}>{type === 'success' ? '🏆' : '⚡'}</span>
      <div>
        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem' }}>{title}</div>
        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{message}</div>
      </div>
    </div>
  );
};

const MissionItem = ({ title, xp, completed }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: completed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: `1px solid ${completed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`, transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}>
     <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: completed ? '#10b981' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem' }}>
           {completed && '✓'}
        </div>
        <span style={{ color: completed ? '#e2e8f0' : '#94a3b8', textDecoration: completed ? 'line-through' : 'none', fontSize: '0.95rem' }}>{title}</span>
     </div>
     <span style={{ color: '#06b6d4', fontWeight: 'bold', fontSize: '0.9rem' }}>+{xp} XP</span>
  </div>
);

const ActivityItem = ({ action, time, icon, color }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
    <div style={{ background: `${color}20`, color: color, padding: '0.5rem', borderRadius: '8px', fontSize: '1.2rem' }}>
      {icon}
    </div>
    <div>
      <div style={{ color: '#e2e8f0', fontSize: '0.9rem', marginBottom: '0.2rem' }}>{action}</div>
      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{time}</div>
    </div>
  </div>
);

const LeaderboardRow = ({ rank, username, xp, isCurrentUser }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: isCurrentUser ? 'rgba(6, 182, 212, 0.1)' : 'transparent', borderRadius: '8px', border: isCurrentUser ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent', transition: 'background 0.2s' }} onMouseEnter={(e) => { if(!isCurrentUser) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }} onMouseLeave={(e) => { if(!isCurrentUser) e.currentTarget.style.background = 'transparent' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <span style={{ color: rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#b45309' : '#64748b', fontWeight: 'bold', width: '20px', textAlign: 'center' }}>#{rank}</span>
      <span style={{ color: '#e2e8f0', fontWeight: isCurrentUser ? 'bold' : 'normal' }}>{username}</span>
    </div>
    <span style={{ color: '#06b6d4', fontWeight: 'bold', fontSize: '0.9rem' }}>{xp} XP</span>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streak] = useState(7); // Mock streak
  const [notification, setNotification] = useState(null);

  const MOCK_MISSIONS = [
    { id: 1, title: 'Complete a lesson', xp: 50, completed: false },
    { id: 2, title: 'Take a quiz', xp: 20, completed: true },
    { id: 3, title: 'Visit a lab', xp: 100, completed: false }
  ];

  const MOCK_ACTIVITY = [
    { id: 1, action: 'Earned 50 XP', time: '2 hours ago', icon: '⚡', color: '#f59e0b' },
    { id: 2, action: 'Completed Network Basics', time: '5 hours ago', icon: '🎯', color: '#10b981' },
    { id: 3, action: 'Unlocked 100 XP Club', time: '1 day ago', icon: '🏆', color: '#06b6d4' }
  ];

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('satelabs_token')}`
        }
      });
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      // Fallback for demo purposes if backend fails
      setStats({
        current_xp: 450,
        completed_modules: 12,
        active_courses: 3,
        certificates_earned: 1,
        completed_courses: 2,
        courses: [
          { id: '1', title: 'Network Security Fundamentals', total_modules: 5, completed_modules: 2, progress_percentage: 40 },
          { id: '2', title: 'Web Application Penetration Testing', total_modules: 8, completed_modules: 6, progress_percentage: 75 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Show welcome back notification when stats are successfully retrieved
    if (stats && !loading) {
      setNotification({
        title: 'System Ready',
        message: `Welcome back! You have ${stats.current_xp || 0} XP.`,
        type: 'info'
      });
    }
  }, [stats, loading]);

  if (loading || !stats) {
    return (
      <div className="dashboard-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a' }}>
        <div style={{ color: '#06b6d4', fontSize: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="loading-spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(6, 182, 212, 0.3)', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          Initializing Terminal...
        </div>
      </div>
    );
  }

  const topCourses = stats.courses?.slice(0, 3) || [];
  const { currentRank, nextRank } = getRankInfo(stats.current_xp);
  const achievements = getAchievements(stats);

  const MOCK_LEADERBOARD = [
    { rank: 1, username: 'CyberNinja', xp: 5420 },
    { rank: 2, username: 'HackPro', xp: 4890 },
    { rank: 3, username: 'SecMaster', xp: 4100 },
    { rank: 42, username: user?.username || 'Operator', xp: stats?.current_xp || 0, isCurrentUser: true }
  ];

  return (
    <div className="dashboard-page" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', background: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
      
      {notification && <Toast {...notification} onClose={() => setNotification(null)} />}

      {/* Hero Section */}
      <div style={{ ...glassStyle, marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)', borderLeft: `4px solid ${currentRank.color}` }}>
        <div>
          <p style={{ margin: '0 0 0.5rem 0', color: '#06b6d4', fontSize: '0.85rem', letterSpacing: '2px', fontWeight: 'bold' }}>// SECURE TERMINAL ACCESS</p>
          <h1 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '2.5rem' }}>Welcome back, <span style={{ color: currentRank.color }}>{user?.username || 'Operator'}</span></h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '1.1rem' }}>Ready to advance your cybersecurity skills today?</p>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(249, 115, 22, 0.1)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
              <span style={{ fontSize: '1.5rem' }}>🔥</span>
              <div>
                <div style={{ color: '#f97316', fontWeight: 'bold' }}>{streak} Day Login Streak</div>
                <div style={{ fontSize: '0.75rem', color: '#fdba74' }}>+25% XP Bonus Active</div>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Rank</div>
            <div style={{ color: currentRank.color, fontWeight: 'bold', fontSize: '2rem', textShadow: `0 0 15px ${currentRank.color}60` }}>{currentRank.name}</div>
            {nextRank ? (
              <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>{nextRank.min - stats.current_xp} XP</span> to {nextRank.name}
              </div>
            ) : (
              <div style={{ color: '#10b981', fontSize: '0.9rem', marginTop: '0.25rem', fontWeight: 'bold' }}>
                Maximum rank achieved!
              </div>
            )}
          </div>
          <CircularProgress currentXp={stats.current_xp} currentRank={currentRank} nextRank={nextRank} />
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <StatCard title="Total Experience" value={stats.current_xp} icon="⚡" color="#06b6d4" />
        <StatCard title="Modules Mastered" value={stats.completed_modules} icon="📚" color="#3b82f6" />
        <StatCard title="Courses Completed" value={stats.completed_courses || 0} icon="🎯" color="#10b981" />
        <StatCard title="Certifications" value={stats.certificates_earned} icon="🏆" color="#f59e0b" />
      </div>

      {/* 2-Column Responsive Grid Layout */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', marginBottom: '2.5rem' }}>
        
        {/* Main Content Column */}
        <div style={{ flex: '1 1 60%', display: 'flex', flexDirection: 'column', gap: '2.5rem', minWidth: '300px' }}>
          
          {/* Active Courses */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#06b6d4' }}>●</span> In Progress
              </h2>
              <button onClick={() => navigate('/courses')} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                View all <span>→</span>
              </button>
            </div>
            {topCourses.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {topCourses.map(course => (
                  <EnhancedCourseCard 
                    key={course.id}
                    course={course}
                    onContinue={() => navigate(`/courses/${course.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div style={{ ...glassStyle, textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀</div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff' }}>Ready to Begin Your Journey?</h3>
                <p style={{ color: '#94a3b8', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                  Enroll in your first cybersecurity course to start earning XP, climbing the ranks, and unlocking achievements.
                </p>
                <button 
                  onClick={() => navigate('/courses')} 
                  style={{ background: 'linear-gradient(90deg, #0891b2 0%, #06b6d4 100%)', color: '#000', border: 'none', padding: '0.75rem 2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Start Learning Now
                </button>
              </div>
            )}
          </div>

          {/* Daily Missions */}
          <div style={{ ...glassStyle, background: 'rgba(30, 41, 59, 0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>Daily Missions</h2>
              <span style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 'bold' }}>{MOCK_MISSIONS.filter(m => m.completed).length} / {MOCK_MISSIONS.length} Completed</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {MOCK_MISSIONS.map(mission => (
                <MissionItem key={mission.id} {...mission} />
              ))}
            </div>
          </div>

          {/* Achievements System */}
          <div style={{ ...glassStyle, background: 'rgba(30, 41, 59, 0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>Recent Achievements</h2>
              <span style={{ color: '#f59e0b', fontSize: '0.9rem', fontWeight: 'bold' }}>{achievements.filter(a => a.unlocked).length} / {achievements.length} Unlocked</span>
            </div>
            <div className="hide-scrollbar" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {achievements.map(ach => (
                <div 
                  key={ach.id} 
                  style={{ 
                    minWidth: '120px', 
                    padding: '1.25rem 1rem', 
                    borderRadius: '12px', 
                    background: ach.unlocked ? 'rgba(16, 185, 129, 0.05)' : 'rgba(148, 163, 184, 0.05)',
                    border: `1px solid ${ach.unlocked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.1)'}`,
                    textAlign: 'center',
                    opacity: ach.unlocked ? 1 : 0.6,
                    transition: 'all 0.2s',
                    cursor: 'default'
                  }}
                  onMouseEnter={(e) => { if(ach.unlocked) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)'; } }}
                  onMouseLeave={(e) => { if(ach.unlocked) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)'; } }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', filter: ach.unlocked ? 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.5))' : 'grayscale(100%) opacity(50%)' }}>{ach.icon}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: ach.unlocked ? '#e2e8f0' : '#64748b' }}>{ach.title}</div>
                  <div style={{ fontSize: '0.7rem', color: ach.unlocked ? '#10b981' : 'transparent', marginTop: '0.25rem' }}>{ach.unlocked ? 'Unlocked' : ach.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '2.5rem', minWidth: '300px' }}>
          
          {/* Mission Control */}
          <div style={{ ...glassStyle, padding: '1.5rem', background: 'rgba(30, 41, 59, 0.4)' }}>
            <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1.2rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>Mission Control</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <QuickAction title="Browse Courses" icon="📖" color="#06b6d4" onClick={() => navigate('/courses')} />
              <QuickAction title="Start Labs" icon="💻" color="#10b981" onClick={() => navigate('/labs')} />
              <QuickAction title="Take Quiz" icon="📝" color="#8b5cf6" onClick={() => navigate('/quizzes')} />
              <QuickAction title="Leaderboard" icon="🏆" color="#f59e0b" onClick={() => navigate('/leaderboard')} />
            </div>
          </div>

          {/* Leaderboard Preview */}
          <div style={{ ...glassStyle, padding: '1.5rem', background: 'rgba(30, 41, 59, 0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>Top Operatives</h2>
              <button onClick={() => navigate('/leaderboard')} style={{ background: 'none', border: 'none', color: '#06b6d4', cursor: 'pointer', fontSize: '0.85rem' }}>View All</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {MOCK_LEADERBOARD.map((usr, idx) => (
                <LeaderboardRow key={idx} {...usr} />
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ ...glassStyle, padding: '1.5rem', background: 'rgba(30, 41, 59, 0.4)' }}>
            <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1.2rem', color: '#fff' }}>Recent Activity</h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {MOCK_ACTIVITY.map(act => (
                <ActivityItem key={act.id} {...act} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
