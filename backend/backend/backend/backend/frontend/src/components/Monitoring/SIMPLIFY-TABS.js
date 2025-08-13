// SIMPLIFY TABS IN EXISTING COMPONENT
// This script modifies the existing AISentimentMonitor to consolidate tabs

// 1. Find and replace the tabs array around line 2576:
/*
REPLACE THIS:
  const tabs = [
    { id: "monitor", label: "Live Feed", icon: Activity },
    { id: "agent", label: "Agent Config", icon: Bot, pulse: true },
    { id: "metrics", label: "Analytics", icon: BarChart3 },
    {
      id: "alerts",
      label: "Alerts",
      icon: Bell,
      badge: alerts.filter((a) => !a.acknowledged).length,
    },
    { id: "claude", label: "AI Config", icon: Brain },
  ];

WITH THIS:
  const tabs = [
    { id: "setup", label: "Setup & Configuration", icon: Settings },
    { id: "monitor", label: "Monitor & Analysis", icon: Activity },
    { id: "metrics", label: "Analytics", icon: BarChart3 },
    {
      id: "alerts",
      label: "Alerts",
      icon: Bell,
      badge: alerts.filter((a) => !a.acknowledged).length,
    },
  ];
*/

// 2. Add a new state for agent instructions around line 140:
/*
ADD THIS:
  const [agentInstructions, setAgentInstructions] = useState(`Monitor news and mentions about our company and competitors.

What to look for:
- Any mentions of our brand or products
- Customer complaints or praise  
- Security issues or data breaches
- Competitor announcements
- Market trends affecting our industry

How to analyze:
- Flag any security or legal issues as critical
- Identify opportunities for engagement
- Assess sentiment based on overall tone
- Consider the source credibility
- Look for emerging patterns`);
*/

