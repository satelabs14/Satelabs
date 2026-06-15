import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../context/AuthContext';
import './Profile.css';

export default function ProfilePage() {
  const { user, fetchCurrentUser } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', bio: '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [stats, setStats] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [pwMessage, setPwMessage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    if (user) {
      setForm({ username: user.username || '', email: user.email || '', bio: user.bio || '' });
    }
    setProfileImage(user?.profile_image || null);
    axios.get(`${API_BASE}/dashboard/stats`).then(res => setStats(res.data)).catch(() => {});
  }, [user]);

  const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await axios.post(
      `${API_BASE}/profile/upload-image`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("satelabs_token")}`,
        },
      }
    );

    console.log("Upload response:", res.data);
    
    // Refresh user data from backend to get updated profile_image
    await fetchCurrentUser();
    
    setMessage({
      type: 'success',
      text: 'Profile image updated successfully.'
    });
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000);
  } catch (err) {
    console.error("Upload error:", err);
    setMessage({
      type: 'error',
      text: err.response?.data?.detail || 'Failed to upload image.'
    });
  }
};

  const handleSave = async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("satelabs_token");

  setSaving(true);
  setMessage(null);

  try {
    await axios.put(
      `${API_BASE}/profile/update`,
      {
        username: form.username,
        bio: form.bio
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    setMessage({
      type: 'success',
      text: 'Profile updated successfully.'
    });

    // Refresh user data from backend
    await fetchCurrentUser();
    
    // Update form with latest data after refresh
    setTimeout(() => {
      if (user) {
        setForm({ username: user.username || '', email: user.email || '', bio: user.bio || '' });
      }
    }, 100);

  } catch (err) {
    setMessage({
      type: 'error',
      text: err.response?.data?.detail || 'Failed to update profile.'
    });
  } finally {
    setSaving(false);
  }
};

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) {
      setPwMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setPwSaving(true);
    setPwMessage(null);
    try {
      await axios.put(`${API_BASE}/users/me/password`, {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      setPwMessage({ type: 'success', text: 'Password changed.' });
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPwMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to change password.' });
    } finally {
      setPwSaving(false);
    }
  };

  const profileStats = [
    { label: 'Points', value: user?.points || 0, color: 'cyan' },
    { label: 'Rank', value: user?.rank || 'Recruit', color: 'amber' },
    { label: 'Courses', value: stats?.completed_courses ?? 0, color: 'green' },
    { label: 'Labs', value: stats?.completed_labs ?? 0, color: 'purple' },
  ];

  return (
    <div className="page profile-page">
      <div className="page-header">
        <p className="page-eyebrow">// OPERATOR PROFILE</p>
        <h1 className="page-title">Profile</h1>
      </div>

      <div className="profile-grid">
        {/* Left: Avatar + Stats */}
        <div className="profile-left">
          <div className="profile-card">
            <div className="profile-avatar-large">
  {user?.profile_image ? (
    <img
      src={`http://localhost:8000/${user.profile_image}`}
      alt="Profile"
      className="profile-avatar-img"
      onError={(e) => {
        console.error("Image load error:", e.currentTarget.src);
        e.currentTarget.style.display = "none";
      }}
    />
  ) : (
    user?.username?.[0]?.toUpperCase() || "U"
  )}
</div>

<label className="profile-upload-btn">
  📷 Change Avatar
  <input
    type="file"
    accept="image/*"
    onChange={handleImageUpload}
    hidden
  />
</label>
            <h2 className="profile-username">{user?.username}</h2>
            <p className="profile-email">{user?.email}</p>
            {user?.bio && <p className="profile-bio">{user.bio}</p>}

            <div className="profile-stats">
              {profileStats.map(s => (
                <div key={s.label} className="profile-stat">
                  <p className={`profile-stat-val mono color-${s.color}`}>{s.value}</p>
                  <p className="profile-stat-label">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="member-since">
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>MEMBER SINCE</span>
              <p style={{ fontSize: 13, marginTop: 2 }}>
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Edit forms */}
        <div className="profile-right">
          {/* Edit profile */}
          <div className="profile-section">
            <h3 className="profile-section-title">Edit Profile</h3>
            <form onSubmit={handleSave} className="profile-form">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea
                  className="form-input form-textarea"
                  value={form.bio}
                  onChange={e => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell others about yourself..."
                  rows={3}
                />
              </div>

              {message && (
                <div className={`form-message ${message.type}`}>
                  {message.text}
                </div>
              )}

              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Change password */}
          <div className="profile-section">
            <h3 className="profile-section-title">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="profile-form">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={pwForm.current_password}
                  onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={pwForm.new_password}
                  onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={pwForm.confirm}
                  onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                  required
                />
              </div>

              {pwMessage && (
                <div className={`form-message ${pwMessage.type}`}>
                  {pwMessage.text}
                </div>
              )}

              <button className="btn-primary" type="submit" disabled={pwSaving}>
                {pwSaving ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
