'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Glass } from '@/components/ui/glass';

interface Alumni {
  id: number;
  user_id: string;
  title: string;
  ref_no: string;
  tr_type: string;
  dep: string;
  f_name: string;
  l_name: string;
  gender: string;
  country: string;
  country2: string;
  clasification: string;
  r_group: string;
  institute: string;
  email_1: string;
  email_2: string;
  tr_loc: string;
  tr_name: string;
  tr_name_text: string;
  st: string;
  t1: string;
  t2: string;
  t3: string;
  t4: string;
  t5: string;
  t6: string;
  t7: string;
  t8: string;
  t9: string;
  address: string;
  birthday: string;
  job_title: string;
  programme_name: string;
  created_at: string;
  updated_at: string;
}

export default function AlumniManagement() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedField, setSelectedField] = useState('f_name');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'view' | 'edit'>('list');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAlumni();
  }, []);

  async function fetchAlumni() {
    try {
      const { data, error } = await supabase
        .from('alumni')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlumni(data || []);
    } catch (error) {
      console.error('Error fetching alumni:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this alumni record?')) return;
    
    try {
      const { error } = await supabase
        .from('alumni')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAlumni();
      if (selectedAlumni?.id === id) {
        setSelectedAlumni(null);
        setViewMode('list');
      }
    } catch (error) {
      console.error('Error deleting alumni:', error);
      setError('Failed to delete alumni record');
    }
  }

  async function handleSave() {
    if (!selectedAlumni) return;
    setSaving(true);
    setError(null);

    try {
      const { id, user_id, created_at, updated_at, ...updateData } = selectedAlumni;
      const { error } = await supabase
        .from('alumni')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      await fetchAlumni();
      setViewMode('view');
    } catch (error) {
      console.error('Error updating alumni:', error);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  function handleView(alumni: Alumni) {
    setSelectedAlumni(alumni);
    setViewMode('view');
  }

  function handleEdit(alumni: Alumni) {
    setSelectedAlumni(alumni);
    setViewMode('edit');
  }

  function handleBack() {
    if (viewMode === 'edit' && selectedAlumni) {
      setViewMode('view');
    } else {
      setSelectedAlumni(null);
      setViewMode('list');
    }
  }

  const filteredAlumni = alumni.filter(item => {
    const searchValue = String(item[selectedField as keyof Alumni] || '').toLowerCase();
    return searchValue.includes(searchQuery.toLowerCase());
  });

  const totalPages = Math.ceil(filteredAlumni.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAlumni = filteredAlumni.slice(startIndex, startIndex + itemsPerPage);

  const searchFields = [
    { value: 'f_name', label: 'First Name' },
    { value: 'l_name', label: 'Last Name' },
    { value: 'email_1', label: 'Email' },
    { value: 'country', label: 'Country' },
    { value: 'ref_no', label: 'Reference Number' },
    { value: 'job_title', label: 'Job Title' },
    { value: 'programme_name', label: 'Programme Name' },
  ];

  if (viewMode === 'view' && selectedAlumni) {
    return (
      <div className="space-y-8">
        <Glass className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <button onClick={handleBack} className="glass-button p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-iaca-blue">Alumni Details</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(selectedAlumni)} className="glass-button px-4 py-2 text-iaca-blue">
                Edit
              </button>
              <button onClick={() => handleDelete(selectedAlumni.id)} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700">Personal Information</h3>
                <div className="mt-2 space-y-2">
                  <p><span className="text-sm text-gray-500">Full Name:</span> {selectedAlumni.title} {selectedAlumni.f_name} {selectedAlumni.l_name}</p>
                  <p><span className="text-sm text-gray-500">Email:</span> {selectedAlumni.email_1}</p>
                  {selectedAlumni.email_2 && <p><span className="text-sm text-gray-500">Secondary Email:</span> {selectedAlumni.email_2}</p>}
                  <p><span className="text-sm text-gray-500">Gender:</span> {selectedAlumni.gender || 'Not specified'}</p>
                  <p><span className="text-sm text-gray-500">Birthday:</span> {selectedAlumni.birthday ? new Date(selectedAlumni.birthday).toLocaleDateString() : 'Not specified'}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-700">Location</h3>
                <div className="mt-2 space-y-2">
                  <p><span className="text-sm text-gray-500">Country:</span> {selectedAlumni.country}</p>
                  {selectedAlumni.country2 && <p><span className="text-sm text-gray-500">Secondary Country:</span> {selectedAlumni.country2}</p>}
                  <p><span className="text-sm text-gray-500">Address:</span> {selectedAlumni.address || 'Not specified'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700">Professional Information</h3>
                <div className="mt-2 space-y-2">
                  <p><span className="text-sm text-gray-500">Job Title:</span> {selectedAlumni.job_title || 'Not specified'}</p>
                  <p><span className="text-sm text-gray-500">Institute:</span> {selectedAlumni.institute || 'Not specified'}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-700">Programme Information</h3>
                <div className="mt-2 space-y-2">
                  <p><span className="text-sm text-gray-500">Reference No:</span> {selectedAlumni.ref_no}</p>
                  <p><span className="text-sm text-gray-500">Programme Name:</span> {selectedAlumni.programme_name || selectedAlumni.tr_name || 'Not specified'}</p>
                  <p><span className="text-sm text-gray-500">Training Location:</span> {selectedAlumni.tr_loc || 'Not specified'}</p>
                  <p><span className="text-sm text-gray-500">Department:</span> {selectedAlumni.dep || 'Not specified'}</p>
                  <p><span className="text-sm text-gray-500">Classification:</span> {selectedAlumni.clasification || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>
        </Glass>
      </div>
    );
  }

  if (viewMode === 'edit' && selectedAlumni) {
    return (
      <div className="space-y-8">
        <Glass className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <button onClick={handleBack} className="glass-button p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-iaca-blue">Edit Alumni</h1>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Personal Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Title</label>
                    <input
                      type="text"
                      value={selectedAlumni.title || ''}
                      onChange={(e) => setSelectedAlumni({ ...selectedAlumni, title: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">First Name</label>
                    <input
                      type="text"
                      value={selectedAlumni.f_name || ''}
                      onChange={(e) => setSelectedAlumni({ ...selectedAlumni, f_name: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={selectedAlumni.l_name || ''}
                      onChange={(e) => setSelectedAlumni({ ...selectedAlumni, l_name: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={selectedAlumni.email_1 || ''}
                      onChange={(e) => setSelectedAlumni({ ...selectedAlumni, email_1: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Secondary Email</label>
                    <input
                      type="email"
                      value={selectedAlumni.email_2 || ''}
                      onChange={(e) => setSelectedAlumni({ ...selectedAlumni, email_2: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Gender</label>
                    <select
                      value={selectedAlumni.gender || ''}
                      onChange={(e) => setSelectedAlumni({ ...selectedAlumni, gender: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Birthday</label>
                    <input
                      type="date"
                      value={selectedAlumni.birthday || ''}
                      onChange={(e) => setSelectedAlumni({ ...selectedAlumni, birthday: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Professional & Location Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Professional & Location Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={selectedAlumni.job_title || ''}
                      onChange={(e) => setSelectedAlumni({ ...selectedAlumni, job_title: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Institute</label>
                    <input
                      type="text"
                      value={selectedAlumni.institute || ''}
                      onChange={(e) => setSelectedAlumni({ ...selectedAlumni, institute: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Country</label>
                    <input
                      type="text"
                      value={selectedAlumni.country || ''}
                      onChange={(e) => setSelectedAlumni({ ...selectedAlumni, country: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Secondary Country</label>
                    <input
                      type="text"
                      value={selectedAlumni.country2 || ''}
                      onChange={(e) => setSelectedAlumni({ ...selectedAlumni, country2: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Address</label>
                    <textarea
                      value={selectedAlumni.address || ''}
                      onChange={(e) => setSelectedAlumni({ ...selectedAlumni, address: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-iaca-blue text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Glass>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Glass className="p-6">
        <h1 className="text-2xl font-bold text-iaca-blue mb-6">Alumni Management</h1>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alumni..."
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search By
            </label>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {searchFields.map((field) => (
                <option key={field.value} value={field.value}>
                  {field.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Alumni Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Programme
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Title
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-iaca-blue border-r-transparent"></div>
                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedAlumni.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No alumni records found
                  </td>
                </tr>
              ) : (
                paginatedAlumni.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.title} {item.f_name} {item.l_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Ref: {item.ref_no}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{item.email_1}</div>
                      {item.email_2 && (
                        <div className="text-sm text-gray-500">{item.email_2}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{item.country}</div>
                      {item.country2 && (
                        <div className="text-sm text-gray-500">{item.country2}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{item.programme_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{item.job_title}</div>
                      <div className="text-sm text-gray-500">{item.institute}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleView(item)}
                        className="text-iaca-blue hover:text-blue-700 mr-4"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-iaca-blue hover:text-blue-700 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 px-6 py-3 bg-gray-50">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(startIndex + itemsPerPage, filteredAlumni.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredAlumni.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">First</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === totalPages || 
                      Math.abs(currentPage - page) <= 1
                    )
                    .map((page, index, array) => {
                      if (index > 0 && array[index - 1] !== page - 1) {
                        return [
                          <span key={`ellipsis-${page}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>,
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ];
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Last</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 15.707a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L8.586 10l-4.293 4.293a1 1 0 000 1.414zm6 0a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L14.586 10l-4.293 4.293a1 1 0 000 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </Glass>
    </div>
  );
}