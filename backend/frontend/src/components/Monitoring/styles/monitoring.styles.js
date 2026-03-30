
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
  },
  
  // Additional utility styles
  wrapper: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 1.5rem",
  },
  
  flexContainer: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  
  gridContainer: {
    display: "grid",
    gap: "1rem",
  },
  
  text: {
    heading: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      color: "#1f2937",
      margin: 0,
    },
    subheading: {
      fontSize: "1.125rem",
      fontWeight: "600",
      color: "#374151",
    },
    body: {
      fontSize: "0.875rem",
      color: "#6b7280",
    },
    small: {
      fontSize: "0.75rem",
      color: "#9ca3af",
    }
  },
  
  quickStartGuide: {
    background: "#dcfce7",
    border: "1px solid #bbf7d0",
    borderRadius: "0.75rem",
    padding: "1rem",
    marginBottom: "1rem",
  },
  
  tabContainer: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1.5rem",
    overflowX: "auto",
  },
  
  alert: {
    info: {
      background: "#dbeafe",
      border: "1px solid #93c5fd",
      color: "#1e40af",
    },
    warning: {
      background: "#fef3c7",
      border: "1px solid #fde68a",
      color: "#92400e",
    },
    error: {
      background: "#fee2e2",
      border: "1px solid #fecaca",
      color: "#991b1b",
    },
    success: {
      background: "#dcfce7",
      border: "1px solid #bbf7d0",
      color: "#166534",
    }
  },
  
  emptyState: {
    textAlign: "center",
    padding: "3rem",
    color: "#6b7280",
  },
  
  progressBar: {
    container: {
      width: "100%",
      height: "0.5rem",
      background: "#e5e7eb",
      borderRadius: "0.25rem",
      overflow: "hidden",
    },
    fill: {
      height: "100%",
      background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)",
      transition: "width 0.3s ease",
    }
  }
};
