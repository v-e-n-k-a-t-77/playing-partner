import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import EditPlayModal from '../components/EditPlayModal';
import './Home.css';
import { Link, useNavigate } from 'react-router-dom';


function Home() {
  const { user, logout } = useAuth();
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState('');
  const [profile, setProfile] = useState(null);
  const [myPlays, setMyPlays] = useState([]);
  const [editingSession, setEditingSession] = useState(null);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile/me');
        setProfile(res.data.profile);
      } catch (err) {
        // no profile yet — that's fine
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setWeatherError('Location not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await api.get('/weather', {
            params: { lat: latitude, lon: longitude },
          });
          setWeather(res.data);
        } catch (err) {
          setWeatherError('Could not load weather');
        }
      },
      () => {
        setWeatherError('Location permission denied');
      }
    );
  }, []);

  useEffect(() => {
    const fetchMyPlays = async () => {
      try {
        const res = await api.get('/plays');
        setMyPlays(res.data.sessions || []);
      } catch (err) {
        // silently ignore, just show nothing
      }
    };
    fetchMyPlays();
  }, []);

  const handleRemovePlay = async (id) => {
    try {
      await api.delete('/plays/' + id);
      setMyPlays(myPlays.filter(function (p) { return p.id !== id; }));
    } catch (err) {
      // could show an error toast here later
    }
  };

  return (
    <div className="home-page">
     <nav className="home-nav">
  <button
    className="hamburger-btn"
    onClick={function () { setMenuOpen(!menuOpen); }}
    aria-label="Menu"
  >
    <span></span>
    <span></span>
    <span></span>
  </button>

  <span className="brand">Playing Partner</span>

  {menuOpen && (
    <div className="dropdown-menu" onClick={function () { setMenuOpen(false); }}>
      <Link to="/dashboard" className="dropdown-item">Dashboard</Link>
      <button className="dropdown-item logout-item" onClick={logout}>Log out</button>
    </div>
  )}
</nav>

      <main className="home-main">
        <span className="eyebrow">Home</span>
        <h1>
          Welcome back{profile?.profile_name ? `, ${profile.profile_name}` : `, ${user?.name}`}
        </h1>
        <p className="subtext">Ready to find your next player?</p>

        {weather && (
          <div className="weather-widget">
            <img src={weather.icon} alt={weather.condition} className="weather-icon" />
            <div>
              <p className="weather-temp">{weather.temp}°C</p>
              <p className="weather-city">{weather.city} · {weather.condition}</p>
            </div>
          </div>
        )}
        {weatherError && <p className="weather-error">{weatherError}</p>}

        <div className="home-actions">
    <span className="confirm-play-wrap">
  <Link to="/confirm-play" className="confirm-play-visual-btn">
    Confirm your play
  </Link>
  <span className="tap-hand">👆</span>
</span>
          {user?.isAdmin && (
            <Link
              to="/add-ground"
              className="secondary-btn"
              style={{ textDecoration: 'none', display: 'inline-block' }}
            >
              Add Ground
            </Link>
          )}
          <Link
            to="/view-players"
            className="secondary-btn"
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            View Players
          </Link>
          <Link
            to="/nearby-grounds"
            className="secondary-btn"
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            Nearby Grounds
          </Link>
        </div>

        {myPlays.length > 0 && (
          <div className="my-plays-section">
            <h2 className="my-plays-title">Your Confirmed Plays</h2>
            <div className="my-plays-circles">
              {myPlays.map(function (session) {
                return (
            <div key={session.id} className="play-circle-wrap">
  <div
    className="play-circle"
    onClick={function () {
      navigate('/view-players?ground=' + encodeURIComponent(session.ground_name));
    }}
  >
    <span className="play-circle-ground">{session.ground_name.slice(0, 2).toUpperCase()}</span>
  </div>
  <p className="play-circle-label">{session.ground_name}</p>
  <p className="play-circle-time">{session.time_slot}</p>
  <div className="play-circle-actions">
    <button onClick={function () { setEditingSession(session); }}>Edit</button>
    <button onClick={function () { handleRemovePlay(session.id); }} className="remove-btn">Remove</button>
  </div>
</div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {editingSession && (
        <EditPlayModal
          session={editingSession}
          onClose={function () { setEditingSession(null); }}
          onUpdated={function (updatedSession) {
            setMyPlays(myPlays.map(function (p) {
              return p.id === updatedSession.id ? updatedSession : p;
            }));
          }}
        />
      )}
    </div>
  );
}

export default Home;