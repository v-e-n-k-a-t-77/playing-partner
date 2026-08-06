import { useState } from 'react';
import api from '../api/axios';
import './GroundWeather.css';

function GroundWeather() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedGround, setSelectedGround] = useState(null);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length < 2) {
      setResults([]);
      return;
    }

    try {
      const res = await api.get('/grounds/search', { params: { query: value } });
      setResults(res.data);
    } catch (err) {
      console.error('Search error:', err.response?.data || err.message);
      setResults([]);
    }
  };

  const handleSelect = async (place) => {
    setQuery(place.name);
    setResults([]);
    setError('');

    try {
      const saveRes = await api.post('/grounds', {
        name: `${place.name}, ${place.region || place.country}`,
        lat: place.lat,
        lon: place.lon,
      });
      setSelectedGround(saveRes.data.ground);

      const weatherRes = await api.get('/weather', {
        params: { lat: place.lat, lon: place.lon },
      });
      setWeather(weatherRes.data);
    } catch (err) {
      console.error('GroundWeather error:', err.response?.data || err.message);
      setError('Could not load ground weather');
    }
  };

  return (
    <div className="ground-weather">
      <div className="ground-search">
        <label>Search for a ground</label>
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Type a city or ground name..."
        />

        {results.length > 0 && (
          <ul className="ground-results">
            {results.map((place) => (
              <li key={place.id} onClick={() => handleSelect(place)}>
                {place.name}, {place.region || place.country}
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedGround && weather && (
        <div className="ground-weather-box">
          <h3>{selectedGround.name}</h3>
          <img
            src={weather.icon}
            alt={weather.condition}
            className="ground-weather-icon"
          />
          <p className="ground-weather-temp">{weather.temp}°C</p>
          <p className="ground-weather-condition">{weather.condition}</p>
          <p className="ground-weather-humidity">Humidity: {weather.humidity}%</p>
        </div>
      )}

      {error && <p className="ground-weather-error">{error}</p>}
    </div>
  );
}

export default GroundWeather;