// 3. Create a new combined Setup tab content:
/*
ADD THIS NEW TAB CONTENT:
        {activeTab === "setup" && (
          <div style={{ ...styles.card, marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "3rem", height: "3rem", background: "linear-gradient(to bottom right, #1e40af, #7c3aed)", borderRadius: "0.75rem" }}>
                <Settings style={{ width: "1.5rem", height: "1.5rem", color: "white" }} />
              </div>
              <div>
                <h2 style={styles.text.heading}>Setup & Configuration</h2>
                <p style={styles.text.body}>Configure monitoring sources, keywords, and AI agent behavior</p>
              </div>
            </div>

            {/* Data Sources Section */}
            <div style={{ marginBottom: "2rem", padding: "1.5rem", background: "#f9fafb", borderRadius: "0.5rem" }}>
              <h3 style={{ ...styles.text.subheading, marginBottom: "1rem" }}>
                <Rss style={{ width: "1.25rem", height: "1.25rem", display: "inline", marginRight: "0.5rem", color: "#2563eb" }} />
                Data Sources
              </h3>
              
              {/* Source Type Selection */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Source Type
                </label>
                <select
                  value={dataSourceConfig.sourceType}
                  onChange={(e) => handleDataSourceChange("sourceType", e.target.value)}
                  style={styles.input}
                >
                  <option value="demo">Demo Data</option>
                  <option value="aggregator">RSS Feeds</option>
                  <option value="api">API Integration</option>
                </select>
              </div>

              {/* RSS Categories (if RSS selected) */}
              {dataSourceConfig.sourceType === "aggregator" && (
                <div>
                  <p style={{ ...styles.text.body, marginBottom: "1rem" }}>
                    Select feed categories to monitor:
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
                    {Object.entries(dataSourceConfig.aggregatorConfig.feedCategories).map(([category, enabled]) => (
                      <label key={category} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => handleFeedCategoryChange(category, e.target.checked)}
                          style={{ width: "1rem", height: "1rem" }}
                        />
                        <span style={{ fontSize: "0.875rem", textTransform: "capitalize" }}>
                          {category.replace(/_/g, " ")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Keywords Section */}
            <div style={{ marginBottom: "2rem", padding: "1.5rem", background: "#f9fafb", borderRadius: "0.5rem" }}>
              <h3 style={{ ...styles.text.subheading, marginBottom: "1rem" }}>
                <Hash style={{ width: "1.25rem", height: "1.25rem", display: "inline", marginRight: "0.5rem", color: "#2563eb" }} />
                Monitoring Keywords
              </h3>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddKeyword()}
                  placeholder="Enter keyword to monitor"
                  style={{ ...styles.input, flex: 1 }}
                />
                <button onClick={handleAddKeyword} style={styles.button.primary}>
                  <Plus style={{ width: "1rem", height: "1rem" }} />
                  Add
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {keywords.map((keyword, index) => (
                  <span key={index} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0.75rem", background: "#e0e7ff", color: "#4338ca", borderRadius: "9999px", fontSize: "0.875rem" }}>
                    {keyword}
                    <button onClick={() => handleRemoveKeyword(index)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      <X style={{ width: "0.875rem", height: "0.875rem" }} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* AI Agent Instructions */}
            <div style={{ marginBottom: "2rem", padding: "1.5rem", background: "#f9fafb", borderRadius: "0.5rem" }}>
              <h3 style={{ ...styles.text.subheading, marginBottom: "1rem" }}>
                <Brain style={{ width: "1.25rem", height: "1.25rem", display: "inline", marginRight: "0.5rem", color: "#7c3aed" }} />
                AI Agent Instructions
              </h3>
              <p style={{ ...styles.text.body, marginBottom: "1rem" }}>
                Provide natural language instructions for how the AI should analyze mentions:
              </p>
              <textarea
                value={agentInstructions}
                onChange={(e) => setAgentInstructions(e.target.value)}
                style={{ ...styles.input, minHeight: "200px", fontFamily: "monospace", fontSize: "0.875rem" }}
                placeholder="Describe what to monitor and how to analyze..."
              />
              
              {/* Quick Templates */}
              <div style={{ marginTop: "1rem" }}>
                <p style={{ fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>Quick Templates:</p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button
                    onClick={() => setAgentInstructions(`Focus on security and compliance issues.
Look for: data breaches, security vulnerabilities, regulatory violations, compliance issues.
Flag as critical: any security incidents, legal issues, or regulatory actions.
Analyze competitor security incidents for industry trends.`)}
                    style={{ ...styles.button.secondary, fontSize: "0.75rem" }}
                  >
                    Security Focus
                  </button>
                  <button
                    onClick={() => setAgentInstructions(`Monitor brand sentiment and customer feedback.
Look for: customer complaints, product reviews, brand mentions, social sentiment.
Identify: trending complaints, praise patterns, customer pain points.
Track competitor customer sentiment for comparison.`)}
                    style={{ ...styles.button.secondary, fontSize: "0.75rem" }}
                  >
                    Brand Sentiment
                  </button>
                  <button
                    onClick={() => setAgentInstructions(`Track market and competitive intelligence.
Look for: competitor announcements, market trends, industry news, strategic moves.
Analyze: market share changes, new product launches, partnerships, acquisitions.
Identify opportunities and threats to our business.`)}
                    style={{ ...styles.button.secondary, fontSize: "0.75rem" }}
                  >
                    Competitive Intel
                  </button>
                </div>
              </div>
            </div>

            {/* Sentiment Context (simplified) */}
            <div style={{ marginBottom: "2rem", padding: "1.5rem", background: "#f9fafb", borderRadius: "0.5rem" }}>
              <h3 style={{ ...styles.text.subheading, marginBottom: "1rem" }}>
                <Target style={{ width: "1.25rem", height: "1.25rem", display: "inline", marginRight: "0.5rem", color: "#dc2626" }} />
                Sentiment Guidelines
              </h3>
              <div style={{ display: "grid", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.25rem", color: "#059669" }}>
                    Positive Indicators
                  </label>
                  <input
                    type="text"
                    value={claudeConfig.sentimentContext?.positiveScenarios || ""}
                    onChange={(e) => setClaudeConfig(prev => ({
                      ...prev,
                      sentimentContext: { ...prev.sentimentContext, positiveScenarios: e.target.value }
                    }))}
                    placeholder="growth, innovation, customer satisfaction, awards"
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.25rem", color: "#dc2626" }}>
                    Negative Indicators
                  </label>
                  <input
                    type="text"
                    value={claudeConfig.sentimentContext?.negativeScenarios || ""}
                    onChange={(e) => setClaudeConfig(prev => ({
                      ...prev,
                      sentimentContext: { ...prev.sentimentContext, negativeScenarios: e.target.value }
                    }))}
                    placeholder="issues, complaints, lawsuits, breaches"
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={async () => {
                  await saveDataSourceConfig();
                  await saveClaudeConfig();
                  // Save agent instructions
                  localStorage.setItem('agentInstructions', agentInstructions);
                  alert('Configuration saved successfully!');
                }}
                style={styles.button.primary}
              >
                Save All Configuration
              </button>
            </div>
          </div>
        )}
*/

// 4. Update the tab navigation buttons to use the new simplified tabs
// 5. Remove the old individual tab contents for sources, agent, and claude tabs