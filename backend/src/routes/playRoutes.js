import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import pool from '../config/db.js';

const router = express.Router();

function calculateEndAt(timeSlot) {
  // timeSlot format: "06:00 PM - 07:00 PM"
  const toPart = timeSlot.split(' - ')[1].trim(); // "07:00 PM"
  const [time, period] = toPart.split(' ');
  const [hourStr, minuteStr] = time.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  const now = new Date();
  const endAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
  return endAt;
}

// CREATE a new play session
router.post('/', authMiddleware, async (req, res) => {
  const { groundName, latitude, longitude, timeSlot } = req.body;

  if (!groundName || latitude === undefined || longitude === undefined || !timeSlot) {
    return res.status(400).json({ message: 'Ground name, latitude, longitude, and time slot are required' });
  }

  try {
    const existing = await pool.query(
      `SELECT id FROM play_sessions
       WHERE user_id = $1 AND ground_name = $2 AND time_slot = $3 AND end_at > NOW()`,
      [req.user.id, groundName, timeSlot]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'You have already confirmed this ground and time slot' });
    }

    const endAt = calculateEndAt(timeSlot);

    const result = await pool.query(
      `INSERT INTO play_sessions (user_id, ground_name, latitude, longitude, time_slot, end_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, groundName, latitude, longitude, timeSlot, endAt]
    );
    res.status(201).json({ session: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating play session' });
  }
});
    

// UPDATE a play session
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { groundName, latitude, longitude, timeSlot } = req.body;

  if (!groundName || latitude === undefined || longitude === undefined || !timeSlot) {
    return res.status(400).json({ message: 'Ground name, latitude, longitude, and time slot are required' });
  }

  try {
    const existing = await pool.query(
      `SELECT id FROM play_sessions
       WHERE user_id = $1 AND ground_name = $2 AND time_slot = $3 AND end_at > NOW() AND id != $4`,
      [req.user.id, groundName, timeSlot, id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'You have already confirmed this ground and time slot' });
    }

    const endAt = calculateEndAt(timeSlot);

    const result = await pool.query(
      `UPDATE play_sessions
       SET ground_name = $1, latitude = $2, longitude = $3, time_slot = $4, end_at = $5
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [groundName, latitude, longitude, timeSlot, endAt, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Play session not found or not yours' });
    }

    res.json({ session: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating play session' });
  }
});

// DELETE a play session
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM play_sessions WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Play session not found or not yours' });
    }

    res.json({ message: 'Play session removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting play session' });
  }
});

// LIST my own ACTIVE play sessions (not yet expired)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM play_sessions
       WHERE user_id = $1 AND end_at > NOW()
       ORDER BY end_at ASC`,
      [req.user.id]
    );
    res.json({ sessions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching play sessions' });
  }
});

// GET active players for a ground (not yet expired)
router.get('/by-ground', authMiddleware, async (req, res) => {
  const { groundName } = req.query;

  if (!groundName) {
    return res.status(400).json({ message: 'Ground name is required' });
  }

  try {
    const result = await pool.query(
      `SELECT
         ps.id,
         ps.ground_name,
         ps.time_slot,
         ps.end_at,
         u.id AS user_id,
         u.name AS account_name,
         p.profile_name,
         p.position,
         p.jersey_no
       FROM play_sessions ps
       JOIN users u ON ps.user_id = u.id
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE ps.ground_name = $1 AND ps.end_at > NOW()
       ORDER BY ps.end_at ASC`,
      [groundName]
    );

    res.json({ sessions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching players' });
  }
});

export default router;