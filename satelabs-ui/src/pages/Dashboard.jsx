import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../services/api';
import { API_BASE } from '../context/AuthContext';
import './Dashboard.css';

const glassStyle = {
  background: 'rgba(30, 41, 59, 0.7)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  padding: '1.5rem',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.22)'
};

const initialSections = {
  profile: true,
  stats: true,
  rank: true,
  courses: true,
  activity: true,
  leaderboard: true,
  certificates: true,
  labs: true,
  quizzes: true
};

const emptyDashboard = {
  profile: null,
  stats: null,
  rankProgress: null,
  courses: [],
  activity: [],
  leaderboard: [],
  certificates: [],
  labs: [],
  quizzes: []
};

const clampPercent = (value) => Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
const valueOrEmpty = (value) => (value === null || value === undefined || value === '' ? 'No data' : value);
const numberOrZero = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const formatDateTime = (value) => {
  if (!value) return 'No timestamp';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const getActivityColor = (type) => {
  const normalized = String(type || '').toLowerCase();
  if (normalized.includes('course')) return '#10b981';
  if (normalized.includes('lab')) return '#f59e0b';
  if (normalized.includes('quiz')) return '#8b5cf6';
  if (normalized.includes('certificate')) return '#06b6d4';
  return '#94a3b8';
};

const LoadingBlock = ({ label = 'Loading data' }) => (
  <div style={{ ...glassStyle, minHeight: '120px', display: 'grid', placeItems: 'center', color: '#94a3b8' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span className="loading-spinner" style={{ width: '22px', height: '22px', border: '2px solid rgba(6, 182, 212, 0.25)', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <span>{label}</span>
    </div>
  </div>
);

const EmptyState = ({ title, actionLabel, onAction, disabled }) => (
  <div style={{ ...glassStyle, textAlign: 'center', padding: '1.5rem 1rem', color: '#94a3b8' }}>
    <h3 style={{ margin: '0 0 0.5rem', color: '#e2e8f0', fontSize: '1rem' }}>{title}</h3>
    {actionLabel && (
      <button
        onClick={onAction}
        disabled={disabled}
        style={{
          marginTop: '1rem',
          background: disabled ? 'rgba(148, 163, 184, 0.12)' : 'linear-gradient(90deg, #0891b2 0%, #06b6d4 100%)',
          color: disabled ? '#64748b' : '#020617',
          border: 'none',
          borderRadius: '8px',
          padding: '0.7rem 1.1rem',
          fontWeight: 700,
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        {actionLabel}
      </button>
    )}
  </div>
);

const Section = ({ title, loading, error, children, action }) => (
  <section>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
      <h2 style={{ margin: 0, color: '#fff', fontSize: '1.15rem' }}>{title}</h2>
      {action}
    </div>
    {loading ? <LoadingBlock label={`Loading ${title.toLowerCase()}`} /> : error ? <EmptyState title={`Unable to load ${title.toLowerCase()}`} /> : children}
  </section>
);

const CircularProgress = ({ percent }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = clampPercent(percent);
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: 150, height: 150, display: 'grid', placeItems: 'center' }}>
      <svg width="150" height="150" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="75" cy="75" r={radius} stroke="rgba(255, 255, 255, 0.1)" strokeWidth="10" fill="transparent" />
        <circle
          cx="75"
          cy="75"
          r={radius}
          stroke="#06b6d4"
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div className="mono" style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>{Math.round(clampedPercent)}%</div>
        <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Rank progress</div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color }) => (
  <div style={{ ...glassStyle, borderLeft: `3px solid ${color}` }}>
    <div className="mono" style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800 }}>{valueOrEmpty(value)}</div>
    <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.35rem' }}>{title}</div>
  </div>
);

const CourseCard = ({ course, onContinue }) => {
  const progress = clampPercent(numberOrZero(course.progress_percentage));

  return (
    <div style={{ ...glassStyle, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>{course.title}</h3>
        <span className="mono" style={{ color: '#06b6d4', whiteSpace: 'nowrap' }}>{valueOrEmpty(course.points)} pts</span>
      </div>
      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5 }}>{course.description}</p>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.45rem' }}>
          <span>{valueOrEmpty(course.completed_modules)} / {valueOrEmpty(course.total_modules)} modules</span>
          <span className="mono" style={{ color: '#06b6d4' }}>{Math.round(progress)}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.08)' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#06b6d4' }} />
        </div>
      </div>
      <button onClick={onContinue} style={{ marginTop: 'auto', border: '1px solid rgba(6, 182, 212, 0.35)', background: 'rgba(6, 182, 212, 0.1)', color: '#67e8f9', borderRadius: 8, padding: '0.75rem', cursor: 'pointer', fontWeight: 700 }}>
        Continue
      </button>
    </div>
  );
};

