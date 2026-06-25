import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../context/AuthContext';
import './Labs.css';

const LabCard = ({ lab, onComplete }) => {
  const [flagInput, setFlagInput] = useState('');
  const [showFlag, setShowFlag] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!flagInput.trim()) return;
    setSubmitting(true);
    try {
  const res = await axios.post(
  `${API_BASE}/labs/${lab.id}/complete`,
  {},
  {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('satelabs_token')}`
    }
  }
);

  setResult('success');

  // Dashboard refresh
  window.dispatchEvent(
    new Event('satelabs:progress-updated')
  );

  // Optional success popup
  if (res.data?.points_earned) {
    alert(`🎉 +${res.data.points_earned} Points Earned`);
  }

  onComplete(lab.id);

} catch (err) {

  if (
    err.response?.data?.detail ===
    "Lab already completed"
  ) {

    setResult("success");

    onComplete(lab.id);

  } else {

    setResult("error");

  }
}
  };

  const typeColor = { Web: 'cyan', Network: 'amber', Forensics: 'purple', Crypto: 'green', Misc: 'muted' };
  const color = 'cyan';

  return (
    <div className={`lab-card ${lab.is_completed ? 'lab-done' : ''}`}>
      <div className="lab-header">
        <div className="lab-badges">
          <span className={`lab-type type-${color}`}>Lab</span>
          <span className={`lab-diff ${lab.difficulty?.toLowerCase()}`}>{lab.difficulty || 'Easy'}</span>
        </div>
        <span className="lab-points mono">+{lab.points || 50} pts</span>
      </div>

      <h3 className="lab-title">{lab.title}</h3>
      <p className="lab-desc">{lab.description || 'Complete this challenge to earn points.'}</p>

      {lab.is_completed ? (
        <div className="lab-completed">
          <span>✓</span> Completed
        </div>
      ) : (
        <div className="lab-actions">
          <button
            className="btn-flag-toggle"
            onClick={() => setShowFlag(!showFlag)}
          >
            {showFlag ? 'Cancel' : 'Complete Lab'}
          </button>

          {showFlag && (
            <div className="flag-input-wrap">
              <input
                className={`flag-input ${result === 'wrong' ? 'flag-wrong' : result === 'success' ? 'flag-success' : ''}`}
                type="text"
                placeholder="FLAG{...}"
                value={flagInput}
                onChange={e => setFlagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
              <button className="btn-submit-flag" onClick={handleSubmit} disabled={submitting}>
                {submitting ? '...' : '→'}
              </button>
              {result === 'wrong' && (
                <p className="flag-feedback wrong">Incorrect flag. Try again.</p>
              )}
              {result === 'error' && (
                <p className="flag-feedback error">Submission error.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function LabsPage() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  //const [filter, setFilter] = useState('All');

  //const types = ['All', 'Web', 'Network', 'Forensics', 'Crypto', 'Misc'];

  useEffect(() => {
    axios.get(`${API_BASE}/labs`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('satelabs_token')}` }
    }).then(res => {
      setLabs(res.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleComplete = (labId) => {
    setLabs(prev => prev.map(l => l.id === labId ? { ...l, is_completed: true } : l));
  };

//const filtered = filter === 'All' ? labs : labs.filter(l => l.type === filter);
  const filtered = labs;
  const completedCount = labs.filter(
  lab => lab.is_completed
).length;

  return (
    <div className="page labs-page">
      <div className="page-header">
        <p className="page-eyebrow">// CHALLENGE ARENA</p>
        <h1 className="page-title">Labs</h1>
        <p className="page-subtitle">
          {completedCount}/{labs.length} challenges completed
        </p>
      </div>

      {/* Progress overview */}
      <div className="labs-progress-bar">
        <div className="progress-track">
          <div
            className="progress-fill progress-fill-amber"
            style={{ width: labs.length ? `${(completedCount / labs.length) * 100}%` : '0%' }}
          />
        </div>
        <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
          {labs.length ? Math.round((completedCount / labs.length) * 100) : 0}% done
        </span>
      </div>

      {loading ? (
        <div className="labs-grid">
          {[1,2,3,4,5,6].map(i => <div key={i} className="lab-skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="courses-empty">
          <p className="empty-icon">⬢</p>
          <p>No labs found</p>
        </div>
      ) : (
        <div className="labs-grid">
          {filtered.map(lab => (
            <LabCard key={lab.id} lab={lab} onComplete={handleComplete} />
          ))}
        </div>
      )}
    </div>
  );
}
