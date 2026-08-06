import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Login.css';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(formData.email, formData.password);

      try {
        await api.get('/profile/me');
        navigate('/',{replace:true}); // profile already exists → go to Home
      } catch (profileErr) {
        navigate('/profile-setup',{replace:true}); // no profile yet → go fill it in
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    }
  };

  return (
    <div className="login-page">
      <div className="login-form-side">
        <div className="form-wrap">
          <span className="eyebrow">Playing Partner</span>
          <h1>Welcome back</h1>
          <p className="subtext">Log in to find your next match.</p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Your password"
                required
              />
            </div>
            <button type="submit">Log in</button>
          </form>

          {error && <p className="msg error">{error}</p>}

          <p className="switch-auth">
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;