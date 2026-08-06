import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import './ViewPlayers.css';

function parseSlotStart(timeSlot) {
  const fromPart = timeSlot.split(' - ')[0].trim();
  const [time, period] = fromPart.split(' ');
  const [hourStr, minuteStr] = time.split(':');
  let hour = parseInt(hourStr, 10);

  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  return hour + parseInt(minuteStr, 10) / 60;
}

function getSlotCategory(timeSlot) {
  const startHour = parseSlotStart(timeSlot);

  if (startHour < 12) return 'Morning';
  if (startHour < 16) return 'Afternoon';
  if (startHour < 19) return 'Evening';
  return 'Night';
}

function ViewPlayers() {
  const [searchParams] = useSearchParams();
  const [grounds, setGrounds] = useState([]);
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedGround, setSelectedGround] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loadingGrounds, setLoadingGrounds] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [error, setError] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const [viewedProfile, setViewedProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  const handleSelectGround = async (ground) => {
    setSelectedGround(ground);
    setQuery(ground.name);
    setShowResults(false);
    setHighlightedIndex(-1);
    setSessions([]);
    setError('');
    setLoadingSessions(true);

    try {
      const res = await api.get('/plays/by-ground', {
        params: { groundName: ground.name },
      });
      setSessions(res.data.sessions || []);
    } catch (err) {
      setError('Could not load players for this ground');
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    const fetchGrounds = async () => {
      try {
        const res = await api.get('/grounds');
        const loadedGrounds = res.data.grounds || [];
        setGrounds(loadedGrounds);

        const groundParam = searchParams.get('ground');
        if (groundParam) {
          const match = loadedGrounds.find(function (g) {
            return g.name === groundParam;
          });
          if (match) {
            handleSelectGround(match);
          }
        }
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

  const handleViewProfile = async (userId) => {
    setProfileLoading(true);
    setProfileError('');
    setViewedProfile(null);

    try {
      const res = await api.get('/profile/user/' + userId);
      setViewedProfile(res.data.profile);
    } catch (err) {
      setProfileError('Could not load this player\'s profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const closeProfile = () => {
    setViewedProfile(null);
    setProfileError('');
  };

  const slots = { Morning: [], Afternoon: [], Evening: [], Night: [] };
  sessions.forEach((session) => {
    const category = getSlotCategory(session.time_slot);
    slots[category].push(session);
  });

  const slotOrder = ['Morning', 'Afternoon', 'Evening', 'Night'];

  return (
    <div className="view-players-page">
      <nav className="view-players-nav">
        <span className="brand">Playing Partner</span>
        <Link to="/">Home</Link>
      </nav>

      <main className="view-players-main">
        <span className="eyebrow">Today's Matches</span>
        <h1>View Players</h1>
        <p className="subtext">Search a ground to see who's playing today.</p>

        <div className="ground-search-wrap">
          <label>Search for a ground *</label>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
              setSelectedGround(null);
              setSessions([]);
              setHighlightedIndex(-1);
            }}
            onFocus={() => setShowResults(true)}
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
                ? filteredGrounds.map((ground, index) => (
                    <li
                      key={ground.id}
                      className={index === highlightedIndex ? 'highlighted' : ''}
                      onClick={() => handleSelectGround(ground)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      {ground.name}
                    </li>
                  ))
                : null}
            </ul>
          ) : null}
        </div>

        {error ? <p className="msg error">{error}</p> : null}

        {loadingSessions ? <p className="loading-text">Loading players...</p> : null}

        {selectedGround && !loadingSessions && sessions.length === 0 && !error ? (
          <p className="no-sessions-msg">No one has confirmed a play here today yet.</p>
        ) : null}

        {selectedGround && sessions.length > 0 && (
          <div className="slots-container">
            {slotOrder.map((slotName) => (
              <div key={slotName} className="slot-section">
                <h2 className="slot-title">{slotName}</h2>
                {slots[slotName].length === 0 ? (
                  <p className="slot-empty">No players in this slot</p>
                ) : (
                  <div className="player-list">
                    {slots[slotName].map((session) => (
                      <div
                        key={session.id}
                        className="player-row"
                        onClick={() => handleViewProfile(session.user_id)}
                      >
                        <p className="player-name">
                          {session.profile_name || session.account_name}
                        </p>
                        {session.position && (
                          <span className="player-position">{session.position}</span>
                        )}
                        <p className="player-time">{session.time_slot}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {(profileLoading || viewedProfile || profileError) && (
        <div className="profile-modal-overlay" onClick={closeProfile}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <button className="profile-modal-close" onClick={closeProfile}>×</button>

            {profileLoading && <p className="loading-text">Loading profile...</p>}
            {profileError && <p className="msg error">{profileError}</p>}

            {viewedProfile && (
              <>
                <div className="modal-player-card">
                  <span className="modal-player-label">Profile</span>
                  <h2 className="modal-player-name">{viewedProfile.profile_name}</h2>
                  <span className="modal-position-tag">{viewedProfile.position}</span>
                  {viewedProfile.jersey_no && (
                    <div className="modal-jersey">#{viewedProfile.jersey_no}</div>
                  )}
                </div>

                <div className="modal-stat-grid">
                  <div className="modal-stat-box">
                    <span className="modal-stat-value">{viewedProfile.height_cm}</span>
                    <span className="modal-stat-label">Height (cm)</span>
                  </div>
                  <div className="modal-stat-box">
                    <span className="modal-stat-value">{viewedProfile.weight_kg}</span>
                    <span className="modal-stat-label">Weight (kg)</span>
                  </div>
                  <div className="modal-stat-box highlight">
                    <span className="modal-stat-value">{viewedProfile.bmi}</span>
                    <span className="modal-stat-label">BMI</span>
                  </div>
                </div>

                {viewedProfile.favourite_player && (
                  <div className="modal-info-row">
                    <span>Favourite Player</span>
                    <strong>{viewedProfile.favourite_player}</strong>
                  </div>
                )}
                {viewedProfile.max_level && (
                  <div className="modal-info-row">
                    <span>Max Level Played</span>
                    <strong>{viewedProfile.max_level}</strong>
                  </div>
                )}
                {viewedProfile.club_name && (
                  <div className="modal-info-row">
                    <span>Club</span>
                    <strong>{viewedProfile.club_name}</strong>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewPlayers;