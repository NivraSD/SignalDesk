#!/bin/bash

# Add basic AuthContext
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
  const [user, setUser] = useState({ id: '1', email: 'demo@signaldesk.com', name: 'Demo User' });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    if (email === 'demo@signaldesk.com' && password === 'password') {
      setUser({ id: '1', email: 'demo@signaldesk.com', name: 'Demo User' });
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
EOFILE

# Add basic ProjectContext
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
    <ProjectContext.Provider value={{ projects, currentProject, loading, fetchProjects }}>
      {children}
    </ProjectContext.Provider>
  );
};
EOFILE

# Add basic API service
cat > src/services/api.js << 'EOFILE'
const api = {
  get: () => Promise.resolve({ data: {} }),
  post: () => Promise.resolve({ data: {} })
};

export default api;
EOFILE

# Add basic components
echo "import React from 'react';" > src/components/common/PrivateRoute.js
echo "const PrivateRoute = ({ children }) => children;" >> src/components/common/PrivateRoute.js
echo "export default PrivateRoute;" >> src/components/common/PrivateRoute.js

echo "import React from 'react';" > src/components/common/Navigation.js
echo "const Navigation = () => <nav>SignalDesk</nav>;" >> src/components/common/Navigation.js
echo "export default Navigation;" >> src/components/common/Navigation.js

echo "import React from 'react';" > src/components/common/QuickActions.js
echo "const QuickActions = (props) => <div>Quick Action</div>;" >> src/components/common/QuickActions.js
echo "export default QuickActions;" >> src/components/common/QuickActions.js

echo "import React from 'react';" > src/components/common/RecentProjects.js
echo "const RecentProjects = () => <div>Recent Projects</div>;" >> src/components/common/RecentProjects.js
echo "export default RecentProjects;" >> src/components/common/RecentProjects.js

echo "import React from 'react';" > src/components/AIAssistant/AIAssistant.js
echo "const AIAssistant = () => <div>AI Assistant</div>;" >> src/components/AIAssistant/AIAssistant.js
echo "export default AIAssistant;" >> src/components/AIAssistant/AIAssistant.js

# Add pages
for page in Homepage Login Register ProjectLanding ProjectDashboard UserProfile; do
  echo "import React from 'react';" > src/pages/${page}.js
  echo "const ${page} = () => <div>${page} Page</div>;" >> src/pages/${page}.js
  echo "export default ${page};" >> src/pages/${page}.js
done

echo "Basic files created! Your app should now start."
