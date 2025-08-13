#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Configuration
const CONFIG = {
  sourceFile: "./frontend/src/components/Monitoring/AISentimentMonitor.js",
  outputDir: "./frontend/src/components/Monitoring",
  backupDir: "./frontend/src/components/Monitoring/backup",
};

// Shared styles based on Crisis Command Center
const SHARED_STYLES = `
export const styles = {
  container: {
    minHeight: "100vh",
    background: "#f3f4f6",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  
  header: {
    background: "white",
    borderBottom: "1px solid #e5e7eb",
    position: "sticky",
    top: 0,
    zIndex: 40,
  },
  
  headerContent: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "1rem 1.5rem",
  },
  
  card: {
    background: "white",
    borderRadius: "0.75rem",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    padding: "1.5rem",
  },
  
  gradientIcon: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    borderRadius: "0.75rem",
    padding: "0.75rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  
  button: {
    primary: {
      padding: "0.625rem 1.25rem",
      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      color: "white",
      border: "none",
      borderRadius: "0.5rem",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      transition: "all 0.2s",
    },
    secondary: {
      padding: "0.625rem 1.25rem",
      background: "white",
      color: "#374151",
      border: "1px solid #d1d5db",
      borderRadius: "0.5rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s",
    },
    danger: {
      padding: "0.625rem 1.25rem",
      background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
      color: "white",
      border: "none",
      borderRadius: "0.5rem",
      fontWeight: "600",
      cursor: "pointer",
    }
  },
  
  statusBadge: {
    active: {
      padding: "0.5rem 1rem",
      background: "rgba(16, 185, 129, 0.1)",
      border: "1px solid rgba(16, 185, 129, 0.3)",
      borderRadius: "0.5rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    inactive: {
      padding: "0.5rem 1rem",
      background: "rgba(107, 114, 128, 0.1)",
      border: "1px solid rgba(107, 114, 128, 0.3)",
      borderRadius: "0.5rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    }
  },
  
  mention: {
    card: {
      border: "1px solid #e5e7eb",
      borderRadius: "0.5rem",
      overflow: "hidden",
      transition: "all 0.2s",
      marginBottom: "1rem",
    },
    header: {
      padding: "1rem",
      borderBottom: "1px solid #e5e7eb",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "start",
    },
    content: {
      padding: "1rem",
    },
    sentiment: {
      positive: {
        background: "#d1fae5",
        color: "#047857",
        padding: "0.25rem 0.75rem",
        borderRadius: "0.375rem",
        fontSize: "0.875rem",
        fontWeight: "500",
      },
      negative: {
        background: "#fee2e2",
        color: "#b91c1c",
        padding: "0.25rem 0.75rem",
        borderRadius: "0.375rem",
        fontSize: "0.875rem",
        fontWeight: "500",
      },
      neutral: {
        background: "#f3f4f6",
        color: "#6b7280",
        padding: "0.25rem 0.75rem",
        borderRadius: "0.375rem",
        fontSize: "0.875rem",
        fontWeight: "500",
      },
      mixed: {
        background: "#e9d5ff",
        color: "#7c3aed",
        padding: "0.25rem 0.75rem",
        borderRadius: "0.375rem",
        fontSize: "0.875rem",
        fontWeight: "500",
      }
    }
  },
  
  grid: {
    main: {
      display: "grid",
      gridTemplateColumns: "280px 1fr",
      gap: "1.5rem",
      maxWidth: "1400px",
      margin: "0 auto",
      padding: "1.5rem",
    },
    metrics: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "1rem",
    }
  },
  
  sidebar: {
    background: "white",
    borderRadius: "0.75rem",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    padding: "1.5rem",
    height: "fit-content",
    position: "sticky",
    top: "100px",
  },
  
  tab: {
    active: {
      padding: "0.75rem 1.5rem",
      background: "#6366f1",
      color: "white",
      border: "none",
      borderRadius: "0.5rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s",
    },
    inactive: {
      padding: "0.75rem 1.5rem",
      background: "white",
      color: "#6b7280",
      border: "1px solid #e5e7eb",
      borderRadius: "0.5rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s",
    }
  }
};
`;

// Create directories
const createDirectories = () => {
  const dirs = [
    CONFIG.outputDir,
    CONFIG.backupDir,
    path.join(CONFIG.outputDir, "styles"),
    path.join(CONFIG.outputDir, "LiveFeed"),
    path.join(CONFIG.outputDir, "Analytics"),
    path.join(CONFIG.outputDir, "Configuration"),
    path.join(CONFIG.outputDir, "AgentDashboard"),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

// Backup original file
const backupOriginal = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(
    CONFIG.backupDir,
    `AISentimentMonitor-${timestamp}.js`
  );

  if (fs.existsSync(CONFIG.sourceFile)) {
    fs.copyFileSync(CONFIG.sourceFile, backupPath);
    console.log(`Backed up original file to: ${backupPath}`);
  }
};

// Write component files
const writeComponentFiles = () => {
  // Write shared styles
  fs.writeFileSync(
    path.join(CONFIG.outputDir, "styles", "monitoring.styles.js"),
    SHARED_STYLES,
    "utf8"
  );
  console.log("Created monitoring.styles.js");

  // Create placeholder components for now
  const components = [
    "MonitoringHeader.js",
    "AgentDashboard.js",
    "LiveFeed/LiveFeed.js",
    "LiveFeed/MentionCard.js",
    "Analytics/MetricsSection.js",
    "Analytics/ChartsSection.js",
    "Configuration/ConfigurationTabs.js",
  ];

  components.forEach((component) => {
    const filePath = path.join(CONFIG.outputDir, component);
    const componentName = path.basename(component, ".js");

    const placeholder = `import React from 'react';
import { styles } from '${
      component.includes("/") ? "../" : "./"
    }styles/monitoring.styles';

const ${componentName} = (props) => {
  return (
    <div style={styles.card}>
      <h2>${componentName} Component</h2>
      <p>This component needs to be implemented.</p>
    </div>
  );
};

export default ${componentName};
`;

    fs.writeFileSync(filePath, placeholder, "utf8");
    console.log(`Created ${component}`);
  });
};

// Run migration
const runMigration = async () => {
  console.log("Starting AISentimentMonitor migration...");

  try {
    createDirectories();
    backupOriginal();
    writeComponentFiles();

    console.log("\n✅ Migration completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Review the generated components in:", CONFIG.outputDir);
    console.log("2. I will now provide the full component implementations");
    console.log("3. Test the refactored component");
    console.log("4. Delete the backup once everything is working");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
};

// Execute
runMigration();
