"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";

const Editor = dynamic(() => import("./Editor"), {
  ssr: false,
  loading: () => <div className="h-64 glass-card animate-pulse"></div>,
});

interface NewsItem {
  id: number;
  title: string;
  body: string;
  created_at: string;
  updated_at?: string;
  author_name?: string;
}

export default function NewsManagement() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewMode, setViewMode] = useState<"create" | "view">("create");

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error("Auth error:", authError.message);
        return;
      }

      const { data: newsData, error: newsError } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });

      if (newsError) throw newsError;
      setNews(newsData || []);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (editing) {
        const { error: updateError } = await supabase
          .from("news")
          .update({ 
            title, 
            body: content,
            updated_at: new Date().toISOString()
          })
          .eq("id", editing.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("news")
          .insert([{ 
            title, 
            body: content
          }]);

        if (insertError) throw insertError;
      }

      setTitle("");
      setContent("");
      setEditing(null);
      if (typeof window !== 'undefined') {
        const editorElement = document.querySelector('.ProseMirror');
        if (editorElement) {
          editorElement.innerHTML = '';
        }
      }
      await fetchNews();
    } catch (error) {
      console.error("Error saving news:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this news item?")) return;

    try {
      const { error } = await supabase
        .from("news")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await fetchNews();
    } catch (error) {
      console.error("Error deleting news:", error);
    }
  }

  function handleEdit(item: NewsItem) {
    setEditing(item);
    setTitle(item.title);
    setContent(item.body);
    setViewMode("create");
  }

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.body.toLowerCase().includes(searchQuery.toLowerCase());
    
    const itemDate = new Date(item.created_at);
    const matchesStartDate = !startDate || itemDate >= new Date(startDate);
    const matchesEndDate = !endDate || itemDate <= new Date(endDate);

    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  return (
    <div className="space-y-8">
      {/* View toggle */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">News Management</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setViewMode(viewMode === "create" ? "view" : "create")}
            className="glass-button px-6 py-2 rounded-lg"
          >
            {viewMode === "create" ? "View All News" : "Create News"}
          </button>
        </div>
      </div>

      {viewMode === "create" ? (
        // Create/Edit Form
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="News title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input w-full px-4 py-2 rounded-lg"
              required
            />
          </div>
          <Editor 
            initialContent={editing?.body || ""}
            onUpdate={(newContent) => setContent(newContent)}
          />
          <div className="flex justify-end gap-4">
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setTitle("");
                  setContent("");
                }}
                className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="glass-button px-6 py-2 rounded-lg"
              disabled={loading}
            >
              {loading ? "Saving..." : editing ? "Update News" : "Publish News"}
            </button>
          </div>
        </form>
      ) : (
        // View All News
        <div className="space-y-6">
          {/* Search and filter controls */}
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input px-4 py-2 rounded-lg flex-grow"
            />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="glass-input px-4 py-2 rounded-lg"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="glass-input px-4 py-2 rounded-lg"
            />
          </div>

          {/* News List */}
          <div className="space-y-6">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(n => (
                  <div key={n} className="h-40 glass-card"></div>
                ))}
              </div>
            ) : filteredNews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No news items found
              </div>
            ) : (
              filteredNews.map(item => (
                <div key={item.id} className="glass-card p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          {new Date(item.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    <div 
                      className="prose prose-sm max-h-32 overflow-hidden text-gray-600" 
                      dangerouslySetInnerHTML={{ __html: item.body }}
                    />
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex items-center gap-1 glass-button px-4 py-2 text-sm hover:bg-blue-50 transition-colors"
                        type="button"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                          <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="flex items-center gap-1 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        type="button"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}