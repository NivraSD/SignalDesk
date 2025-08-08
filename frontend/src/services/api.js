// Complete fixed version of api.js
// File: /frontend/src/services/api.js

import API_BASE_URL from '../config/api';
console.log("API URL:", API_BASE_URL);

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

// Helper function to handle responses
const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    console.error("API Error Details:", data);
    throw new Error(data.error || data.message || "API request failed");
  }

  return data;
};

// Projects API
export const getProjects = async () => {
  console.log("GET request to:", `${API_BASE_URL}/projects`);
  const response = await fetch(`${API_BASE_URL}/projects`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const getProject = async (id) => {
  console.log("GET request to:", `${API_BASE_URL}/projects/${id}`);
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const createProject = async (projectData) => {
  console.log("POST request to:", `${API_BASE_URL}/projects`);
  console.log("Project data:", projectData);

  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(projectData),
  });
  return handleResponse(response);
};

export const updateProject = async (id, projectData) => {
  console.log("PUT request to:", `${API_BASE_URL}/projects/${id}`);
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(projectData),
  });
  return handleResponse(response);
};

export const deleteProject = async (id) => {
  console.log("DELETE request to:", `${API_BASE_URL}/projects/${id}`);
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

// Todo Management
export const getTodos = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/todos`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch todos");
    }
    return data;
  } catch (error) {
    console.error("Get todos error:", error);
    throw error;
  }
};

export const createTodo = async (todoData) => {
  try {
    // Ensure correct field names for database
    const payload = {
      title: todoData.title,
      description: todoData.description || "",
      project_id: todoData.project_id || null,
      priority: todoData.priority || "medium",
      status: todoData.status || "pending",
      due_date: todoData.due_date || null,
    };

    const response = await fetch(`${API_BASE_URL}/todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create todo");
    }
    return data;
  } catch (error) {
    console.error("Create todo error:", error);
    throw error;
  }
};

export const updateTodo = async (todoId, updates) => {
  try {
    const response = await fetch(`${API_BASE_URL}/todos/${todoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update todo");
    }
    return data;
  } catch (error) {
    console.error("Update todo error:", error);
    throw error;
  }
};

export const deleteTodo = async (todoId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/todos/${todoId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete todo");
    }
    return data;
  } catch (error) {
    console.error("Delete todo error:", error);
    throw error;
  }
};

// MemoryVault API
export const getMemoryVaultItems = async (projectId) => {
  const response = await fetch(
    `${API_BASE_URL}/memoryvault/project?projectId=${projectId}`,
    {
      headers: getAuthHeaders(),
    }
  );
  return handleResponse(response);
};

export const saveToMemoryVault = async (projectId, itemData) => {
  const response = await fetch(
    `${API_BASE_URL}/memoryvault/project?projectId=${projectId}`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData),
    }
  );
  return handleResponse(response);
};

// Auth API
export const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
};

export const register = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
};

// AI Assistant API
export const sendAIMessage = async (message, projectId = null) => {
  const response = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ message, projectId }),
  });
  return handleResponse(response);
};

// Content Generator API
export const generateContent = async (contentData) => {
  const response = await fetch(`${API_BASE_URL}/content/generate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(contentData),
  });
  return handleResponse(response);
};

// Media List API
export const searchReporters = async (searchData) => {
  const response = await fetch(`${API_BASE_URL}/media/search-reporters`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(searchData),
  });
  return handleResponse(response);
};

export const getMediaContacts = async (projectId) => {
  const response = await fetch(
    `${API_BASE_URL}/media/contacts?projectId=${projectId}`,
    {
      headers: getAuthHeaders(),
    }
  );
  return handleResponse(response);
};

export const saveMediaContacts = async (contactData) => {
  const response = await fetch(`${API_BASE_URL}/media/contacts`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(contactData),
  });
  return handleResponse(response);
};

export const getMediaLists = async (projectId) => {
  const response = await fetch(
    `${API_BASE_URL}/media/lists?projectId=${projectId}`,
    {
      headers: getAuthHeaders(),
    }
  );
  return handleResponse(response);
};

