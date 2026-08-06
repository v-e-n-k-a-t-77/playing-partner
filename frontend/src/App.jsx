import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ProfileSetup from './pages/ProfileSetup';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import AddGround from './pages/AddGround';
import ConfirmPlay from './pages/ConfirmPlay';
import ViewPlayers from './pages/ViewPlayers';
import NearbyGrounds from './pages/NearbyGrounds';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/profile-setup"
          element={
            <ProtectedRoute>
              <ProfileSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
  path="/add-ground"
  element={
    <ProtectedRoute>
      <AddGround />
    </ProtectedRoute>
  }
/>
<Route
  path="/confirm-play"
  element={
    <ProtectedRoute>
      <ConfirmPlay />
    </ProtectedRoute>
  }
/>
<Route
  path="/view-players"
  element={
    <ProtectedRoute>
      <ViewPlayers />
    </ProtectedRoute>
  }

/>
<Route
  path="/nearby-grounds"
  element={
    <ProtectedRoute>
      <NearbyGrounds />
    </ProtectedRoute>
  }
/>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;