cat > src/App.js << 'EOF'
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';

// Pages
import Homepage from './pages/Homepage';
import ProjectLanding from './pages/ProjectLanding';
import ProjectDashboard from './pages/ProjectDashboard';
import UserProfile from './pages/UserProfile';
import Login from './pages/Login';
import Register from './pages/Register';

// Components
import PrivateRoute from './components/common/PrivateRoute';
import Navigation from './components/common/Navigation';

function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <PrivateRoute>
                  <Homepage />
                </PrivateRoute>
              } />
              
              <Route path="/projects" element={
                <PrivateRoute>
                  <ProjectLanding />
                </PrivateRoute>
              } />
              
              <Route path="/project/:projectId" element={
                <PrivateRoute>
                  <ProjectDashboard />
                </PrivateRoute>
              } />
              
              <Route path="/profile" element={
                <PrivateRoute>
                  <UserProfile />
                </PrivateRoute>
              } />
              
              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App;
EOF
