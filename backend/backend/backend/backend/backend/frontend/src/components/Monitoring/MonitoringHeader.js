import React from "react";
import {
  Bot,
  Shield,
  Activity,
  Settings,
  Power,
  RefreshCw,
  AlertCircle,
  Clock,
  Globe,
  Rss,
  Search,
  Brain,
} from "lucide-react";
import { styles } from "./styles/monitoring.styles";

const MonitoringHeader = ({
  isAgentActive,
  setIsAgentActive,
  isAutoRefresh,
  setIsAutoRefresh,
  lastUpdate,
  fetchMentions,
  loading,
  stats,
  selectedProject,
  dataSourceConfig,
  claudeConfig,
  analyzeAllMentions,
  unanalyzedCount,
}) => {
  const getTimeAgo = (date) => {
    if (!date) return "Never";
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getActiveSourcesCount = () => {
    let count = 0;
    if (dataSourceConfig.sourceType === "demo") count = 1;
    if (dataSourceConfig.sourceType === "aggregator") {
      count = dataSourceConfig.aggregatorConfig?.sourceTypes?.length || 0;
    }
    return count;
  };

  return (
    <div style={styles.header}>
      <div style={styles.headerContent}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={styles.gradientIcon}>
              <Bot style={{ width: "24px", height: "24px", color: "white" }} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  color: "#111827",
                  margin: 0,
                }}
              >
                AI Monitoring Agent
              </h1>
              <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
                {selectedProject
                  ? selectedProject.name
                  : "Your intelligent PR surveillance system powered by Claude AI"}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Status Indicators */}
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                <strong>{getActiveSourcesCount()}</strong> sources •
                <strong> {stats?.totalMentions || 0}</strong> mentions • Last
                scan: <strong>{getTimeAgo(lastUpdate)}</strong>
              </span>
            </div>

            {/* Agent Status */}
            <div
              style={
                isAgentActive
                  ? styles.statusBadge.active
                  : styles.statusBadge.inactive
              }
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  background: isAgentActive ? "#10b981" : "#6b7280",
                  borderRadius: "50%",
                  animation: isAgentActive ? "pulse 2s infinite" : "none",
                }}
              />
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: isAgentActive ? "#10b981" : "#6b7280",
                }}
              >
                {isAgentActive ? "Agent Active" : "Agent Inactive"}
              </span>
            </div>

            {/* Controls */}
            <label
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <input
                type="checkbox"
                checked={isAutoRefresh}
                onChange={(e) => setIsAutoRefresh(e.target.checked)}
                style={{ width: "1rem", height: "1rem" }}
              />
              <span style={{ fontSize: "0.875rem", color: "#374151" }}>
                Auto-refresh
              </span>
            </label>

            {unanalyzedCount > 0 && (
              <button
                onClick={analyzeAllMentions}
                style={{
                  ...styles.button.primary,
                  background:
                    "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
                }}
              >
                <Brain style={{ width: "16px", height: "16px" }} />
                Analyze All ({unanalyzedCount})
              </button>
            )}

            <button
              onClick={fetchMentions}
              disabled={loading}
              style={{
                ...styles.button.primary,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              <RefreshCw
                style={{
                  width: "16px",
                  height: "16px",
                  animation: loading ? "spin 1s linear infinite" : "none",
                }}
              />
              {loading ? "Fetching..." : "Fetch Mentions"}
            </button>

            <button
              onClick={() => setIsAgentActive(!isAgentActive)}
              style={
                isAgentActive ? styles.button.secondary : styles.button.primary
              }
            >
              <Power style={{ width: "16px", height: "16px" }} />
              {isAgentActive ? "Deactivate" : "Activate"} Agent
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1rem",
            marginTop: "1rem",
            padding: "1rem",
            background: "#f9fafb",
            borderRadius: "0.5rem",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: "#6366f1",
                margin: 0,
              }}
            >
              {stats?.analyzedCount || 0}
            </p>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>
              Analyzed
            </p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: "#10b981",
                margin: 0,
              }}
            >
              {stats?.positiveMentions || 0}
            </p>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>
              Positive
            </p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: "#dc2626",
                margin: 0,
              }}
            >
              {stats?.negativeMentions || 0}
            </p>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>
              Negative
            </p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: "#6b7280",
                margin: 0,
              }}
            >
              {stats?.avgSentimentScore || 0}
            </p>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>
              Avg Score
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringHeader;
