import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
};

// REGISTER
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );

    res.status(201).json({ message: 'User registered', user: newUser.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await pool.query('INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)', [user.id, refreshToken]);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

   res.json({
  message: 'Login successful',
  accessToken,
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: user.email === process.env.ADMIN_EMAIL,
  },
});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// REFRESH
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });

  try {
    const stored = await pool.query('SELECT * FROM refresh_tokens WHERE token = $1', [refreshToken]);
    if (stored.rows.length === 0) return res.status(403).json({ message: 'Invalid refresh token' });

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Invalid refresh token' });
      const newAccessToken = generateAccessToken(decoded);
      res.json({ accessToken: newAccessToken });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// LOGOUT
router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  try {
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    res.clearCookie('refreshToken', {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
});
    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
  user: {
    ...user,
    isAdmin: user.email === process.env.ADMIN_EMAIL,
  },
});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;