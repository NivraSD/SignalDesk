import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useProject } from "../contexts/ProjectContext";
import * as api from "../services/api";
import "./ProjectList.css";
import {
  FolderPlus,
  Folder,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Calendar,
  Tag,
  CheckSquare,
  Square,
  Plus,
  X,
} from "lucide-react";

const ProjectList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, selectProject, fetchProjects } = useProject();
  const [expandedProjects, setExpandedProjects] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [todoFormData, setTodoFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
  });
  const [formData, setFormData] = useState({
    name: "",
    campaign: "",
    industry: "",
    description: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await fetchProjects();
      await fetchTodos();
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodos = async () => {
    try {
      const response = await api.getTodos();
      if (response.success) {
        setTodos(response.todos);
      }
    } catch (error) {
      console.error("Error fetching todos:", error);
    }
  };

  const handleProjectClick = (project) => {
    selectProject(project);
    navigate(`/projects/${project.id}`);
  };

  const toggleProjectExpand = (projectId, e) => {
    e.stopPropagation();
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await api.createProject(formData);
      if (response.success) {
        await fetchProjects();
        setShowCreateForm(false);
        setFormData({
          name: "",
          campaign: "",
          industry: "",
          description: "",
        });
        handleProjectClick(response.project);
      }
    } catch (error) {
      console.error("Error creating project:", error);
      alert(`Failed to create project: ${error.message}`);
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await api.updateProject(editingProject.id, formData);
      if (response.success) {
        await fetchProjects();
        setEditingProject(null);
        setFormData({
          name: "",
          campaign: "",
          industry: "",
          description: "",
        });
      }
    } catch (error) {
      console.error("Error updating project:", error);
      alert(`Failed to update project: ${error.message}`);
    }
  };

  const handleDeleteProject = async (projectId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await api.deleteProject(projectId);
        await fetchProjects();
      } catch (error) {
        console.error("Error deleting project:", error);
        alert(`Failed to delete project: ${error.message}`);
      }
    }
  };

  // Open todo modal
  const openTodoModal = () => {
    setShowTodoModal(true);
    setTodoFormData({
      title: "",
      description: "",
      priority: "medium",
    });
  };

  // Handle todo form submission
  const handleCreateTodo = async (e) => {
    e.preventDefault();

    if (!todoFormData.title.trim()) {
      alert("Please enter a todo title");
      return;
    }

    try {
      const todoData = {
        title: todoFormData.title.trim(),
        description: todoFormData.description.trim(),
        project_id: selectedProjectId || null,
        priority: todoFormData.priority,
        status: "pending",
      };

      const response = await api.createTodo(todoData);

      if (response.success) {
        await fetchTodos();
        setShowTodoModal(false);
        setTodoFormData({
          title: "",
          description: "",
          priority: "medium",
        });
      } else {
        throw new Error(response.message || "Failed to create todo");
      }
    } catch (error) {
      console.error("Error creating todo:", error);
      alert(`Failed to create todo: ${error.message}`);
    }
  };

  const handleToggleTodo = async (todoId, currentStatus) => {
    try {
      const newStatus = currentStatus === "completed" ? "pending" : "completed";
      const response = await api.updateTodo(todoId, { status: newStatus });

      if (response.success) {
        await fetchTodos();
      }
    } catch (error) {
      console.error("Error updating todo:", error);
    }
  };

  const handleDeleteTodo = async (todoId) => {
    try {
      const response = await api.deleteTodo(todoId);
      if (response.success) {
        await fetchTodos();
      }
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  const startEdit = (project, e) => {
    e.stopPropagation();
    setEditingProject(project);
    setFormData({
      name: project.name,
      campaign: project.campaign_name || "",
      industry: project.industry || "",
      description: project.description || "",
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <div className="projects-container">
        {/* Projects Section */}
        <div className="projects-section">
          <div className="projects-header">
            <h1 className="projects-title">My Projects</h1>
            <button
              onClick={() => setShowCreateForm(true)}
              className="create-project-btn"
            >
              <FolderPlus size={16} />
              <span>New Project</span>
            </button>
          </div>

          <div className="projects-list">
            {projects.length === 0 ? (
              <div className="empty-state">
                <FolderPlus size={48} />
                <p>No projects yet. Create your first project!</p>
              </div>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="project-card"
                  onClick={() => handleProjectClick(project)}
                >
                  <div className="project-card-header">
                    <div className="project-info">
                      <button
                        onClick={(e) => toggleProjectExpand(project.id, e)}
                        className="icon-button"
                      >
                        {expandedProjects[project.id] ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>
                      <Folder size={18} color="#8b5cf6" />
                      <h3 className="project-name">{project.name}</h3>
                    </div>
                    <div className="project-actions">
                      <button
                        onClick={(e) => startEdit(project, e)}
                        className="icon-button"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteProject(project.id, e)}
                        className="icon-button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {expandedProjects[project.id] && (
                    <div className="project-details">
                      {project.campaign_name && (
                        <div className="project-detail-item">
                          <Tag size={14} />
                          <span>Campaign: {project.campaign_name}</span>
                        </div>
                      )}
                      {project.industry && (
                        <div className="project-detail-item">
                          <Tag size={14} />
                          <span>Industry: {project.industry}</span>
                        </div>
                      )}
                      <div className="project-detail-item">
                        <Calendar size={14} />
                        <span>
                          Created:{" "}
                          {new Date(project.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {project.description && (
                        <p className="project-description">
                          {project.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Todo Section */}
        <div className="todo-section">
          <h2 className="todo-title">To-Do List</h2>

          {/* Todo Header with Project Select and Add Button */}
          <div className="todo-header">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="project-select"
            >
              <option value="">No Project Selected</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={openTodoModal}
              className="add-todo-btn"
              title="Add new todo"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Todo List */}
          <div className="todo-list">
            {todos.length === 0 ? (
              <div className="empty-todos">
                <CheckSquare size={32} />
                <p>No tasks yet. Click + to add your first to-do!</p>
              </div>
            ) : (
              todos.map((todo) => (
                <div key={todo.id} className="todo-item">
                  <button
                    onClick={() => handleToggleTodo(todo.id, todo.status)}
                    className="check-button"
                  >
                    {todo.status === "completed" ? (
                      <CheckSquare size={18} color="#28a745" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                  <div className="todo-content">
                    <span
                      className={`todo-text ${
                        todo.status === "completed" ? "completed-todo" : ""
                      }`}
                    >
                      {todo.title}
                    </span>
                    {todo.description && (
                      <p className="todo-description">{todo.description}</p>
                    )}
                    {todo.project_name && (
                      <span className="project-tag">{todo.project_name}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="delete-todo-btn"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Project Create/Edit Modal */}
      {(showCreateForm || editingProject) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">
              {editingProject ? "Edit Project" : "Create New Project"}
            </h2>
            <form
              onSubmit={
                editingProject ? handleUpdateProject : handleCreateProject
              }
            >
              <input
                type="text"
                placeholder="Project Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="form-input"
                required
              />
              <input
                type="text"
                placeholder="Campaign Name"
                value={formData.campaign}
                onChange={(e) =>
                  setFormData({ ...formData, campaign: e.target.value })
                }
                className="form-input"
              />
              <input
                type="text"
                placeholder="Industry"
                value={formData.industry}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
                className="form-input"
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="form-textarea"
              />
              <div className="modal-buttons">
                <button type="submit" className="submit-button">
                  {editingProject ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingProject(null);
                    setFormData({
                      name: "",
                      campaign: "",
                      industry: "",
                      description: "",
                    });
                  }}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Todo Create Modal */}
      {showTodoModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Create New Todo</h2>
            <form onSubmit={handleCreateTodo}>
              <input
                type="text"
                placeholder="Todo Title"
                value={todoFormData.title}
                onChange={(e) =>
                  setTodoFormData({ ...todoFormData, title: e.target.value })
                }
                className="form-input"
                required
                autoFocus
              />
              <textarea
                placeholder="Description (optional)"
                value={todoFormData.description}
                onChange={(e) =>
                  setTodoFormData({
                    ...todoFormData,
                    description: e.target.value,
                  })
                }
                className="form-textarea"
                rows="3"
              />
              <select
                value={todoFormData.priority}
                onChange={(e) =>
                  setTodoFormData({ ...todoFormData, priority: e.target.value })
                }
                className="form-input"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <div className="modal-buttons">
                <button type="submit" className="submit-button">
                  Create Todo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTodoModal(false);
                    setTodoFormData({
                      title: "",
                      description: "",
                      priority: "medium",
                    });
                  }}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
