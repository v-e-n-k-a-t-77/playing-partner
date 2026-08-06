import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }

  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${lat},${lon}`
    );
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ message: data.error.message || 'Weather fetch failed' });
    }

    res.json({
      city: data.location.name,
      temp: Math.round(data.current.temp_c),
      condition: data.current.condition.text,
      icon: `https:${data.current.condition.icon}`,
      humidity: data.current.humidity,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching weather' });
  }
});

export default router;