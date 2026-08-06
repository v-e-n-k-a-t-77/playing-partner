import { useState, useEffect } from 'react';
import api from '../api/axios';
import TimeWheelPicker from './TimeWheelPicker';
import './EditPlayModal.css';

function parseTimeSlot(timeSlot) {
  const parts = timeSlot.split(' - ');
  const from = parts[0].split(' ');
  const to = parts[1].split(' ');
  const fromParts = from[0].split(':');
  const toParts = to[0].split(':');

  return {
    fromTime: { hour: fromParts[0], minute: fromParts[1], period: from[1] },
    toTime: { hour: toParts[0], minute: toParts[1], period: to[1] },
  };
}

function EditPlayModal({ session, onClose, onUpdated }) {
  const initial = parseTimeSlot(session.time_slot);
  const [fromTime, setFromTime] = useState(initial.fromTime);
  const [toTime, setToTime] = useState(initial.toTime);

  const [grounds, setGrounds] = useState([]);
  const [query, setQuery] = useState(session.ground_name);
  const [showResults, setShowResults] = useState(false);
  const [selectedGround, setSelectedGround] = useState({
    name: session.ground_name,
    lat: session.latitude,
    lon: session.longitude,
  });
  const [loadingGrounds, setLoadingGrounds] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGrounds = async () => {
      try {
        const res = await api.get('/grounds');
        setGrounds(res.data.grounds || []);
      } catch (err) {
        // ignore, ground search just won't show results
      } finally {
        setLoadingGrounds(false);
      }
    };
    fetchGrounds();
  }, []);

  const filteredGrounds = grounds.filter(function (g) {
    return g.name.toLowerCase().includes(query.toLowerCase());
  });

  const handleSelectGround = function (ground) {
    setSelectedGround({ name: ground.name, lat: ground.lat, lon: ground.lon });
    setQuery(ground.name);
    setShowResults(false);
  };

  const handleSave = async () => {
    if (!selectedGround) {
      setError('Please select a ground');
      return;
    }

    setSaving(true);
    setError('');

    const timeSlot =
      fromTime.hour + ':' + fromTime.minute + ' ' + fromTime.period +
      ' - ' +
      toTime.hour + ':' + toTime.minute + ' ' + toTime.period;

    try {
      const res = await api.put('/plays/' + session.id, {
        groundName: selectedGround.name,
        latitude: selectedGround.lat,
        longitude: selectedGround.lon,
        timeSlot: timeSlot,
      });
      onUpdated(res.data.session);
      onClose();
    } catch (err) {
      setError('Could not update play');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={function (e) { e.stopPropagation(); }}>
        <button className="edit-modal-close" onClick={onClose}>×</button>
        <h3>Edit Play</h3>

        <div className="edit-ground-search-wrap">
          <label>Ground</label>
          <input
            type="text"
            value={query}
            onChange={function (e) {
              setQuery(e.target.value);
              setShowResults(true);
              setSelectedGround(null);
            }}
            onFocus={function () { setShowResults(true); }}
            placeholder="Search a ground..."
          />

          {showResults && query ? (
            <ul className="edit-ground-results">
              {loadingGrounds ? <li className="no-results">Loading...</li> : null}
              {!loadingGrounds && filteredGrounds.length === 0 ? (
                <li className="no-results">No grounds found</li>
              ) : null}
              {!loadingGrounds
                ? filteredGrounds.map(function (ground) {
                    return (
                      <li key={ground.id} onClick={function () { handleSelectGround(ground); }}>
                        {ground.name}
                      </li>
                    );
                  })
                : null}
            </ul>
          ) : null}
        </div>

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

        <button className="edit-modal-save" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

export default EditPlayModal;