import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const ProjectContext = createContext();

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within ProjectProvider");
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [activeProject, setActiveProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monitoringCache, setMonitoringCache] = useState({});

  useEffect(() => {
    // Load projects on mount
    fetchProjects();
  }, []);

  useEffect(() => {
    // Restore active project when projects are loaded
    const savedProjectId = localStorage.getItem("activeProjectId");
    if (savedProjectId && projects.length > 0) {
      const project = projects.find((p) => p.id === parseInt(savedProjectId));
      if (project) {
        setActiveProject(project);
      }
    }
  }, [projects]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const data = await api.getProjects();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectProject = (project) => {
    setActiveProject(project);
    if (project) {
      localStorage.setItem("activeProjectId", project.id);
    } else {
      localStorage.removeItem("activeProjectId");
    }
  };

  const createProject = async (projectData) => {
    try {
      const data = await api.createProject(projectData);
      if (data.success) {
        await fetchProjects();
        return data.project;
      }
      throw new Error(data.message);
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  };

  // Monitoring cache functions
  const setMonitoringData = (projectId, data) => {
    setMonitoringCache(prev => ({
      ...prev,
      [projectId]: {
        ...data,
        lastUpdated: new Date().toISOString()
      }
    }));
  };

  const getMonitoringData = (projectId) => {
    return monitoringCache[projectId] || null;
  };

  const clearMonitoringCache = (projectId) => {
    if (projectId) {
      setMonitoringCache(prev => {
        const newCache = { ...prev };
        delete newCache[projectId];
        return newCache;
      });
    } else {
      setMonitoringCache({});
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        activeProject,
        projects,
        loading,
        selectProject,
        fetchProjects,
        createProject,
        monitoringCache,
        setMonitoringData,
        getMonitoringData,
        clearMonitoringCache,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
