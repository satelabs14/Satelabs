import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../context/AuthContext';

const glassStyle = {
  background: 'rgba(30, 41, 59, 0.7)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  padding: '1.5rem',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
};

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get(`${API_BASE}/courses`);
        setCourses(res.data);
      } catch (err) {
        console.error("Failed to fetch courses", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a' }}>
        <div style={{ color: '#06b6d4', fontSize: '1.2rem', animation: 'pulse 1.5s infinite' }}>Loading Syllabus Matrix...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', background: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      <div style={{ marginBottom: '3rem' }}>
        <p style={{ margin: '0 0 0.5rem 0', color: '#06b6d4', fontSize: '0.85rem', letterSpacing: '2px', fontWeight: 'bold' }}>// TRAINING ACADEMY</p>
        <h1 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '2.5rem' }}>Course Catalog</h1>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '1.1rem' }}>Master the arts of defense, exploitation, and AI security.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
        {courses.map(course => (
          <div 
            key={course.id}
            style={{ 
              ...glassStyle, 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onClick={() => navigate(`/courses/${course.id}`)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
              e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(6, 182, 212, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <span style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                {course.level}
              </span>
              <span style={{ color: '#06b6d4', fontWeight: 'bold', fontSize: '0.9rem' }}>{course.total_xp} XP</span>
            </div>
            
            <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: '0 0 1rem 0', lineHeight: '1.4' }}>{course.title}</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', flex: 1, marginBottom: '1.5rem' }}>
              {course.description}
            </p>

            <button style={{ width: '100%', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '0.75rem', borderRadius: '8px', fontWeight: 'bold', transition: 'all 0.2s' }}>
              View Syllabus
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}