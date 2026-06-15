import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../context/AuthContext';
import './Certificates.css';

export default function CertificatesPage() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/certificates/my`).then(res => {
      setCerts(res.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleVerify = async () => {
    if (!verifyCode.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await axios.get(`${API_BASE}/certificates/verify/${verifyCode.trim()}`);
      setVerifyResult({ valid: true, data: res.data });
    } catch {
      setVerifyResult({ valid: false });
    } finally {
      setVerifying(false);
    }
  };

  const handleDownload = async (certId) => {
    try {
      const res = await axios.get(`${API_BASE}/certificates/${certId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `satelabs-certificate-${certId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Download not available yet.');
    }
  };

  return (
    <div className="page certs-page">
      <div className="page-header">
        <p className="page-eyebrow">// ACHIEVEMENTS</p>
        <h1 className="page-title">Certificates</h1>
        <p className="page-subtitle">Your earned certifications and credentials</p>
      </div>

      {/* Verify section */}
      <div className="verify-card">
        <h3 className="verify-title">Verify a Certificate</h3>
        <p className="verify-desc">Enter a certificate code to check its authenticity</p>
        <div className="verify-input-row">
          <input
            className="form-input"
            type="text"
            placeholder="SATE-XXXX-XXXX-XXXX"
            value={verifyCode}
            onChange={e => setVerifyCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleVerify()}
            style={{ flex: 1 }}
          />
          <button className="btn-verify" onClick={handleVerify} disabled={verifying}>
            {verifying ? '...' : 'Verify'}
          </button>
        </div>
        {verifyResult && (
          <div className={`verify-result ${verifyResult.valid ? 'valid' : 'invalid'}`}>
            {verifyResult.valid ? (
              <>
                <span>✓</span> Valid certificate — issued to <strong>{verifyResult.data?.username}</strong> for{' '}
                <strong>{verifyResult.data?.course_title}</strong>
              </>
            ) : (
              <><span>✕</span> Certificate not found or invalid</>
            )}
          </div>
        )}
      </div>

      {/* Certificates grid */}
      <div className="certs-header">
        <h2 className="section-title">My Certificates</h2>
        <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {certs.length} earned
        </span>
      </div>

      {loading ? (
        <div className="certs-grid">
          {[1,2,3].map(i => <div key={i} className="cert-skeleton" />)}
        </div>
      ) : certs.length === 0 ? (
        <div className="courses-empty" style={{ paddingTop: 40 }}>
          <p className="empty-icon">△</p>
          <p>No certificates yet</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Complete a course to earn your first certificate</p>
        </div>
      ) : (
        <div className="certs-grid">
          {certs.map(cert => (
            <div key={cert.id} className="cert-card">
              <div className="cert-card-top">
                <div className="cert-emblem">⬡</div>
                <div className="cert-org">SateLabs</div>
              </div>

              <div className="cert-body">
                <p className="cert-label">Certificate of Completion</p>
                <h3 className="cert-course">{cert.course_title}</h3>
                <p className="cert-date">
                  Issued {new Date(cert.issued_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </p>
              </div>

              <div className="cert-footer">
                <span className="cert-code mono">{cert.certificate_code}</span>
                <button className="btn-download" onClick={() => handleDownload(cert.id)}>
                  ↓ PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
