
# 🏀 Playing Partner

**Playing Partner** is a full-stack web application that helps players discover grounds, check live weather before heading out, book time slots for a game, and see who else is playing at the same venue — all in one place.

Built as a final year project to demonstrate a complete, production-style full-stack architecture, from secure authentication and third-party API integration to a fully custom, hand-designed UI.

🔗 **Live Repo:** [github.com/v-e-n-k-a-t-77/playing-partner](https://github.com/v-e-n-k-a-t-77/playing-partner)

---

## 🎯 Key Technical Highlights

*What this project actually demonstrates, beyond the feature list:*

- **Secure, production-grade authentication** — not just login/logout, but a proper **access token + httpOnly refresh token** pattern with server-side session revocation, silent token renewal on page refresh, and bcrypt password hashing.
- **Defense in depth for admin controls** — admin-only actions (like adding grounds) are protected at three separate layers: hidden UI, client-side route guard, and enforced server-side middleware — so security never relies on the frontend alone.
- **Real third-party API integration** — live weather lookups (WeatherAPI.com) and venue autocomplete search (Google Places API), both proxied through the backend so API keys are never exposed to the browser.
- **Thoughtful data modeling** — time-bound play sessions that automatically expire based on a calculated `end_at` timestamp, duplicate-booking prevention at the database query level, and relational integrity via foreign keys with cascade deletes.
- **Full CRUD with ownership checks** — players can edit/delete only their own play sessions, enforced by `WHERE user_id = $1` checks on every mutation, not just UI hiding.
- **A custom-built design system** — no UI framework; hand-crafted CSS design tokens (color, type, spacing) applied consistently across 12+ pages for a cohesive, branded look.

---

## ✨ Features

### Authentication & Security
- JWT-based authentication with short-lived access tokens and httpOnly refresh tokens
- Passwords hashed with bcrypt — never stored in plain text
- Session persistence across page refreshes via silent token refresh
- Protected routes with automatic redirect for unauthenticated users
- Role-based access control for admin-only actions

### Player Profiles
- One-time guided profile setup after registration (height, weight, position, jersey number, club, playing level, favourite player)
- Automatic BMI calculation with category labeling
- Editable, player-card style dashboard
- View any other player's public profile from the "View Players" screen

### Grounds & Weather
- Admin-managed ground directory with custom names and precise coordinates
- Ground search with Google Places autocomplete, falling back to saved grounds first
- Live weather (temperature, condition, humidity) for any ground via WeatherAPI.com
- One-tap "Get Directions" linking directly to Google Maps
- "Nearby Grounds" page listing every saved venue in a responsive card grid

### Confirm Your Play
- Search and select a ground, preview live weather for that exact location
- iOS-style scrollable time wheel picker (hour / minute / AM–PM) for setting a From–To time slot
- Duplicate-booking protection at the database level
- Automatic expiry — confirmed plays disappear once their slot ends, resetting naturally each day
- Edit or remove a confirmed play at any time, reflected instantly for other players

### View Players
- Search any ground to see everyone who has confirmed a play there **today**
- Players automatically grouped into Morning / Afternoon / Evening / Night slots
- Click any player to view their full profile in a modal
- Deep-linkable — clicking a confirmed play circle on Home jumps straight to that ground's player list

---

## 🛠 Tech Stack

**Frontend**
- React (Vite)
- React Router
- Axios with interceptor-based token refresh
- Custom CSS — no component library, hand-built design system

**Backend**
- Node.js + Express
- PostgreSQL (`pg`)
- JWT (`jsonwebtoken`) — access/refresh token pattern
- `bcryptjs` for password hashing
- `cookie-parser` for httpOnly refresh token cookies

**External APIs**
- [WeatherAPI.com](https://www.weatherapi.com/) — live weather data
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service) — venue search

---

## 📁 Project Structure

```
playing-partner/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── adminMiddleware.js
│   │   └── routes/
│   │       ├── authRoutes.js
│   │       ├── profileRoutes.js
│   │       ├── groundRoutes.js
│   │       ├── weatherRoutes.js
│   │       └── playRoutes.js
│   └── server.js
│
└── frontend/
    └── src/
        ├── api/axios.js
        ├── context/AuthContext.jsx
        ├── components/
        │   ├── ProtectedRoute.jsx
        │   ├── TimeWheelPicker.jsx
        │   ├── EditPlayModal.jsx
        │   └── GroundWeather.jsx
        └── pages/
            ├── Register.jsx / Login.jsx
            ├── ProfileSetup.jsx
            ├── Home.jsx / Dashboard.jsx
            ├── ConfirmPlay.jsx / ViewPlayers.jsx
            ├── NearbyGrounds.jsx
            └── AddGround.jsx   (admin only)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (LTS)
- PostgreSQL
- A free [WeatherAPI.com](https://www.weatherapi.com/) key
- A [Google Cloud](https://console.cloud.google.com/) project with **Places API** enabled

### 1. Clone
```bash
git clone https://github.com/v-e-n-k-a-t-77/playing-partner.git
cd playing-partner
```

### 2. Backend
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/playerpartner
ACCESS_TOKEN_SECRET=your_random_secret
REFRESH_TOKEN_SECRET=a_different_random_secret
CLIENT_URL=http://localhost:5173
WEATHER_API_KEY=your_weatherapi_key
GOOGLE_PLACES_API_KEY=your_google_places_key
ADMIN_EMAIL=your_admin_account_email@example.com
```

Create the schema (psql or pgAdmin Query Tool):
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  profile_name VARCHAR(150) NOT NULL,
  height_cm DECIMAL(5,2) NOT NULL,
  weight_kg DECIMAL(5,2) NOT NULL,
  bmi DECIMAL(5,2),
  favourite_player VARCHAR(100),
  max_level VARCHAR(50),
  club_name VARCHAR(100),
  position VARCHAR(50) NOT NULL,
  jersey_no INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE grounds (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  lat DECIMAL(9,6) NOT NULL,
  lon DECIMAL(9,6) NOT NULL,
  added_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE play_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  ground_name VARCHAR(150) NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  time_slot VARCHAR(100) NOT NULL,
  end_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

Run it:
```bash
npm run dev
```
Backend → `http://localhost:5000`

### 3. Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Frontend → `http://localhost:5173`

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Backend server port |
| `ACCESS_TOKEN_SECRET` | Signs short-lived JWT access tokens |
| `REFRESH_TOKEN_SECRET` | Signs long-lived JWT refresh tokens |
| `CLIENT_URL` | Frontend origin, used for CORS |
| `WEATHER_API_KEY` | WeatherAPI.com key |
| `GOOGLE_PLACES_API_KEY` | Google Places API key |
| `ADMIN_EMAIL` | Account granted admin privileges |

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in — returns access token, sets refresh cookie |
| POST | `/api/auth/refresh` | Get a new access token |
| POST | `/api/auth/logout` | Invalidate refresh token |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/profile/me` | Get own profile |
| POST | `/api/profile` | Create/update own profile |
| GET | `/api/profile/user/:userId` | View another player's profile |
| GET | `/api/grounds/search?query=` | Search saved grounds → falls back to Google Places |
| POST | `/api/grounds/admin-add` | *(Admin only)* Add a ground |
| GET | `/api/grounds` | List all grounds |
| GET | `/api/weather?lat=&lon=` | Weather for coordinates |
| POST | `/api/plays` | Confirm a play session |
| PUT | `/api/plays/:id` | Edit own play session |
| DELETE | `/api/plays/:id` | Remove own play session |
| GET | `/api/plays` | List own active sessions |
| GET | `/api/plays/by-ground?groundName=` | Active players at a ground today |

All routes except `register` / `login` require `Authorization: Bearer <token>`.

---

## 🎨 Design System

| Token | Value | Use |
|---|---|---|
| Ink Navy | `#0E1116` | Dark panels, jersey circles |
| Charcoal | `#1A1D22` | Primary text, buttons |
| Electric Lime | `#D4FF3F` | Primary accent |
| Signal Coral | `#FF4E32` | Secondary accent, errors |
| Paper | `#FAF8F3` | Page backgrounds |

Fonts: **Bebas Neue** (headings), **Inter** (body).

---

## 📌 Roadmap

- [ ] Player matching / recommendation engine
- [ ] Push notifications before a confirmed play starts
- [ ] Multi-admin support (currently a single hardcoded admin email)
- [ ] Real road-distance sorting on Nearby Grounds
- [ ] In-app chat between players at the same slot

---

## 👤 Author

**v-e-n-k-a-t-77**
[GitHub](https://github.com/v-e-n-k-a-t-77)

---

## 📄 License

Available for educational and portfolio purposes.
