import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './src/routes/authRoutes.js';
import authMiddleware from './src/middleware/authMiddleware.js';
import weatherRoutes from './src/routes/weatherRoutes.js';
import groundRoutes from './src/routes/groundRoutes.js';
import profileRoutes from './src/routes/profileRoutes.js';
import playRoutes from './src/routes/playRoutes.js';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/grounds', groundRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/plays', playRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'server is working' });
});

app.get('/api/profile', authMiddleware, (req, res) => {
  res.json({ message: 'This is protected data', user: req.user });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));