import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import pool from '../config/db.js';

const router = express.Router();

// ADMIN ONLY — add a ground
router.post('/admin-add', authMiddleware, adminMiddleware, async (req, res) => {
  const { name, lat, lon } = req.body;

  if (!name || lat === undefined || lon === undefined) {
    return res.status(400).json({ message: 'Name, lat, and lon are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO grounds (name, lat, lon, added_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, lat, lon, req.user.id]
    );
    res.status(201).json({ ground: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error adding ground' });
  }
});

// LIST all saved grounds
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM grounds ORDER BY created_at DESC');
    res.json({ grounds: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching grounds' });
  }
});

export default router;