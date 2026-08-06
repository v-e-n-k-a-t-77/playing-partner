import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import './NearbyGrounds.css';

function toRad(value) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function NearbyGrounds() {
  const [grounds, setGrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Location not supported by your browser');
      fetchGrounds();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function (position) {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        fetchGrounds();
      },
      function () {
        setLocationError('Location permission denied — showing unsorted list');
        fetchGrounds();
      }
    );
  }, []);

  const fetchGrounds = async () => {
    try {
      const res = await api.get('/grounds');
      setGrounds(res.data.grounds || []);
    } catch (err) {
      setError('Could not load grounds');
    } finally {
      setLoading(false);
    }
  };

  let displayGrounds = grounds.map(function (ground) {
    if (userLocation) {
      const distance = getDistanceKm(
        userLocation.lat,
        userLocation.lon,
        parseFloat(ground.lat),
        parseFloat(ground.lon)
      );
      return Object.assign({}, ground, { distance: distance });
    }
    return Object.assign({}, ground, { distance: null });
  });

  if (userLocation) {
    displayGrounds = displayGrounds.slice().sort(function (a, b) {
      return a.distance - b.distance;
    });
  }

  return (
    <div className="nearby-grounds-page">
      <nav className="nearby-grounds-nav">
        <span className="brand">Playing Partner</span>
        <Link to="/">Home</Link>
      </nav>

      <main className="nearby-grounds-main">
        <span className="eyebrow">Grounds</span>
        <h1>Nearby Grounds</h1>
        <p className="subtext">
          {userLocation
            ? 'Sorted by distance from your current location.'
            : 'All grounds added so far.'}
        </p>

        {locationError ? <p className="location-note">{locationError}</p> : null}
        {loading ? <p className="loading-text">Loading grounds...</p> : null}
        {error ? <p className="msg error">{error}</p> : null}

        {!loading && displayGrounds.length === 0 ? (
          <p className="no-grounds-msg">No grounds have been added yet.</p>
        ) : null}

        {!loading && displayGrounds.length > 0 ? (
          <div className="grounds-grid">
            {displayGrounds.map(function (ground) {
              const mapsUrl = 'https://www.google.com/maps/dir/?api=1&destination=' + ground.lat + ',' + ground.lon;
              return (
                <div key={ground.id} className="ground-box">
                  <div className="ground-box-top">
                    <h3>{ground.name}</h3>
                    {ground.distance !== null ? (
                      <span className="ground-distance">
                        {ground.distance < 1
                          ? Math.round(ground.distance * 1000) + ' m'
                          : ground.distance.toFixed(1) + ' km'}
                      </span>
                    ) : null}
                  </div>
                  <p className="ground-coords">
                    {parseFloat(ground.lat).toFixed(4)}, {parseFloat(ground.lon).toFixed(4)}
                  </p>
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="ground-directions">
                    Get Directions
                  </a>
                </div>
              );
            })}
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default NearbyGrounds;