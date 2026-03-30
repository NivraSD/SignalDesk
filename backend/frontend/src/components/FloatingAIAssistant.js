import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useProject } from "../contexts/ProjectContext";
import { useMemoryVault } from "../hooks/useMemoryVault";
import API_BASE_URL from '../config/api';
import {
  Bot,
  X,
  Send,
  Minimize2,
  Maximize2,
  Sparkles,
  Search,
  Edit3,
  Brain,
  MessageSquare,
  ChevronDown,
  Copy,
  Save,
  Loader,
  AlertCircle,
} from "lucide-react";

const FloatingAIAssistant = () => {
  const location = useLocation();
  const { activeProject } = useProject();
  const { saveToMemoryVault } = useMemoryVault();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState("chat"); // chat, research, write, edit, brainstorm
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Listen for global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setIsMinimized(false);
      }
      if (e.key === "Escape" && isOpen) {
        setIsMinimized(true);
      }
    };

    const handleOpenAssistant = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("openAIAssistant", handleOpenAssistant);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("openAIAssistant", handleOpenAssistant);
    };
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      // Make API call to your backend
      const response = await fetch(`${API_BASE_URL}/ai/assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          message: message,
          mode: mode,
          projectId: activeProject?.id,
          conversationHistory: messages,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          type: "assistant",
          content: data.response,
          timestamp: new Date().toISOString(),
          canSave: mode !== "chat", // Can save if not in chat mode
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.message || "Failed to get response");
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = {
        id: Date.now() + 1,
        type: "error",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveContent = async (messageContent) => {
    if (!activeProject) {
      alert("Please select a project first");
      return;
    }

    try {
      await saveToMemoryVault({
        content: messageContent,
        title: `AI Generated Content - ${new Date().toLocaleDateString()}`,
        type: mode,
        source: "ai-assistant",
      });
      alert("Content saved to MemoryVault!");
    } catch (error) {
      alert("Failed to save content");
    }
  };

  const modeConfig = {
    chat: { icon: MessageSquare, label: "Chat", color: "blue" },
    research: { icon: Search, label: "Research", color: "purple" },
    write: { icon: Edit3, label: "Write", color: "green" },
    edit: { icon: Edit3, label: "Edit", color: "orange" },
    brainstorm: { icon: Brain, label: "Brainstorm", color: "pink" },
  };

  // Don't render on homepage or login - AFTER all hooks
  const isHomepage =
    location.pathname === "/" ||
    location.pathname === "" ||
    location.pathname === "/home";
  const isLogin = location.pathname === "/login";

  if (isHomepage || isLogin) {
    return null;
  }

  // FIXED: Lower z-index values to prevent blocking other UI elements
  const floatingButtonStyle = {
    position: "fixed",
    right: "24px",
    bottom: "24px",
    backgroundColor: "#3b82f6",
    background: "linear-gradient(to right, #3b82f6, #9333ea)",
    color: "white",
    borderRadius: "50%",
    padding: "16px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    cursor: "pointer",
    border: "none",
    zIndex: 50, // Reduced from 1000
    transition: "all 0.3s",
  };

  const panelStyle = {
    position: "fixed",
    right: "24px",
    bottom: "24px",
    width: isExpanded ? "600px" : "400px",
    height: isMinimized ? "56px" : isExpanded ? "calc(100vh - 48px)" : "600px",
    maxHeight: isExpanded ? "none" : "80vh",
    zIndex: 60, // Reduced from 1001
    transition: "all 0.3s",
  };

  if (isExpanded) {
    panelStyle.top = "24px";
    panelStyle.bottom = "24px";
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={floatingButtonStyle}
          className="hover:scale-110 hover:shadow-xl"
          title="AI Assistant (Ctrl+K)"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow =
              "0 20px 25px -5px rgba(0, 0, 0, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow =
              "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
          }}
        >
          <Bot className="w-6 h-6" />
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              width: "12px",
              height: "12px",
              backgroundColor: "#10b981",
              borderRadius: "50%",
              animation: "pulse 2s infinite",
            }}
          ></span>
        </button>
      )}

      {/* AI Assistant Panel */}
      {isOpen && (
        <div style={panelStyle}>
          <div className="bg-white rounded-xl shadow-2xl h-full flex flex-col border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bot className="w-5 h-5" />
                <div>
                  <h3 className="font-semibold">AI Assistant</h3>
                  {!isMinimized && activeProject && (
                    <p className="text-xs opacity-90">
                      Project: {activeProject.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isMinimized && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    title={isExpanded ? "Collapse" : "Expand"}
                  >
                    {isExpanded ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  title={isMinimized ? "Expand" : "Minimize"}
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isMinimized ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsMinimized(false);
                    setIsExpanded(false);
                  }}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            {!isMinimized && (
              <>
                {/* Mode Selector */}
                <div className="border-b border-gray-200 px-4 py-2">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {Object.entries(modeConfig).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setMode(key)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                          mode === key
                            ? `bg-${config.color}-100 text-${config.color}-700`
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <config.icon className="w-4 h-4" />
                        {config.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        How can I help you today?
                      </h4>
                      <p className="text-sm text-gray-600 max-w-xs mx-auto">
                        I can help you research topics, write content, edit
                        text, or brainstorm ideas for your PR campaigns.
                      </p>
                    </div>
                  )}

                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.type === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] ${
                          msg.type === "user"
                            ? "bg-blue-600 text-white"
                            : msg.type === "error"
                            ? "bg-red-50 text-red-900 border border-red-200"
                            : "bg-gray-100 text-gray-900"
                        } rounded-lg px-4 py-3`}
                      >
                        {msg.type === "error" && (
                          <AlertCircle className="w-4 h-4 inline mr-2" />
                        )}
                        <p className="text-sm whitespace-pre-wrap">
                          {msg.content}
                        </p>
                        {msg.type === "assistant" && msg.canSave && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                            <button
                              onClick={() =>
                                navigator.clipboard.writeText(msg.content)
                              }
                              className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              Copy
                            </button>
                            <button
                              onClick={() => handleSaveContent(msg.content)}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" />
                              Save to MemoryVault
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-4 py-3 flex items-center gap-2">
                        <Loader className="w-4 h-4 animate-spin text-gray-600" />
                        <span className="text-sm text-gray-600">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 p-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-end gap-2"
                  >
                    <textarea
                      ref={inputRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={`${
                        mode === "chat"
                          ? "Ask me anything..."
                          : mode === "research"
                          ? "What would you like to research?"
                          : mode === "write"
                          ? "What would you like me to write?"
                          : mode === "edit"
                          ? "Paste text to edit..."
                          : "What ideas would you like to explore?"
                      }`}
                      className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px] max-h-[120px]"
                      rows="1"
                    />
                    <button
                      type="submit"
                      disabled={!message.trim() || isLoading}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2.5 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                  <p className="text-xs text-gray-500 mt-2">
                    Press Enter to send • Shift+Enter for new line • Esc to
                    minimize
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAIAssistant;
