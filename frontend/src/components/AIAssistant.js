import React, { useState } from "react";
import SaveToMemoryVaultButton from "./MemoryVault/SaveToMemoryVaultButton";
import { useProject } from "../contexts/ProjectContext";
import API_BASE_URL from '../config/api';

const AIAssistant = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { activeProject } = useProject();

  const getConversationContent = () => {
    if (messages.length === 0) return "";

    return messages
      .map(
        (msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n\n");
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/assistant/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          message: message,
          projectId: "1",
        }),
      });

      const data = await res.json();

      // Add AI response to chat
      const aiMessage = {
        role: "assistant",
        content: data.response || "No response received",
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error: Failed to get response",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "2rem" }}>AI Assistant</h1>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          height: "500px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "white",
        }}
      >
        {/* Messages area */}
        <div
          style={{
            flex: 1,
            padding: "1rem",
            overflowY: "auto",
            backgroundColor: "#f9f9f9",
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{ textAlign: "center", color: "#666", padding: "2rem" }}
            >
              <p>👋 Hello! I'm your AI assistant.</p>
              <p>
                Ask me anything about PR, content creation, or media strategy!
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "1rem",
                  textAlign: msg.role === "user" ? "right" : "left",
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    padding: "0.75rem 1rem",
                    borderRadius: "12px",
                    maxWidth: "70%",
                    backgroundColor:
                      msg.role === "user" ? "#007bff" : "#e9ecef",
                    color: msg.role === "user" ? "white" : "black",
                    textAlign: "left",
                  }}
                >
                  <strong>{msg.role === "user" ? "You" : "AI"}:</strong>
                  <div style={{ marginTop: "0.25rem", whiteSpace: "pre-wrap" }}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div style={{ textAlign: "center", color: "#666" }}>
              <p>AI is thinking...</p>
            </div>
          )}
        </div>
        {messages.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <SaveToMemoryVaultButton
              content={getConversationContent()}
              title={`AI Conversation - ${new Date().toLocaleDateString()}`}
              type="conversation"
              source="ai-assistant"
              folder_type="research"
              tags={["ai-chat", "conversation"]}
              metadata={{
                messageCount: messages.length,
                projectName: activeProject?.name,
                timestamp: new Date().toISOString(),
              }}
            />
          </div>
        )}
        {/* Input area */}
        <form
          onSubmit={sendMessage}
          style={{
            padding: "1rem",
            borderTop: "1px solid #ddd",
            display: "flex",
            gap: "1rem",
          }}
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask me anything..."
            disabled={loading}
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: "8px",
              border: "1px solid #ddd",
              fontSize: "1rem",
            }}
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            style={{
              padding: "0.75rem 2rem",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              opacity: loading || !message.trim() ? 0.6 : 1,
            }}
          >
            Send
          </button>
        </form>
      </div>

      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <h3>Try asking:</h3>
        <ul>
          <li>Help me write a press release for a product launch</li>
          <li>What are best practices for media pitching?</li>
          <li>Create a crisis communication plan template</li>
          <li>How do I build relationships with journalists?</li>
        </ul>
      </div>
    </div>
  );
};

export default AIAssistant;