export const saveMediaList = async (listData) => {
  const response = await fetch(`${API_BASE_URL}/media/lists`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(listData),
  });
  return handleResponse(response);
};

export const updateMediaList = async (listId, listData) => {
  const response = await fetch(`${API_BASE_URL}/media/lists/${listId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(listData),
  });
  return handleResponse(response);
};

export const deleteMediaList = async (listId) => {
  const response = await fetch(`${API_BASE_URL}/media/lists/${listId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const createMediaContact = async (contactData) => {
  const response = await fetch(`${API_BASE_URL}/media-list/contacts`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(contactData),
  });
  return handleResponse(response);
};

// Add these NEW media functions
export const searchMultiSource = async (searchData) => {
  const response = await fetch(`${API_BASE_URL}/media/search-multi-source`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(searchData),
  });
  return handleResponse(response);
};

export const getDatabaseStats = async (projectId) => {
  const response = await fetch(
    `${API_BASE_URL}/media/database-stats?projectId=${projectId}`,
    {
      headers: getAuthHeaders(),
    }
  );
  return handleResponse(response);
};

export const analyzeReporter = async (data) => {
  const response = await fetch(`${API_BASE_URL}/media/analyze-reporter`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const enrichReporter = async (data) => {
  const response = await fetch(`${API_BASE_URL}/media/enrich-reporter`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const bulkImportMedia = async (formData) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/media/bulk-import`, {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: formData,
  });
  return handleResponse(response);
};

export const generatePitch = async (data) => {
  const response = await fetch(`${API_BASE_URL}/media/generate-pitch`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const aiDiscoverReporters = async (data) => {
  const response = await fetch(`${API_BASE_URL}/media/ai-discover-reporters`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

// Campaign Intelligence API
export const getCampaignInsights = async (projectId) => {
  const response = await fetch(
    `${API_BASE_URL}/campaign/insights/${projectId}`,
    {
      headers: getAuthHeaders(),
    }
  );
  return handleResponse(response);
};

// Monitoring API
export const getMonitoringData = async (projectId) => {
  const response = await fetch(
    `${API_BASE_URL}/monitoring/sentiment?projectId=${projectId}`,
    {
      headers: getAuthHeaders(),
    }
  );
  return handleResponse(response);
};

// Save monitoring configuration
export const saveMonitoringConfig = async (config) => {
  const response = await fetch(`${API_BASE_URL}/monitoring/config`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(config),
  });
  return handleResponse(response);
};

// Get monitoring configuration
export const getMonitoringConfig = async () => {
  const response = await fetch(`${API_BASE_URL}/monitoring/config`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

// Analyze sentiment for a single mention
export const analyzeSentiment = async (data) => {
  const response = await fetch(`${API_BASE_URL}/monitoring/analyze-sentiment`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

// Analyze batch of mentions
export const analyzeBatch = async (mentions) => {
  const response = await fetch(`${API_BASE_URL}/monitoring/analyze-batch`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ mentions }),
  });
  return handleResponse(response);
};

// Fetch RSS feeds
export const fetchRSSFeeds = async (keywords) => {
  const response = await fetch(`${API_BASE_URL}/monitoring/fetch-rss`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ keywords }),
  });
  return handleResponse(response);
};

// Crisis API
export const getCrisisPlans = async (projectId) => {
  const response = await fetch(
    `${API_BASE_URL}/crisis/plans?projectId=${projectId}`,
    {
      headers: getAuthHeaders(),
    }
  );
  return handleResponse(response);
};

// Reports API
export const generateReport = async (reportData) => {
  const response = await fetch(`${API_BASE_URL}/reports/generate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(reportData),
  });
  return handleResponse(response);
};

// Crisis Management Methods
export const generateCrisisPlan = async (planData) => {
  const response = await fetch(`${API_BASE_URL}/crisis/generate-plan`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(planData),
  });
  return handleResponse(response);
};

export const getCrisisPlan = async (projectId) => {
  const response = await fetch(`${API_BASE_URL}/crisis/plan/${projectId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const crisisAdvisor = async (data) => {
  const response = await fetch(`${API_BASE_URL}/crisis/advisor`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const draftCrisisResponse = async (data) => {
  const response = await fetch(`${API_BASE_URL}/crisis/draft-response`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const saveCrisisEvent = async (data) => {
  const response = await fetch(`${API_BASE_URL}/crisis/save-event`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

// Content History
export const getContentHistory = async () => {
  const response = await fetch(`${API_BASE_URL}/content/history`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

// Content Templates
export const getContentTemplates = async () => {
  const response = await fetch(`${API_BASE_URL}/content/templates`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

// Save Content
export const saveContent = async (contentData) => {
  const response = await fetch(`${API_BASE_URL}/content/save`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(contentData),
  });
  return handleResponse(response);
};

// AI Content Generation
export const generateAIContent = async (contentData) => {
  const response = await fetch(`${API_BASE_URL}/content/ai-generate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(contentData),
  });
  return handleResponse(response);
};

