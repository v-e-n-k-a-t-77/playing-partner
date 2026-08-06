import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import pool from '../config/db.js';

const router = express.Router();

// GET own profile — used to check if setup is already done
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not set up yet' });
    }
    res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// CREATE or UPDATE profile
router.post('/', authMiddleware, async (req, res) => {
  const {
    profileName,
    heightCm,
    weightKg,
    favouritePlayer,
    maxLevel,
    clubName,
    position,
    jerseyNo,
  } = req.body;

  if (!profileName || !heightCm || !weightKg || !position) {
    return res.status(400).json({ message: 'Profile name, height, weight, and position are required' });
  }

  const heightM = heightCm / 100;
  const bmi = +(weightKg / (heightM * heightM)).toFixed(2);

  try {
    const existing = await pool.query('SELECT id FROM profiles WHERE user_id = $1', [req.user.id]);

    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        `UPDATE profiles SET
          profile_name = $1, height_cm = $2, weight_kg = $3, bmi = $4,
          favourite_player = $5, max_level = $6, club_name = $7,
          position = $8, jersey_no = $9
         WHERE user_id = $10 RETURNING *`,
        [profileName, heightCm, weightKg, bmi, favouritePlayer || null, maxLevel || null, clubName || null, position, jerseyNo || null, req.user.id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO profiles
          (user_id, profile_name, height_cm, weight_kg, bmi, favourite_player, max_level, club_name, position, jersey_no)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [req.user.id, profileName, heightCm, weightKg, bmi, favouritePlayer || null, maxLevel || null, clubName || null, position, jerseyNo || null]
      );
    }

    res.status(201).json({ profile: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error saving profile' });
  }
});
// GET any user's profile by their user id (for viewing other players)
router.get('/user/:userId', authMiddleware, async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT p.*, u.name AS account_name, u.email
       FROM profiles p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

export default router;