import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../context/AuthContext';

const glassStyle = {
  background: 'rgba(30, 41, 59, 0.7)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  padding: '1.5rem',
};

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    try {
      const res = await axios.get(`${API_BASE}/courses/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('satelabs_token')}` }
      });
      setCourse(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      await axios.post(`${API_BASE}/courses/${id}/enroll`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('satelabs_token')}` }
      });
      loadCourse(); // Reload to update status
    } catch (err) {
      alert("Error enrolling in course");
    }
  };

  const handleCompleteModule = async (moduleId) => {
    try {
      const res = await axios.post(`${API_BASE}/courses/modules/${moduleId}/complete`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('satelabs_token')}` }
      });
      if(res.data.course_completed) {
        alert(`🎉 Course Completed! Certificate Earned!`);
      }
      loadCourse(); // Refresh progress
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !course) return <div style={{ background: '#0f172a', height: '100vh' }}></div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', background: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      <div style={{ ...glassStyle, marginBottom: '2rem', borderLeft: '4px solid #f97316' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ color: '#f97316', fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase' }}>{course.level} Tier</span>
            <h1 style={{ margin: '0.5rem 0', fontSize: '2.5rem', color: '#fff' }}>{course.title}</h1>
            <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '600px' }}>{course.description}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#06b6d4', fontSize: '2rem', fontWeight: 'bold' }}>{course.total_xp} XP</div>
            {course.is_enrolled ? (
              <div style={{ marginTop: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 'bold' }}>
                ✓ Active Enrollment
              </div>
            ) : (
              <button onClick={handleEnroll} style={{ marginTop: '1rem', background: 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)', color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
                Initialize Sequence (Enroll)
              </button>
            )}
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#e2e8f0' }}>Course Syllabus Matrix</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {course.modules?.map((mod, index) => {
          const isCompleted = course.progress?.find(p => p.module_id === mod.id)?.completed;
          
          return (
            <div key={mod.id} style={{ ...glassStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: course.is_enrolled ? 1 : 0.7 }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#06b6d4' }}>{index + 1}.</span> {mod.title}
                </h3>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                  {mod.topics?.map(topic => <li key={topic.id} style={{ marginBottom: '0.25rem' }}>{topic.title}</li>)}
                </ul>
              </div>
              {course.is_enrolled && (
                <button onClick={() => handleCompleteModule(mod.id)} disabled={isCompleted} style={{ background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(6, 182, 212, 0.1)', color: isCompleted ? '#10b981' : '#06b6d4', border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`, padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: isCompleted ? 'default' : 'pointer' }}>
                  {isCompleted ? 'Module Secure ✓' : 'Engage Module'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}