// Upload Templates
export const uploadTemplates = async (formData) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/content/templates/upload`, {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      // Don't set Content-Type for FormData
    },
    body: formData,
  });
  return handleResponse(response);
};

// Delete Template
export const deleteTemplate = async (templateId) => {
  const response = await fetch(
    `${API_BASE_URL}/content/templates/${templateId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );
  return handleResponse(response);
};

// Export Content
export const exportContent = async (exportData) => {
  const response = await fetch(`${API_BASE_URL}/content/export`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(exportData),
  });
  return handleResponse(response);
};

// Analyze Content
export const analyzeContent = async (analysisData) => {
  const response = await fetch(`${API_BASE_URL}/content/analyze`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(analysisData),
  });
  return handleResponse(response);
};

// Generic HTTP methods
export const get = async (endpoint) => {
  console.log("GET request to:", `${API_BASE_URL}${endpoint}`);
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const post = async (endpoint, data = {}) => {
  console.log("POST request to:", `${API_BASE_URL}${endpoint}`);
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const put = async (endpoint, data = {}) => {
  console.log("PUT request to:", `${API_BASE_URL}${endpoint}`);
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

// Using 'del' instead of 'delete' since delete is a reserved word
export const del = async (endpoint) => {
  console.log("DELETE request to:", `${API_BASE_URL}${endpoint}`);
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export default {
  // Generic HTTP methods
  get,
  post,
  put,
  delete: del, // Map 'delete' to 'del' function
  // Default export with all methods
  // Projects
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,

  // Todos
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,

  // MemoryVault
  getMemoryVaultItems,
  saveToMemoryVault,

  // Auth
  login,
  register,

  // AI
  sendAIMessage,

  // Content
  generateContent,
  generateAIContent,
  getContentHistory,
  saveContent,
  analyzeContent,
  uploadTemplates,
  deleteTemplate,
  exportContent,
  getContentTemplates,

  // Media List
  getMediaContacts,
  createMediaContact,

  // Campaign
  getCampaignInsights,

  // Monitoring
  getMonitoringData,
  saveMonitoringConfig,
  getMonitoringConfig,
  analyzeSentiment,
  analyzeBatch,
  fetchRSSFeeds,

  // Crisis
  getCrisisPlans,
  generateCrisisPlan,
  getCrisisPlan,
  crisisAdvisor,
  draftCrisisResponse,
  saveCrisisEvent,

  // Reports
  generateReport,

  // Media List - UPDATE this section
  getMediaContacts,
  saveMediaContacts,
  getMediaLists,
  saveMediaList,
  updateMediaList,
  deleteMediaList,
  createMediaContact,
  searchReporters,
  searchMultiSource,
  getDatabaseStats,
  analyzeReporter,
  enrichReporter,
  bulkImportMedia,
  generatePitch,
  aiDiscoverReporters,
};
