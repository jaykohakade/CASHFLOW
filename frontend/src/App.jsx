import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import Reviews from './components/Reviews';
import InquiryForm from './components/InquiryForm';
import Footer from './components/Footer';

// Dashboard Pages
import Login from './dashboard/Login';
import AdminDashboard from './dashboard/Admindashboard';
import BranchDashboard from './dashboard/Branchdashboard';

import './styles/global.css';

/* ─────────────────────────────────────────────
   Protected Route wrapper
   Redirects to /login if no user / wrong role
───────────────────────────────────────────── */
const ProtectedRoute = ({ user, requiredRole, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== requiredRole) return <Navigate to="/login" replace />;
  return children;
};

/* ─────────────────────────────────────────────
   Login wrapper — needs useNavigate, so it
   must live INSIDE <Router>
───────────────────────────────────────────── */
const LoginWrapper = ({ onLogin }) => {
  const navigate = useNavigate();

  const handleLogin = (role, userData) => {
    onLogin(role, userData);               // update App state
    if (role === 'admin')  navigate('/admin',  { replace: true });
    if (role === 'branch') navigate('/branch', { replace: true });
  };

  return <Login onLogin={handleLogin} />;
};

/* ─────────────────────────────────────────────
   Root App
───────────────────────────────────────────── */
function App() {
  const [user, setUser] = useState(() => {
    // Persist login across page refresh using sessionStorage
    try {
      const saved = sessionStorage.getItem('cashflow_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogin = (role, userData) => {
    const u = { ...userData, role };
    setUser(u);
    sessionStorage.setItem('cashflow_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('cashflow_user');
  };

  return (
    <Router>
      <Routes>

        {/* ── Landing Page ── */}
        <Route
          path="/"
          element={
            <div className="app">
              <Navbar />
              <main>
                <Hero />
                <Services />
                <Reviews />
                <InquiryForm />
              </main>
              <Footer />
            </div>
          }
        />

        {/* ── Login ── */}
        <Route
          path="/login"
          element={
            // If already logged in, skip login and go to dashboard
            user?.role === 'admin'  ? <Navigate to="/admin"  replace /> :
            user?.role === 'branch' ? <Navigate to="/branch" replace /> :
            <LoginWrapper onLogin={handleLogin} />
          }
        />

        {/* ── Admin Dashboard ── */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute user={user} requiredRole="admin">
              <AdminDashboard user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* ── Branch Dashboard ── */}
        <Route
          path="/branch/*"
          element={
            <ProtectedRoute user={user} requiredRole="branch">
              <BranchDashboard user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;