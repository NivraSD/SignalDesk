import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = () => {
  const { user } = useAuth();
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">User Profile</h1>
      <p className="mt-4">Email: {user?.email}</p>
      <p className="mt-2">Profile management coming soon...</p>
    </div>
  );
};

export default UserProfile;
