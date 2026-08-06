import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Dashboard.css';

function Dashboard() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile/me');
      setProfile(res.data.profile);
    } catch (err) {
      setError('No profile details found');
    }
  };

  const startEditing = () => {
    setFormData({
      profileName: profile.profile_name || '',
      heightCm: profile.height_cm || '',
      weightKg: profile.weight_kg || '',
      favouritePlayer: profile.favourite_player || '',
      maxLevel: profile.max_level || '',
      clubName: profile.club_name || '',
      position: profile.position || '',
      jerseyNo: profile.jersey_no || '',
    });
    setIsEditing(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await api.post('/profile', formData);
      setProfile(res.data.profile);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const bmi =
    formData?.heightCm && formData?.weightKg
      ? (
          formData.weightKg /
          ((formData.heightCm / 100) * (formData.heightCm / 100))
        ).toFixed(1)
      : null;

  const getBmiTag = (value) => {
    const b = parseFloat(value);
    if (b < 18.5) return 'Underweight';
    if (b < 25) return 'Normal';
    if (b < 30) return 'Overweight';
    return 'Obese';
  };

  return (
    <div className="dashboard-page">
      <nav className="dashboard-nav">
        <span className="brand">Playing Partner</span>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <button className="logout-btn" onClick={logout}>Log out</button>
        </div>
      </nav>

      <main className="dashboard-main">
        <span className="eyebrow">Dashboard</span>

        {!isEditing && profile && (
          <>
            {/* PLAYER CARD */}
            <div className="player-card">
              <div className="player-card-top">
                <div>
                  <span className="player-card-label">Profile</span>
                  <h1 className="player-card-name">{profile.profile_name}</h1>
                  <span className="player-position-tag">{profile.position}</span>
                </div>
                {profile.jersey_no && (
                  <div className="jersey-number">
                    <span>#</span>{profile.jersey_no}
                  </div>
                )}
              </div>

              <div className="player-card-meta">
                {profile.club_name && <span>{profile.club_name}</span>}
                {profile.club_name && profile.max_level && <span className="dot">·</span>}
                {profile.max_level && <span>{profile.max_level} level</span>}
              </div>
            </div>

            {/* STAT GRID */}
            <div className="stat-grid">
              <div className="stat-box">
                <span className="stat-value">{profile.height_cm}</span>
                <span className="stat-unit">cm</span>
                <span className="stat-label">Height</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">{profile.weight_kg}</span>
                <span className="stat-unit">kg</span>
                <span className="stat-label">Weight</span>
              </div>
              <div className="stat-box highlight">
                <span className="stat-value">{profile.bmi}</span>
                <span className="stat-unit">{getBmiTag(profile.bmi)}</span>
                <span className="stat-label">BMI</span>
              </div>
            </div>

            {profile.favourite_player && (
              <div className="info-chip">
                <span className="chip-label">Favourite Player</span>
                <span className="chip-value">{profile.favourite_player}</span>
              </div>
            )}

            <button className="edit-btn" onClick={startEditing}>Edit Details</button>
          </>
        )}

        {isEditing && (
          <form className="profile-edit-form" onSubmit={handleSave}>
            <div className="field">
              <label>Profile Name *</label>
              <input type="text" name="profileName" value={formData.profileName} onChange={handleChange} required />
            </div>

            <div className="field-row">
              <div className="field">
                <label>Height (cm) *</label>
                <input type="number" name="heightCm" value={formData.heightCm} onChange={handleChange} required />
              </div>
              <div className="field">
                <label>Weight (kg) *</label>
                <input type="number" name="weightKg" value={formData.weightKg} onChange={handleChange} required />
              </div>
            </div>

            {bmi && (
              <div className="bmi-display">
                BMI: <strong>{bmi}</strong> ({getBmiTag(bmi)})
              </div>
            )}

            <div className="field">
              <label>Position of Play *</label>
              <input type="text" name="position" value={formData.position} onChange={handleChange} required />
            </div>

            <div className="field">
              <label>Favourite Player</label>
              <input type="text" name="favouritePlayer" value={formData.favouritePlayer} onChange={handleChange} />
            </div>

            <div className="field">
              <label>Maximum Level of Play</label>
              <select name="maxLevel" value={formData.maxLevel} onChange={handleChange}>
                <option value="">Select</option>
                <option value="School">School</option>
                <option value="District">District</option>
                <option value="Zonal">Zonal</option>
                <option value="State">State</option>
                <option value="National">National</option>
                <option value="International">International</option>
              </select>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Present Club Name</label>
                <input type="text" name="clubName" value={formData.clubName} onChange={handleChange} />
              </div>
              <div className="field">
                <label>Jersey No.</label>
                <input type="number" name="jerseyNo" value={formData.jerseyNo} onChange={handleChange} />
              </div>
            </div>
            

            {error && <p className="msg error">{error}</p>}

            <div className="edit-actions">
              <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </form>
        )}

        {error && !isEditing && <p className="profile-error">{error}</p>}
      </main>
    </div>
  );
}

export default Dashboard;