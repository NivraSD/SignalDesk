import React, { useState } from "react";
import { Save, Check, AlertCircle } from "lucide-react";
import { useMemoryVault } from "../../hooks/useMemoryVault";

const SaveToMemoryVaultButton = ({
  content,
  title,
  type = "document",
  source,
  tags = [],
  metadata = {},
  folder_type = "content",
  preview, // Add preview prop
  onSuccess, // Note: renamed from onSaveSuccess to match MediaListBuilder usage
  onSaveSuccess, // Keep for backward compatibility
  buttonText = "Save to Vault",
  showNotification = true,
}) => {
  const { saveToMemoryVault, isSaving } = useMemoryVault();
  const [saveStatus, setSaveStatus] = useState(null);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    if (!content) {
      setMessage("No content to save");
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }

    const result = await saveToMemoryVault({
      title,
      content,
      type,
      source,
      tags,
      metadata,
      folder_type,
      preview, // Pass preview to the hook
    });

    if (result.success) {
      setSaveStatus("success");
      setMessage("Saved to MemoryVault!");

      // Support both callback prop names
      if (onSuccess) {
        onSuccess(result.item);
      } else if (onSaveSuccess) {
        onSaveSuccess(result.item);
      }
    } else {
      setSaveStatus("error");
      setMessage(result.error || "Failed to save");
    }

    setTimeout(() => {
      setSaveStatus(null);
      setMessage("");
    }, 3000);
  };

  return (
    <>
      <button
        onClick={handleSave}
        disabled={isSaving || !content}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          backgroundColor:
            saveStatus === "success"
              ? "#10b981"
              : saveStatus === "error"
              ? "#ef4444"
              : "#4f46e5",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: isSaving || !content ? "not-allowed" : "pointer",
          opacity: isSaving || !content ? 0.6 : 1,
          transition: "all 0.2s",
          fontSize: "14px",
          fontWeight: "500",
        }}
      >
        {saveStatus === "success" ? (
          <Check style={{ width: "16px", height: "16px" }} />
        ) : saveStatus === "error" ? (
          <AlertCircle style={{ width: "16px", height: "16px" }} />
        ) : (
          <Save style={{ width: "16px", height: "16px" }} />
        )}
        {isSaving ? "Saving..." : saveStatus ? message : buttonText}
      </button>
    </>
  );
};

export default SaveToMemoryVaultButton;
