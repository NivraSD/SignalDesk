import React from 'react';
import { useParams } from 'react-router-dom';

const ProjectDashboard = () => {
  const { projectId } = useParams();
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Project Dashboard</h1>
      <p className="mt-4">Project ID: {projectId}</p>
      <p className="mt-2">Dashboard features coming soon...</p>
    </div>
  );
};

export default ProjectDashboard;
