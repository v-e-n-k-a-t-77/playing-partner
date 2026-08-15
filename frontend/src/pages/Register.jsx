import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Register.css';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await register(formData.name, formData.email, formData.password);
      setMessage(res.message + ' Redirecting to login...');
      setTimeout(() => navigate('/login',{replace:true}), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="register-page">
      <div className="register-form-side">
        <div className="register-form-wrap">
          <h1>Create your account</h1>
          <p className="register-subtext">Find someone to play with. Takes a minute.</p>

          <form onSubmit={handleSubmit}>
            <div className="register-field">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                required
              />
            </div>
            <div className="register-field">
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
            <div className="register-field">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                required
              />
            </div>
            <button type="submit">Sign up</button>
          </form>

          {message && <p className="register-msg success" >{message}</p>}
          {error && <p className="register-msg error" style={{backgroundColor:'blue'}}>{error}</p>}

          <p className="register-switch-auth">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>

    
    </div>
  );
}

export default Register;