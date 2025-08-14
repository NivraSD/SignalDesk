import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import TestLogin from "./TestLogin";

// Minimal component for dashboard
function Dashboard() {
  const { user, logout } = useAuth();
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>SignalDesk Dashboard</h1>
      <p>Welcome, {user?.email}!</p>
      <button onClick={logout}>Logout</button>
      <div style={{ marginTop: '20px', padding: '20px', background: '#f0f0f0' }}>
        <h2>✅ Supabase Integration Working!</h2>
        <p>Login successful with Supabase authentication.</p>
        <p>User ID: {user?.id}</p>
        <p>Email: {user?.email}</p>
      </div>
    </div>
  );
}

// Private Route component
function PrivateRoute({ children }) {
  const { token, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        Loading...
      </div>
    );
  }

  return token || user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/test" element={<TestLogin />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;