import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FolderOpen, Bot, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Navigation = () => {
  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    // Instead of using navigate, we'll use window.location
    window.location.href = '/login';
  };
  
  const navItems = [
    { path: '/', name: 'Dashboard', icon: Home },
    { path: '/projects', name: 'Projects', icon: FolderOpen },
    { path: '/ai-assistant', name: 'AI Assistant', icon: Bot },
  ];
  
  return (
    <nav className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-blue-600">SignalDesk</h1>
        <p className="text-sm text-gray-600 mt-1">AI-Powered PR Platform</p>
      </div>
      
      <div className="flex-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;