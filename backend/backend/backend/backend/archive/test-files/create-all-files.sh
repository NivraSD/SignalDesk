#!/bin/bash

# Create directories if they don't exist
mkdir -p src/contexts
mkdir -p src/pages
mkdir -p src/components/common
mkdir -p src/components/AIAssistant
mkdir -p src/services

# Create AuthContext
cat > src/contexts/AuthContext.js << 'EOFILE'
import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    if (email === 'demo@signaldesk.com' && password === 'password') {
      setUser({ id: '1', email: 'demo@signaldesk.com', name: 'Demo User' });
      localStorage.setItem('token', 'demo-token');
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
EOFILE

# Create ProjectContext
cat > src/contexts/ProjectContext.js << 'EOFILE'
import React, { createContext, useState, useContext } from 'react';

const ProjectContext = createContext();

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    setProjects([]);
  };

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      currentProject, 
      loading, 
      fetchProjects,
      setProjects,
      setCurrentProject 
    }}>
      {children}
    </ProjectContext.Provider>
  );
};
EOFILE

# Create PrivateRoute
cat > src/components/common/PrivateRoute.js << 'EOFILE'
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
EOFILE

# Create Navigation
cat > src/components/common/Navigation.js << 'EOFILE'
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navigation = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              SignalDesk
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">{user.email}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
EOFILE

# Create pages
cat > src/pages/Homepage.js << 'EOFILE'
import React from 'react';

const Homepage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Welcome to SignalDesk
      </h1>
      <p className="text-xl text-gray-600">
        Your AI-powered PR command center
      </p>
    </div>
  );
};

export default Homepage;
EOFILE

cat > src/pages/Login.js << 'EOFILE'
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('demo@signaldesk.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <h2 className="text-3xl font-bold text-center">Sign in to SignalDesk</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500">{error}</p>}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="Email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="Password"
          />
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Sign in
          </button>
        </form>
        <p className="text-center text-sm text-gray-600">
          Demo: demo@signaldesk.com / password
        </p>
      </div>
    </div>
  );
};

export default Login;
EOFILE

# Create other pages
for page in Register ProjectLanding ProjectDashboard UserProfile; do
  cat > src/pages/${page}.js << EOFILE
import React from 'react';

const ${page} = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">${page}</h1>
      <p className="mt-4">This page is coming soon...</p>
    </div>
  );
};

export default ${page};
EOFILE
done

# Create other components
cat > src/components/common/QuickActions.js << 'EOFILE'
import React from 'react';

const QuickActions = ({ title, description, icon, action }) => {
  return (
    <button onClick={action} className="p-4 bg-white rounded shadow hover:shadow-lg">
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
};

export default QuickActions;
EOFILE

cat > src/components/common/RecentProjects.js << 'EOFILE'
import React from 'react';

const RecentProjects = () => {
  return (
    <div className="bg-white rounded shadow p-6">
      <p className="text-gray-500">No projects yet</p>
    </div>
  );
};

export default RecentProjects;
EOFILE

cat > src/components/AIAssistant/AIAssistant.js << 'EOFILE'
import React, { useState } from 'react';

const AIAssistant = () => {
  const [input, setInput] = useState('');

  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="font-semibold mb-2">AI Assistant</h3>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask me anything..."
        className="w-full px-3 py-2 border rounded"
      />
    </div>
  );
};

export default AIAssistant;
EOFILE

cat > src/services/api.js << 'EOFILE'
const api = {
  get: () => Promise.resolve({ data: {} }),
  post: () => Promise.resolve({ data: {} })
};

export default api;
EOFILE

echo "All files created successfully!"
