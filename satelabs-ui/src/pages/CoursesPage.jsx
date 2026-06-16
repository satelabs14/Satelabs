import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../context/AuthContext';
import './Courses.css';

const ModuleItem = ({ module, onComplete, completing }) => {
  const isCompleted = module.completed;

  return (
    <div className="module-item">
      <div className="module-header">
        <div className="module-status">
          {isCompleted ? '✓' : '○'}
        </div>
        <div className="module-info">
          <h3>{module.title}</h3>
          <p>{module.content}</p>
        </div>
        <div className="module-xp">{module.points} XP</div>
      </div>

      {!isCompleted && (
        <div className="module-actions">
          <button
            className="complete-button"
            onClick={() => onComplete(module.id)}
            disabled={completing}
          >
            {completing ? 'Completing...' : 'Complete Module'}
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="completion-message">
          ✓ Module completed
        </div>
      )}
    </div>
  );
};

const CourseCard = ({ course, onSelect }) => (
  <div className="course-card" onClick={() => onSelect(course.id)}>
    <div className="course-header">
      <h2 className="course-title">{course.title}</h2>
      <span className="course-badge">{course.total_modules * 25}+ XP</span>
    </div>

    <p className="course-description">
      Learn comprehensive cybersecurity skills through hands-on modules
    </p>

    <div className="course-stats">
      <span className="course-stat">📚 {course.total_modules} modules</span>
      <span className="course-stat">✓ {course.completed_modules} done</span>
    </div>

    <div className="course-progress">
      <div className="progress-label">
        <span>Progress</span>
        <span className="mono">{Math.round(course.progress_percentage)}%</span>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${course.progress_percentage}%` }}
        />
      </div>
    </div>

    <button className="course-button">
      Start Learning
    </button>
  </div>
);

export default function CoursesPage() {
  const { user, fetchCurrentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);

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
      console.log("COURSES API:", res.data);
      setCourses(res.data);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteModule = async (moduleId) => {
    setCompleting(moduleId);
    try {
      const res = await axios.post(
        `${API_BASE}/courses/modules/${moduleId}/complete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('satelabs_token')}`
          }
        }
      );

      // Refresh courses to update progress
      await loadCourses();
      await fetchCurrentUser();

      // Show success message
      alert(`🎉 +${res.data.points_earned} XP earned! New rank: ${res.data.new_rank}`);

      // If course is complete, show certificate message
      if (res.data.progress_percentage === 100) {
        alert('🏆 Course completed! Certificate generated!');
      }
    } catch (err) {
      console.error('Failed to complete module:', err);
      alert('Failed to complete module. Please try again.');
    } finally {
      setCompleting(null);
    }
  };

  if (loading) {
    return (
      <div className="courses-page">
        <div className="loading-spinner">Loading courses...</div>
      </div>
    );
  }

  if (selectedCourse) {
    const course = courses.find(c => c.id === selectedCourse);

    return (
      <div className="courses-page">
        <button 
          className="back-button"
          onClick={() => setSelectedCourse(null)}
        >
          ← Back to Courses
        </button>

        <div className="course-details-view">
          <div className="course-details-header">
            <h1 className="details-title">{course.title}</h1>
            <div className="details-meta">
              <div className="meta-item">
                <h4>Total Modules</h4>
                <div className="value">{course.total_modules}</div>
              </div>
              <div className="meta-item">
                <h4>Completed</h4>
                <div className="value">{course.completed_modules}</div>
              </div>
              <div className="meta-item">
                <h4>Progress</h4>
                <div className="value mono">{Math.round(course.progress_percentage)}%</div>
              </div>
              <div className="meta-item">
                <h4>Total XP</h4>
                <div className="value">{course.total_modules * 25}+</div>
              </div>
            </div>
          </div>

          <h2 className="section-title">Modules</h2>
          <div className="modules-list">
            {course.modules.map(module => (
              <ModuleItem
                key={module.id}
                module={module}
                onComplete={handleCompleteModule}
                completing={completing === module.id}
              />
            ))}
          </div>

          {course.progress_percentage === 100 && (
            <div className="certificate-badge">
              <h4>🏆 Course Completed!</h4>
              <p>You have earned the certificate for completing this course.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="courses-page">
      <div className="page-header">
        <p className="page-eyebrow">// LEARNING PATHS</p>
        <h1 className="page-title">Courses</h1>
        <p className="page-subtitle">Build your cybersecurity skills</p>
      </div>

      <h2 className="section-title">Available Courses</h2>
      <div className="courses-grid">
        {courses.map(course => (
          <CourseCard
            key={course.id}
            course={course}
            onSelect={setSelectedCourse}
          />
        ))}
      </div>

      {courses.length === 0 && (
        <div className="empty-state">
          <p>No courses available yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
