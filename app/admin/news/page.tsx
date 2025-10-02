'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import dynamic from 'next/dynamic';
import type { NewsItem } from '@/types';

const Editor = dynamic(() => import('../components/Editor'), {
  ssr: false,
});

export default function AdminNewsPage() {
  const [viewMode, setViewMode] = useState<"create" | "view">("create");
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews() {
    try {
      // First, check if we're authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error("Auth error:", authError.message);
        return;
      }

      // Fetch news data
      const { data: newsData, error: newsError } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });

      if (newsError) throw newsError;

      // Process the news data
      const newsWithAuthors = newsData?.map(newsItem => ({
        ...newsItem,
        author_name: "IACA Alumni Team"
      })) || [];

      setNews(newsWithAuthors);
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
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("User not authenticated");

      if (editing) {
        // Update existing news
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
        // Create new news
        const { error: insertError } = await supabase
          .from("news")
          .insert([{ 
            title, 
            body: content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (insertError) throw insertError;
      }

      // Reset form and refresh news
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

    setLoading(true);
    try {
      const { error } = await supabase
        .from("news")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await fetchNews();
    } catch (error) {
      console.error("Error deleting news:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(item: NewsItem) {
    setEditing(item);
    setTitle(item.title);
    setContent(item.body || "");
    window.scrollTo(0, 0);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-iaca-blue">Manage News</h1>
          {editing && (
            <button
              onClick={() => {
                setEditing(null);
                setTitle("");
                setContent("");
              }}
              className="glass-button px-4 py-2 text-gray-600"
            >
              Cancel Editing
            </button>
          )}
        </div>

        {/* Create/Edit Form */}
        <form onSubmit={handleSubmit} className="glass-card space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">
            {editing ? "Edit News Article" : "Create News Article"}
          </h2>
          
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input w-full"
              placeholder="Enter news title"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600">Content</label>
            <div className="min-h-[200px]">
              {typeof window !== 'undefined' && (
                <Editor 
                  initialContent={content}
                  onUpdate={setContent}
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-iaca-blue text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            {loading ? "Saving..." : editing ? "Update Article" : "Publish Article"}
          </button>
        </form>

        {/* News Gallery */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-700">Published Articles</h2>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input px-3 py-2 text-sm w-full sm:w-64"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="glass-input px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="glass-input px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card animate-pulse h-64" />
              ))}
            </div>
          ) : news.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No news articles yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {news
                .filter(item => {
                  const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
                  const itemDate = new Date(item.created_at).toISOString().split('T')[0];
                  const matchesStartDate = !startDate || itemDate >= startDate;
                  const matchesEndDate = !endDate || itemDate <= endDate;
                  return matchesSearch && matchesStartDate && matchesEndDate;
                })
                .map((item) => (
                  <div key={item.id} className="glass-card overflow-hidden group hover:shadow-lg transition-all duration-300">
                    <div className="p-6">
                      <div className="flex flex-col gap-3 mb-4">
                        <h3 className="font-semibold text-iaca-blue text-xl hover:text-blue-700 transition-colors">
                          {item.title}
                        </h3>
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          <span className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            {item.author_name}
                          </span>
                          <span className="flex items-center gap-2">
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
                        className="prose prose-sm max-h-32 overflow-hidden mb-6 text-gray-600" 
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
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
  const [viewMode, setViewMode] = useState<"create" | "view">("create");

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews() {
    try {
      // First, check if we're authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error("Auth error:", authError.message);
        return;
      }
      console.log("Authenticated as:", user?.email);

      // Fetch news data
      const { data: newsData, error: newsError } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });

      if (newsError) {
        console.error("News fetch error details:", {
          message: newsError.message,
          details: newsError.details,
          hint: newsError.hint
        });
        throw newsError;
      }

      console.log("Raw news data:", newsData);

      // Process the news data
      const newsWithAuthors = newsData?.map(newsItem => ({
        ...newsItem,
        author_name: "IACA Alumni Team"
      })) || [];

      console.log("Fetched news:", newsWithAuthors); // Debug log
      setNews(newsWithAuthors);
    } catch (error) {
      console.error("Error fetching news:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("User not authenticated");

      if (editing) {
        // Update existing news
        const { data: updateData, error: updateError } = await supabase
          .from("news")
          .update({ 
            title, 
            body: content,
            updated_at: new Date().toISOString() 
          })
          .eq("id", editing.id)
          .select();

        if (updateError) {
          console.error("Update error details:", {
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint
          });
          throw updateError;
        }
        console.log("Updated news:", updateData);
      } else {
        // Create new news
        const { data: insertData, error: insertError } = await supabase
          .from("news")
          .insert([{ 
            title, 
            body: content
          }])
          .select();

        if (insertError) {
          console.error("Insert error details:", {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
          });
          throw insertError;
        }
        console.log("Inserted news:", insertData);
      }

      // Reset form and refresh news
      setTitle("");
      setContent("");
      setEditing(null);
      if (typeof window !== 'undefined') {
        // Reset TipTap editor by forcing a re-render
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

    setLoading(true);
    try {
      const { error } = await supabase
        .from("news")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await fetchNews();
    } catch (error) {
      console.error("Error deleting news:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(item: NewsItem) {
    console.log("Editing item:", item);
    setEditing(item);
    setTitle(item.title);
    setContent(item.body || "");
    window.scrollTo(0, 0);
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-iaca-blue">Manage News</h1>
        {editing && (
          <button
            onClick={() => {
              setEditing(null);
              setTitle("");
              setContent("");
            }}
            className="glass-button px-4 py-2 text-gray-600"
          >
            Cancel Editing
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      <form onSubmit={handleSubmit} className="glass-card space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">
          {editing ? "Edit News Article" : "Create News Article"}
        </h2>
        
        <div className="space-y-2">
          <label className="text-sm text-gray-600">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="glass-input w-full"
            placeholder="Enter news title"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-600">Content</label>
          <div className="min-h-[200px]">
            {typeof window !== 'undefined' && (
              <Editor 
                initialContent={content}
                onUpdate={(newContent) => setContent(newContent)}
              />
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-iaca-blue text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
        >
          {loading ? "Saving..." : editing ? "Update Article" : "Publish Article"}
        </button>
      </form>

      {/* News Gallery */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-700">Published Articles</h2>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input px-3 py-2 text-sm w-full sm:w-64"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="glass-input px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="glass-input px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card animate-pulse h-64" />
            ))}
          </div>
        ) : news.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No news articles yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {news
              .filter(item => {
                const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
                const itemDate = new Date(item.created_at).toISOString().split('T')[0];
                const matchesStartDate = !startDate || itemDate >= startDate;
                const matchesEndDate = !endDate || itemDate <= endDate;
                return matchesSearch && matchesStartDate && matchesEndDate;
              })
              .map((item) => (
                <div key={item.id} className="glass-card overflow-hidden group hover:shadow-lg transition-all duration-300">
                  <div className="p-6">
                    <div className="flex flex-col gap-3 mb-4">
                      <h3 className="font-semibold text-iaca-blue text-xl hover:text-blue-700 transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          {item.author_name}
                        </span>
                        <span className="flex items-center gap-2">
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
                      className="prose prose-sm max-h-32 overflow-hidden mb-6 text-gray-600" 
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
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminNewsPage;