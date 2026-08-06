import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './AddGround.css';

function AddGround() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ name: '', lat: '', lon: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await api.post('/grounds/admin-add', formData);
      setMessage(`Ground "${res.data.ground.name}" added successfully`);
      setFormData({ name: '', lat: '', lon: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add ground');
    }
  };

  return (
    <div className="add-ground-page">
      <div className="add-ground-card">
        <span className="eyebrow">Admin</span>
        <h1>Add a Ground</h1>
        <p className="subtext">Give a ground a name and its exact coordinates.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Ground Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. YMCA Narayanguda" required />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Latitude *</label>
              <input type="number" step="any" name="lat" value={formData.lat} onChange={handleChange} placeholder="e.g. 17.385044" required />
            </div>
            <div className="field">
              <label>Longitude *</label>
              <input type="number" step="any" name="lon" value={formData.lon} onChange={handleChange} placeholder="e.g. 78.486671" required />
            </div>
          </div>

          {message && <p className="msg success">{message}</p>}
          {error && <p className="msg error">{error}</p>}

          <button type="submit">Add Ground</button>
        </form>
      </div>
    </div>
  );
}

export default AddGround;