import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../context/AuthContext';
import './Courses.css';

const CourseCard = ({ course, onViewDetails }) => (
  <div className="course-card" onClick={() => onViewDetails(course.id)}>
    <div className="course-banner">
      <div className="course-banner-content">
        <span className="course-xp-badge">+{course.points} XP</span>
      </div>
    </div>
    
    <div className="course-body">
      <h3 className="course-title">{course.title}</h3>
      <p className="course-description">{course.description}</p>
      
      <div className="course-progress">
        <div className="progress-label">
          <span>Progress</span>
          <span className="progress-value">{course.progress_percentage}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${course.progress_percentage}%` }}
          ></div>
        </div>
      </div>
      
      <div className="course-stats">
        <div className="stat">
          <span className="stat-icon">📚</span>
          <span>{course.completed_modules}/{course.total_modules}</span>
        </div>
        <div className="stat">
          <span className="stat-icon">✓</span>
          <span>{course.progress_percentage}% done</span>
        </div>
      </div>
      
      <button className="btn-continue">
        {course.progress_percentage === 100 ? 'View Certificate' : 'Continue'} →
      </button>
    </div>
  </div>
);

const ModuleItem = ({ module, onComplete, isCompleting }) => (
  <div className={`module-item ${module.completed ? 'completed' : ''}`}>
    <div className="module-check">
      {module.completed ? (
        <span className="check-icon">✓</span>
      ) : (
        <span className="check-empty">◯</span>
      )}
    </div>
    
    <div className="module-info">
      <h4 className="module-title">{module.title}</h4>
      <p className="module-content">{module.content}</p>
    </div>
    
    <div className="module-xp">
      <span className="xp-badge">+{module.points} XP</span>
    </div>
    
    {!module.completed && (
      <button 
        className="btn-complete"
        onClick={() => onComplete(module.id)}
        disabled={isCompleting}
      >
        {isCompleting ? 'Completing...' : 'Complete'}
      </button>
    )}
  </div>
);

const CourseDetailsView = ({ courseId, onBack }) => {
  const { fetchCurrentUser } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const res = await axios.get(`${API_BASE}/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('satelabs_token')}`
        }
      });
      setCourse(res.data);
    } catch (err) {
      console.error('Failed to load course:', err);
      setMessage({ type: 'error', text: 'Failed to load course' });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteModule = async (moduleId) => {
    setCompleting(moduleId);
    try {
      const res = await axios.post(`${API_BASE}/courses/modules/${moduleId}/complete`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('satelabs_token')}`
        }
      });

      setMessage({
        type: 'success',
        text: `Completed! +${res.data.xp_earned} XP earned`
      });

      await fetchCurrentUser();
      await loadCourse();
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to complete module'
      });
    } finally {
      setCompleting(null);
    }
  };

  if (loading) return <div className="loading-spinner">Loading course...</div>;
  if (!course) return <div className="error-message">Course not found</div>;

  return (
    <div className="course-details">
      <button className="btn-back" onClick={onBack}>← Back to Courses</button>
      
      <div className="course-header">
        <h1>{course.title}</h1>
        <p>{course.description}</p>
        <div className="course-meta">
          <span className="meta-item">+{course.points} XP Reward</span>
          <span className="meta-item">|</span>
          <span className="meta-item">{course.total_modules} Modules</span>
        </div>
      </div>

      <div className="progress-section">
        <h2>Course Progress</h2>
        <div className="progress-info">
          <span className="progress-label">
            {course.completed_modules} / {course.total_modules} modules completed
          </span>
          <span className="progress-percentage">{course.progress_percentage}%</span>
        </div>
        <div className="progress-bar-large">
          <div 
            className="progress-fill" 
            style={{ width: `${course.progress_percentage}%` }}
          ></div>
        </div>
      </div>

      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="modules-section">
        <h2>Modules</h2>
        <div className="modules-list">
          {course.modules.map(module => (
            <ModuleItem 
              key={module.id}
              module={module}
              onComplete={handleCompleteModule}
              isCompleting={completing === module.id}
            />
          ))}
        </div>
      </div>

      {course.progress_percentage === 100 && (
        <div className="completion-badge">
          <div className="badge-content">
            <h3>🎓 Course Completed!</h3>
            <p>You have successfully completed this course and earned your certificate.</p>
            <button className="btn-primary">Download Certificate</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await axios.get(`${API_BASE}/courses`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('satelabs_token')}`
        }
      });
      setCourses(res.data);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page courses-page">
        <div className="loading-spinner">Loading courses...</div>
      </div>
    );
  }

  if (selectedCourseId) {
    return (
      <div className="page courses-page">
        <CourseDetailsView 
          courseId={selectedCourseId}
          onBack={() => setSelectedCourseId(null)}
        />
      </div>
    );
  }

  return (
    <div className="page courses-page cyber-grid">
      <div className="page-header">
        <p className="page-eyebrow">// LEARNING PATHS</p>
        <h1 className="page-title">Cybersecurity Courses</h1>
        <p className="page-subtitle">Master cybersecurity skills with structured learning paths</p>
      </div>

      <div className="courses-grid">
        {courses.map(course => (
          <CourseCard 
            key={course.id} 
            course={course}
            onViewDetails={setSelectedCourseId}
          />
        ))}
      </div>

      {courses.length === 0 && (
        <div className="empty-state">
          <p>No courses available yet.</p>
        </div>
      )}
    </div>
  );
}
