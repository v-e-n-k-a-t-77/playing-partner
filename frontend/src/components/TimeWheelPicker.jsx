import { useRef, useEffect } from 'react';
import './TimeWheelPicker.css';

const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];
const PERIODS = ['AM', 'PM'];

function Wheel({ options, value, onChange }) {
  const containerRef = useRef(null);
  const itemHeight = 40;

  useEffect(() => {
    const index = options.indexOf(value);
    if (containerRef.current && index !== -1) {
      containerRef.current.scrollTop = index * itemHeight;
    }
  }, []);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clamped = Math.max(0, Math.min(index, options.length - 1));
    const newValue = options[clamped];
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handleClick = (option, index) => {
    onChange(option);
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: index * itemHeight, behavior: 'smooth' });
    }
  };

  return (
    <div className="wheel-outer">
      <div className="wheel-highlight" />
      <div
        className="wheel-scroll"
        ref={containerRef}
        onScroll={handleScroll}
      >
        <div className="wheel-pad" />
        {options.map((option, index) => (
          <div
            key={option}
            className={'wheel-item' + (option === value ? ' active' : '')}
            onClick={() => handleClick(option, index)}
          >
            {option}
          </div>
        ))}
        <div className="wheel-pad" />
      </div>
    </div>
  );
}

function TimeWheelPicker({ label, hour, minute, period, onChange }) {
  return (
    <div className="time-wheel-picker">
      <label>{label}</label>
      <div className="wheel-row">
        <Wheel options={HOURS} value={hour} onChange={(v) => onChange({ hour: v, minute, period })} />
        <span className="wheel-colon">:</span>
        <Wheel options={MINUTES} value={minute} onChange={(v) => onChange({ hour, minute: v, period })} />
        <Wheel options={PERIODS} value={period} onChange={(v) => onChange({ hour, minute, period: v })} />
      </div>
    </div>
  );
}

export default TimeWheelPicker;