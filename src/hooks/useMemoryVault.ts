import { useState, useEffect } from 'react';

export interface MemoryVaultItem {
  id: string;
  title: string;
  content_type: string;
  content: any;
  metadata?: any;
  tags?: string[];
  created_at: string;
  updated_at?: string;
  folder?: string;
}

export function useMemoryVault() {
  const [content, setContent] = useState<MemoryVaultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch content from Memory Vault
  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/content-library/save?limit=500', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setContent(result.data);
      } else {
        setContent([]);
      }
    } catch (err) {
      console.error('Error fetching Memory Vault content:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setContent([]);
    } finally {
      setLoading(false);
    }
  };

  // Save content to Memory Vault
  const saveContent = async (newContent: {
    title: string;
    content: any;
    content_type: string;
    tags?: string[];
    folder?: string;
    metadata?: any;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/content-library/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            type: newContent.content_type,
            title: newContent.title,
            content: newContent.content,
            organization_id: null // Will be set by API if not provided
          },
          metadata: newContent.metadata || {},
          folder: newContent.folder || '',
          tags: newContent.tags || []
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save content: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        // Refresh content list
        await fetchContent();
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to save content');
      }
    } catch (err) {
      console.error('Error saving to Memory Vault:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete content from Memory Vault
  const deleteContent = async (contentId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/content-library/save?id=${contentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete content: ${response.statusText}`);
      }

      // Refresh content list
      await fetchContent();
    } catch (err) {
      console.error('Error deleting from Memory Vault:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch content on mount
  useEffect(() => {
    fetchContent();
  }, []);

  return {
    content,
    loading,
    error,
    fetchContent,
    saveContent,
    deleteContent
  };
}
