import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../context/AuthContext';

export default function VerifyCertificate() {
  const { code } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(
  `${API_BASE}/certificates/verify/${code}`)
      .then(res => {
        setResult(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.detail || 'Certificate not found or invalid');
        setLoading(false);
      });
  }, [code]);

  if (loading) return <div style={{ color: '#fff', padding: '2rem', textAlign: 'center' }}>Verifying credential security...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'grid', placeItems: 'center', color: '#f8fafc', padding: '2rem' }}>
      <div style={{
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(10px)',
        border: error ? '1px solid #ef4444' : '1px solid #06b6d4',
        borderRadius: '8px',
        padding: '3rem',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: error ? '0 0 20px rgba(239, 68, 68, 0.2)' : '0 0 20px rgba(6, 182, 212, 0.2)'
      }}>
        {error ? (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
            <h2 style={{ color: '#ef4444', margin: '0 0 1rem 0' }}>Verification Failed</h2>
            <p style={{ color: '#94a3b8' }}>{error}</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ color: '#06b6d4', margin: '0 0 1rem 0' }}>Credential Verified</h2>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>This certificate is an official SateLabs training credential.</p>
            
            <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px' }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recipient</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{result.user_name}</div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course Completed</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#06b6d4' }}>{result.course_name}</div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issue Date</div>
                <div style={{ fontSize: '1rem' }}>{new Date(result.issued_at).toLocaleDateString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Certificate Code</div>
                <div className="mono" style={{ fontSize: '1rem', color: '#94a3b8' }}>{result.certificate_code}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}