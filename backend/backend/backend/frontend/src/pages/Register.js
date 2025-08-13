// frontend/src/pages/Register.js
import React from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-2 text-gray-600">
            Registration coming soon. For now, please{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-500">
              sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;