import React from 'react';

const QuickActions = ({ title, description, icon, action }) => {
  return (
    <button
      onClick={action}
      className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 text-left group"
    >
      <div className="flex items-start space-x-4">
        <div className="text-4xl group-hover:scale-110 transition-transform duration-200">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {title}
          </h3>
          <p className="text-sm text-gray-600">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
};

export default QuickActions;
