import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import TimeWheelPicker from '../components/TimeWheelPicker';
import './ConfirmPlay.css';

function ConfirmPlay() {
  const navigate = useNavigate();
  const [grounds, setGrounds] = useState([]);
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedGround, setSelectedGround] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState('');
  const [fromTime, setFromTime] = useState({ hour: '06', minute: '00', period: 'PM' });
  const [toTime, setToTime] = useState({ hour: '07', minute: '00', period: 'PM' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingGrounds, setLoadingGrounds] = useState(true);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    const fetchGrounds = async () => {
      try {
        const res = await api.get('/grounds');
        setGrounds(res.data.grounds || []);
      } catch (err) {
        setError('Could not load grounds list');
      } finally {
        setLoadingGrounds(false);
      }
    };
    fetchGrounds();
  }, []);

  const filteredGrounds = grounds.filter((g) =>
    g.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectGround = async (ground) => {
    setSelectedGround(ground);
    setQuery(ground.name);
    setShowResults(false);
    setHighlightedIndex(-1);
    setWeather(null);
    setWeatherError('');

    try {
      const res = await api.get('/weather', {
        params: { lat: ground.lat, lon: ground.lon },
      });
      setWeather(res.data);
    } catch (err) {
      setWeatherError('Could not load weather for this ground');
    }
  };

  const handleKeyDown = (e) => {
    if (!showResults || filteredGrounds.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(function (prev) {
        return prev < filteredGrounds.length - 1 ? prev + 1 : 0;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(function (prev) {
        return prev > 0 ? prev - 1 : filteredGrounds.length - 1;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredGrounds.length) {
        handleSelectGround(filteredGrounds[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setHighlightedIndex(-1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedGround) {
      setError('Please select a ground from the search results');
      return;
    }

    const timeSlot =
      fromTime.hour + ':' + fromTime.minute + ' ' + fromTime.period +
      ' - ' +
      toTime.hour + ':' + toTime.minute + ' ' + toTime.period;

    setSubmitting(true);
    try {
      await api.post('/plays', {
        groundName: selectedGround.name,
        latitude: selectedGround.lat,
        longitude: selectedGround.lon,
        timeSlot: timeSlot,
      });
      setSuccess('Play confirmed!');
      setTimeout(function () {
        navigate('/');
      }, 1200);
    } catch (err) {
      const msg = err.response && err.response.data && err.response.data.message
        ? err.response.data.message
        : 'Could not confirm play';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const mapsUrl = selectedGround
    ? 'https://www.google.com/maps/dir/?api=1&destination=' + selectedGround.lat + ',' + selectedGround.lon
    : '';

  return (
    <div className="confirm-play-page">
      <div className="confirm-play-card">
        <span className="eyebrow">Set up a match</span>
        <h1>Confirm your play</h1>
        <p className="subtext">Search for a ground, check the weather, and lock in a time.</p>

        <div className="ground-search-wrap">
          <label>Search for a ground *</label>
          <input
            type="text"
            value={query}
            onChange={function (e) {
              setQuery(e.target.value);
              setShowResults(true);
              setSelectedGround(null);
              setWeather(null);
              setHighlightedIndex(-1);
            }}
            onFocus={function () {
              setShowResults(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a ground name..."
          />

          {showResults && query ? (
            <ul className="ground-results">
              {loadingGrounds ? <li className="no-results">Loading grounds...</li> : null}
              {!loadingGrounds && filteredGrounds.length === 0 ? (
                <li className="no-results">No grounds found</li>
              ) : null}
              {!loadingGrounds
                ? filteredGrounds.map(function (ground, index) {
                    return (
                      <li
                        key={ground.id}
                        className={index === highlightedIndex ? 'highlighted' : ''}
                        onClick={function () { handleSelectGround(ground); }}
                        onMouseEnter={function () { setHighlightedIndex(index); }}
                      >
                        {ground.name}
                      </li>
                    );
                  })
                : null}
            </ul>
          ) : null}

          {!loadingGrounds && grounds.length === 0 ? (
            <p className="no-grounds-msg">No grounds have been added yet by the admin.</p>
          ) : null}
        </div>

        {selectedGround && weather ? (
          <div className="ground-weather-box">
            <h3>{selectedGround.name}</h3>
            <img src={weather.icon} alt={weather.condition} className="ground-weather-icon" />
            <p className="ground-weather-temp">{weather.temp} C</p>
            <p className="ground-weather-condition">{weather.condition}</p>
            <p className="ground-weather-humidity">Humidity: {weather.humidity}%</p>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="directions-link">
              Get Directions
            </a>
          </div>
        ) : null}

        {weatherError ? <p className="msg error">{weatherError}</p> : null}

        <form onSubmit={handleSubmit}>
          <div className="time-range-row">
            <TimeWheelPicker
              label="From"
              hour={fromTime.hour}
              minute={fromTime.minute}
              period={fromTime.period}
              onChange={setFromTime}
            />
            <TimeWheelPicker
              label="To"
              hour={toTime.hour}
              minute={toTime.minute}
              period={toTime.period}
              onChange={setToTime}
            />
          </div>

          {error ? <p className="msg error">{error}</p> : null}
          {success ? <p className="msg success">{success}</p> : null}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Confirming...' : 'Confirm your play'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ConfirmPlay;