const ActionButton = ({ title, detail, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      ...glassStyle,
      padding: '1rem',
      textAlign: 'left',
      background: disabled ? 'rgba(30, 41, 59, 0.35)' : 'rgba(30, 41, 59, 0.72)',
      color: disabled ? '#64748b' : '#e2e8f0',
      cursor: disabled ? 'not-allowed' : 'pointer'
    }}
  >
    <div style={{ fontWeight: 800 }}>{title}</div>
    <div style={{ marginTop: '0.3rem', color: disabled ? '#475569' : '#94a3b8', fontSize: '0.78rem' }}>{detail}</div>
  </button>
);

const LeaderboardRow = ({ entry, currentUsername }) => {
  const isCurrentUser = entry.username === currentUsername;

  let rankDisplay = `#${entry.rank}`;
  if (entry.rank === 1) rankDisplay = '🥇';
  else if (entry.rank === 2) rankDisplay = '🥈';
  else if (entry.rank === 3) rankDisplay = '🥉';

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 8, background: isCurrentUser ? 'rgba(6, 182, 212, 0.12)' : 'transparent', border: isCurrentUser ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid transparent' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span className="mono" style={{ color: '#94a3b8', minWidth: 34, fontSize: entry.rank <= 3 ? '1.25rem' : '1rem', textAlign: 'center' }}>{rankDisplay}</span>
        <div>
          <div style={{ color: '#e2e8f0', fontWeight: isCurrentUser ? 800 : 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {entry.username}
            {isCurrentUser && <span style={{ fontSize: '0.65rem', background: '#06b6d4', color: '#000', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 800 }}>YOU</span>}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{entry.user_rank}</div>
        </div>
      </div>
      <span className="mono" style={{ color: '#06b6d4', fontWeight: 800 }}>{entry.points}</span>
    </div>
  );
};

const getActivityIcon = (type) => {
  const normalized = String(type || '').toUpperCase();
  if (normalized.includes('USER_REGISTER')) return '👋';
  if (normalized.includes('COURSE_COMPLETE')) return '🎓';
  if (normalized.includes('MODULE_COMPLETE')) return '✅';
  if (normalized.includes('QUIZ_COMPLETE')) return '📝';
  if (normalized.includes('LAB_COMPLETE')) return '🔬';
  if (normalized.includes('CERTIFICATE_EARNED')) return '📜';
  if (normalized.includes('COURSE_ENROLL')) return '🚀';
  return '📌';
};

const ActivityItem = ({ item }) => {
  const color = getActivityColor(item.activity_type);
  const icon = getActivityIcon(item.activity_type);
  return (
    <div style={{ display: 'flex', gap: '0.85rem', padding: '0.8rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}`, boxShadow: `0 0 8px ${color}33`, fontSize: '1rem', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{item.message}</div>
        <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.2rem' }}>{formatDateTime(item.timestamp)}</div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(emptyDashboard);
  const [loading, setLoading] = useState(initialSections);
  const [errors, setErrors] = useState({});

  const loadDashboard = useCallback(async () => {
    setLoading(initialSections);
    setErrors({});

    const requests = {
      profile: dashboardApi.getDashboard(),
      stats: dashboardApi.getStats(),
      rankProgress: dashboardApi.getRankProgress(),
      activity: dashboardApi.getActivity(),
      leaderboard: dashboardApi.getLeaderboard(100),
      courses: dashboardApi.getCourses(),
      certificates: dashboardApi.getCertificates(),
      labs: dashboardApi.getLabs(),
      quizzes: dashboardApi.getQuiz()
    };

    const entries = Object.entries(requests);
    const results = await Promise.allSettled(entries.map(([, request]) => request));
    const nextData = { ...emptyDashboard };
    const nextErrors = {};
    const nextLoading = {};

    results.forEach((result, index) => {
      const key = entries[index][0];
      const dataKey = key === 'rankProgress' ? 'rankProgress' : key;
      nextLoading[key === 'rankProgress' ? 'rank' : key] = false;

      if (result.status === 'fulfilled') {
        nextData[dataKey] = result.value;
      } else {
        nextErrors[key === 'rankProgress' ? 'rank' : key] = true;
      }
    });

    setData(nextData);
    setErrors(nextErrors);
    setLoading({ ...initialSections, ...nextLoading });
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const refresh = () => loadDashboard();
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('focus', refresh);
    window.addEventListener('satelabs:progress-updated', refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    const interval = window.setInterval(refresh, 30000);

    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('satelabs:progress-updated', refresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.clearInterval(interval);
    };
  }, [loadDashboard]);

  const currentUsername = data.profile?.username || user?.username;
  const stats = data.stats || {};
  const rankProgress = data.rankProgress || {};
  const courses = Array.isArray(data.courses) ? data.courses : [];
  const activeCourses = useMemo(
    () => courses.filter((course) => numberOrZero(course.progress_percentage) > 0 && numberOrZero(course.progress_percentage) < 100),
    [courses]
  );
  const completedCoursesList = useMemo(
    () => courses.filter((course) => numberOrZero(course.progress_percentage) >= 100),
    [courses]
  );
  const displayCourses = activeCourses.length > 0 ? activeCourses : completedCoursesList;
  const visibleCourses = displayCourses.slice(0, 3);
  const leaderboardPosition = stats.leaderboard_position || data.leaderboard.find((entry) => entry.username === currentUsername)?.rank;
  const firstCourse = activeCourses[0] || courses[0];
  const hasLabs = data.labs.length > 0;
  const hasQuizzes = data.quizzes.length > 0;
  const hasCertificates = data.certificates.length > 0;
  const currentPoints = numberOrZero(stats.points ?? data.profile?.points);
  const pointsToNextRank = rankProgress.points_to_next_rank;
  const rankProgressPercent = clampPercent(numberOrZero(rankProgress.progress_percentage));
  const certificatesCount = stats.certificates_earned ?? data.certificates.length;
  const completedCoursesCount = stats.completed_courses ?? completedCoursesList.length;

  return (
    <div className="dashboard-page" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', background: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { 100% { transform: rotate(360deg); } }' }} />

      <Section title="Command Overview" loading={loading.profile || loading.stats || loading.rank} error={errors.profile || errors.stats || errors.rank}>
        <div style={{ ...glassStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', borderLeft: '3px solid #06b6d4' }}>
          <div>
            <p style={{ margin: '0 0 0.5rem', color: '#06b6d4', fontSize: '0.82rem', letterSpacing: '0.08em', fontWeight: 800 }}>DASHBOARD</p>
            <h1 style={{ margin: '0 0 0.6rem', color: '#fff', fontSize: '2.15rem' }}>{valueOrEmpty(currentUsername)}</h1>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', color: '#94a3b8' }}>
              <span>Rank: <strong style={{ color: '#e2e8f0' }}>{valueOrEmpty(stats.rank ?? data.profile?.rank)}</strong></span>
              <span>Total Points: <strong className="mono" style={{ color: '#e2e8f0' }}>{valueOrEmpty(currentPoints)}</strong></span>
              <span>Leaderboard: <strong className="mono" style={{ color: '#e2e8f0' }}>#{valueOrEmpty(leaderboardPosition)}</strong></span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', color: '#94a3b8', marginTop: '0.5rem' }}>
              <span>Points to next rank: <strong className="mono" style={{ color: '#e2e8f0' }}>{valueOrEmpty(pointsToNextRank)}</strong></span>
            </div>
          </div>
          <CircularProgress percent={rankProgressPercent} />
        </div>
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', margin: '2rem 0' }}>
        {loading.stats ? (
          <LoadingBlock label="Loading stats" />
        ) : (
          <>
            <StatCard title="Total Points" value={currentPoints} color="#06b6d4" />
            <StatCard title="Completed Modules" value={stats.completed_modules} color="#3b82f6" />
            <StatCard title="Completed Courses" value={completedCoursesCount} color="#10b981" />
            <StatCard title="Completed Labs" value={stats.completed_labs} color="#f59e0b" />
            <StatCard title="Certificates Earned" value={certificatesCount} color="#8b5cf6" />
            <StatCard title="Overall Progress" value={stats.overall_progress === undefined ? undefined : `${stats.overall_progress}%`} color="#ec4899" />
            <StatCard title="Leaderboard Position" value={leaderboardPosition ? `#${leaderboardPosition}` : undefined} color="#fb7185" />
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(300px, 0.9fr)', gap: '2rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <Section
            title={activeCourses.length > 0 ? "In Progress Courses" : completedCoursesList.length > 0 ? "Completed Courses" : "Courses"}
            loading={loading.courses}
            error={errors.courses}
            action={<button onClick={() => navigate('/courses')} style={{ background: 'none', border: 'none', color: '#06b6d4', cursor: 'pointer' }}>View all</button>}
          >
            {visibleCourses.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {visibleCourses.map((course) => (
                  <CourseCard key={course.id} course={course} onContinue={() => navigate(`/courses/${course.id}`)} />
                ))}
              </div>
            ) : (
              <EmptyState title="No active or completed courses found" actionLabel={courses.length ? 'Browse available courses' : undefined} onAction={() => navigate('/courses')} />
            )}
          </Section>

          <Section 
            title="Certificates" 
            loading={loading.certificates} 
            error={errors.certificates}
            action={data.certificates.length > 0 ? <button onClick={() => navigate('/certificates')} style={{ background: 'none', border: 'none', color: '#06b6d4', cursor: 'pointer' }}>View all</button> : null}
          >
            {data.certificates.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {data.certificates.map((certificate) => (
                  <div key={certificate.id} style={glassStyle}>
                    <div style={{ color: '#fff', fontWeight: 800 }}>Certificate #{certificate.id}</div>
                    <div className="mono" style={{ color: '#06b6d4', marginTop: '0.5rem' }}>{certificate.certificate_code}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.5rem' }}>{formatDateTime(certificate.issued_at)}</div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                      <button onClick={() => window.open(`/verify/${certificate.certificate_code}`, '_blank')} style={{ flex: 1, padding: '0.4rem', background: 'rgba(6,182,212,0.1)', border: '1px solid #06b6d4', color: '#06b6d4', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.2s' }}>
                        Verify
                      </button>
                      <button onClick={() => window.open(`${API_BASE}/certificates/download/${certificate.certificate_code}`,'_blank')} style={{ flex: 1, padding: '0.4rem', background: '#06b6d4', border: 'none', color: '#0f172a', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.2s' }}>
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No earned certificates yet" actionLabel={courses.length ? 'Continue a course' : undefined} onAction={() => firstCourse && navigate(`/courses/${firstCourse.id}`)} disabled={!firstCourse} />
            )}
          </Section>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <Section title="Mission Control" loading={loading.courses || loading.labs || loading.quizzes || loading.certificates || loading.leaderboard} error={errors.courses || errors.labs || errors.quizzes || errors.certificates || errors.leaderboard}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <ActionButton title="Course" detail={firstCourse?.title || 'No course data'} disabled={!firstCourse} onClick={() => navigate(`/courses/${firstCourse.id}`)} />
              <ActionButton title="Lab" detail={hasLabs ? `${data.labs.length} available` : 'No lab data'} disabled={!hasLabs} onClick={() => navigate('/labs')} />
              <ActionButton title="Quiz" detail={hasQuizzes ? `${data.quizzes.length} available` : 'No quiz data'} disabled={!hasQuizzes} onClick={() => navigate('/quiz')} />
              <ActionButton title="Certificate" detail={hasCertificates ? `${certificatesCount} earned` : 'No certificate data'} disabled={!hasCertificates} onClick={() => navigate('/certificates')} />
            </div>
          </Section>

          <Section title="Leaderboard" loading={loading.leaderboard} error={errors.leaderboard} action={<button onClick={() => navigate('/leaderboard')} style={{ background: 'none', border: 'none', color: '#06b6d4', cursor: 'pointer' }}>Open</button>}>
            {data.leaderboard.length ? (
              <div style={{ ...glassStyle, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {data.leaderboard.slice(0, 6).map((entry) => (
                  <LeaderboardRow key={`${entry.rank}-${entry.username}`} entry={entry} currentUsername={currentUsername} />
                ))}
              </div>
            ) : (
              <EmptyState title="No leaderboard entries found" />
            )}
          </Section>

          <Section title="Recent Activity" loading={loading.activity} error={errors.activity}>
            {data.activity.length ? (
              <div style={glassStyle}>
                {data.activity.map((item) => <ActivityItem key={item.id} item={item} />)}
              </div>
            ) : (
              <EmptyState title="No recent activity found" />
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
