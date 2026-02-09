import React, { useState, useEffect, useMemo } from 'react';
import { LogOut, Search, Plus, Trash2, Edit2, Copy, Eye, EyeOff, SortAsc, Upload, Filter, X, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { Credential, SortField, SortOrder } from '../types';
import { CredentialForm } from './CredentialForm';
import { BulkImportModal } from './BulkImportModal';
import { Modal } from './Modal';
import { Toast } from './Toast';

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLdap, setFilterLdap] = useState<'all' | 'ldap' | 'local'>('all');
  const [filterTool, setFilterTool] = useState<string>('all');
  
  const [sortField, setSortField] = useState<SortField>('tool');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // UI State
  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});
  const [editingCred, setEditingCred] = useState<Credential | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const data = await api.getCredentials();
      setCredentials(data);
    } catch (error) {
      showToast('Failed to load credentials', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  };

  const togglePasswordVisibility = (id: number) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAdd = async (newCred: Credential) => {
    try {
      await api.addCredential(newCred);
      await loadCredentials();
      showToast('Credential added successfully', 'success');
      setShowAddForm(false);
    } catch (error: any) {
      showToast(error.message || 'Failed to add', 'error');
    }
  };

  const handleBulkImport = async (newCreds: Credential[]) => {
    try {
      await api.bulkAddCredentials(newCreds);
      await loadCredentials();
      showToast(`Successfully imported ${newCreds.length} credentials`, 'success');
      setShowImportModal(false);
    } catch (error: any) {
      showToast('Failed to import credentials', 'error');
      throw error; // Let modal handle error state if needed
    }
  };

  const handleUpdate = async (updatedCred: Credential) => {
    if (!updatedCred.id) return;
    try {
      await api.updateCredential(updatedCred.id, updatedCred);
      await loadCredentials();
      setEditingCred(null);
      showToast('Credential updated successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update', 'error');
    }
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;
    try {
      await api.deleteCredential(deleteId);
      setCredentials(prev => prev.filter(c => c.id !== deleteId));
      showToast('Credential deleted', 'success');
      setDeleteId(null);
    } catch (error: any) {
      showToast(error.message || 'Failed to delete', 'error');
    }
  };

  const uniqueTools = useMemo(() => {
    const tools = new Set(credentials.map(c => c.tool));
    return Array.from(tools).sort();
  }, [credentials]);

  const filteredAndSortedCredentials = useMemo(() => {
    let result = [...credentials];

    // Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.tool.toLowerCase().includes(lower) || 
        c.username.toLowerCase().includes(lower) ||
        c.description.toLowerCase().includes(lower)
      );
    }

    // Filter by LDAP
    if (filterLdap !== 'all') {
        const isLdap = filterLdap === 'ldap';
        result = result.filter(c => c.ldap === isLdap);
    }

    // Filter by Tool
    if (filterTool !== 'all') {
        result = result.filter(c => c.tool === filterTool);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = (a[sortField] || '').toString().toLowerCase();
      const bVal = (b[sortField] || '').toString().toLowerCase();
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [credentials, searchTerm, filterLdap, filterTool, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterLdap('all');
    setFilterTool('all');
  };

  const renderSortIcon = (field: SortField) => {
    const isActive = sortField === field;
    return (
        <SortAsc 
            className={`ml-1 h-3 w-3 transition-all duration-200 ${
                isActive 
                    ? `text-primary-600 opacity-100 ${sortOrder === 'desc' ? 'transform rotate-180' : ''}` 
                    : 'text-gray-400 opacity-0 group-hover:opacity-100'
            }`} 
        />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Claro.svg/2560px-Claro.svg.png" 
              alt="Claro Logo" 
              className="h-8 w-auto object-contain"
            />
            <h1 className="text-xl font-bold text-gray-900 border-l border-gray-300 pl-3 ml-1">Credentials Manager</h1>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Controls Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
            
            <div className="flex flex-col lg:flex-row justify-between gap-4">
                
                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-3 flex-grow">
                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex gap-3">
                        <select
                            value={filterLdap}
                            onChange={(e) => setFilterLdap(e.target.value as any)}
                            className="block w-full md:w-40 pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-white"
                        >
                            <option value="all">All Auth Types</option>
                            <option value="ldap">LDAP Only</option>
                            <option value="local">Local Only</option>
                        </select>

                        <select
                            value={filterTool}
                            onChange={(e) => setFilterTool(e.target.value)}
                            className="block w-full md:w-40 pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-white"
                        >
                            <option value="all">All Tools</option>
                            {uniqueTools.map(tool => (
                                <option key={tool} value={tool}>{tool}</option>
                            ))}
                        </select>

                        {(searchTerm || filterLdap !== 'all' || filterTool !== 'all') && (
                            <button 
                                onClick={clearFilters}
                                className="px-3 py-2 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                title="Clear filters"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 flex-shrink-0">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Upload className="w-5 h-5 mr-2" />
                        Import CSV
                    </button>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        {showAddForm ? 'Close Form' : 'Add New'}
                    </button>
                </div>
            </div>
        </div>

        {/* Add Credential Panel */}
        {showAddForm && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in-down">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Credential</h2>
                <CredentialForm onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} />
            </div>
        )}

        {/* List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading credentials...</div>
          ) : filteredAndSortedCredentials.length === 0 ? (
            <div className="p-12 text-center">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Filter className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No matching credentials</h3>
                <p className="text-gray-500 mt-1">Try adjusting your filters or search terms.</p>
                <button onClick={clearFilters} className="mt-4 text-primary-600 hover:text-primary-800 font-medium">
                    Clear all filters
                </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group select-none"
                        onClick={() => handleSort('tool')}
                    >
                      <div className="flex items-center">
                        Tool
                        {renderSortIcon('tool')}
                      </div>
                    </th>
                    <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group select-none"
                        onClick={() => handleSort('link')}
                    >
                        <div className="flex items-center">
                            Link
                            {renderSortIcon('link')}
                        </div>
                    </th>
                    <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group select-none"
                        onClick={() => handleSort('username')}
                    >
                        <div className="flex items-center">
                            Username
                            {renderSortIcon('username')}
                        </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auth</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedCredentials.map((cred) => (
                    <tr key={cred.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{cred.tool}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                           {cred.link && (
                                <>
                                <a 
                                    href={cred.link} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-primary-600 hover:text-primary-800 truncate max-w-[150px] block"
                                    title={cred.link}
                                >
                                    {new URL(cred.link).hostname}
                                </a>
                                <button onClick={() => handleCopy(cred.link)} className="text-gray-400 hover:text-gray-600" title="Copy URL">
                                    <Copy className="h-3.5 w-3.5" />
                                </button>
                                </>
                           )}
                           {!cred.link && <span className="text-gray-400 text-sm">-</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center space-x-2 group">
                          <span>{cred.username}</span>
                          <button 
                            onClick={() => handleCopy(cred.username)} 
                            className="text-gray-400 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy Username"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 group">
                          <span className={`text-sm font-mono ${visiblePasswords[cred.id!] ? 'text-gray-800' : 'text-gray-400'}`}>
                            {visiblePasswords[cred.id!] ? cred.password : '••••••••'}
                          </span>
                          <button 
                            onClick={() => togglePasswordVisibility(cred.id!)} 
                            className={`p-1 rounded-md transition-colors ${
                                visiblePasswords[cred.id!] 
                                    ? 'text-primary-600 bg-primary-50 hover:bg-primary-100' 
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            }`}
                            title={visiblePasswords[cred.id!] ? "Hide Password" : "Show Password"}
                          >
                             {visiblePasswords[cred.id!] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button 
                            onClick={() => handleCopy(cred.password || '')} 
                            className="text-gray-400 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            title="Copy Password"
                          >
                             <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {cred.ldap ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                LDAP
                            </span>
                        ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Local
                            </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate" title={cred.description}>
                            {cred.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                            onClick={() => setEditingCred(cred)} 
                            className="text-indigo-600 hover:text-indigo-900 mr-3 p-1 rounded hover:bg-indigo-50"
                            title="Edit"
                        >
                            <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                            onClick={() => setDeleteId(cred.id!)} 
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Delete"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingCred}
        onClose={() => setEditingCred(null)}
        title="Edit Credential"
      >
        <CredentialForm
          initialData={editingCred}
          onSubmit={handleUpdate}
          onCancel={() => setEditingCred(null)}
          isModal={true}
        />
      </Modal>

      {/* Bulk Import Modal */}
      <BulkImportModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleBulkImport}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Credential"
      >
        <div className="space-y-4">
            <div className="flex items-start gap-3 bg-red-50 p-3 rounded-lg text-red-800 border border-red-100">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium">Are you sure you want to delete this credential? This action cannot be undone.</p>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
                <button 
                    onClick={() => setDeleteId(null)} 
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={confirmDelete} 
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium shadow-sm transition-colors"
                >
                    Delete
                </button>
            </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};