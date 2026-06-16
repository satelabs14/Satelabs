import { useEffect, useState } from 'react';
import { dashboardApi } from '../services/api';
import { API_BASE } from '../context/AuthContext';

const glassStyle = {
  background: 'rgba(30, 41, 59, 0.7)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  padding: '1.5rem',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.22)'
};

export default function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getCertificates().then((data) => {
      setCertificates(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const downloadPdf = (code) => {
  window.location.href =
    `${API_BASE}/certificates/download/${code}`;
  };

  const viewCertificate = (code) => {
    window.open(`/verify/${code}`, '_blank');
  };

  if (loading) return <div style={{ color: '#fff', padding: '2rem' }}>Loading certificates...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', color: '#f8fafc' }}>
      <h1 style={{ color: '#06b6d4', marginBottom: '2rem' }}>My Credentials</h1>
      {certificates.length === 0 ? (
        <div style={{ ...glassStyle, color: '#94a3b8', textAlign: 'center' }}>
          You have not earned any certificates yet. Complete a course to earn your first certification.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {certificates.map(cert => (
            <div key={cert.id} style={{ ...glassStyle, display: 'flex', flexDirection: 'column', gap: '1.2rem', borderTop: '3px solid #06b6d4' }}>
              <div>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem' }}>Certificate of Completion</h2>
                <div className="mono" style={{ color: '#06b6d4', fontSize: '1rem', background: 'rgba(6,182,212,0.1)', padding: '0.5rem', borderRadius: '4px', display: 'inline-block' }}>
                  {cert.certificate_code}
                </div>
              </div>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
                Issued: <strong style={{ color: '#e2e8f0' }}>{new Date(cert.issued_at).toLocaleDateString()}</strong>
              </p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                <button onClick={() => viewCertificate(cert.certificate_code)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid #06b6d4', color: '#06b6d4', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}>
                  Verify Status
                </button>
                <button onClick={() => downloadPdf(cert.certificate_code)} style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(90deg, #0891b2 0%, #06b6d4 100%)', border: 'none', color: '#020617', borderRadius: '6px', cursor: 'pointer', fontWeight: 800 }}>
                  Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}