import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './ProfileSetup.css';

function ProfileSetup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    profileName: '',
    heightCm: '',
    weightKg: '',
    favouritePlayer: '',
    maxLevel: '',
    clubName: '',
    position: '',
    jerseyNo: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const bmi =
    formData.heightCm && formData.weightKg
      ? (
          formData.weightKg /
          ((formData.heightCm / 100) * (formData.heightCm / 100))
        ).toFixed(1)
      : null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.post('/profile', formData);
      navigate('/',{replace:true});
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="profile-setup-page">
      <div className="profile-setup-card">
        <span className="eyebrow">One last step</span>
        <h1>Set up your player profile</h1>
        <p className="subtext">This helps other players know who they're playing with.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Profile Name *</label>
            <input
              type="text"
              name="profileName"
              value={formData.profileName}
              onChange={handleChange}
              placeholder="Any name, symbols allowed"
              required
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Height (cm) *</label>
              <input
                type="number"
                name="heightCm"
                value={formData.heightCm}
                onChange={handleChange}
                placeholder="e.g. 175"
                required
              />
            </div>
            <div className="field">
              <label>Weight (kg) *</label>
              <input
                type="number"
                name="weightKg"
                value={formData.weightKg}
                onChange={handleChange}
                placeholder="e.g. 68"
                required
              />
            </div>
          </div>

          {bmi && (
            <div className="bmi-display">
              BMI: <strong>{bmi}</strong>
            </div>
          )}

          <div className="field">
            <label>Position of Play *</label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              placeholder="ex:point guard"
              required
            />
          </div>

          <div className="field">
            <label>Favourite Player</label>
            <input
              type="text"
              name="favouritePlayer"
              value={formData.favouritePlayer}
              onChange={handleChange}
              placeholder="Optional"
            />
          </div>

          <div className="field">
            <label>Maximum Level of Play</label>
            <select name="maxLevel" value={formData.maxLevel} onChange={handleChange}>
              <option value="">Select (optional)</option>
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
              <input
                type="text"
                name="clubName"
                value={formData.clubName}
                onChange={handleChange}
                placeholder="Optional"
              />
            </div>
            <div className="field">
              <label>Jersey No.</label>
              <input
                type="number"
                name="jerseyNo"
                value={formData.jerseyNo}
                onChange={handleChange}
                placeholder="Optional"
              />
            </div>
          </div>

          {error && <p className="msg error">{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfileSetup;