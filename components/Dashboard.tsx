import React, { useState, useEffect, useMemo } from 'react';
import { LogOut, Search, Plus, Trash2, Edit2, Copy, Eye, EyeOff, SortAsc, Upload, Filter, X, AlertTriangle, Shield, Key, Globe } from 'lucide-react';
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
      throw error;
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

  // Stats
  const stats = useMemo(() => {
    const total = credentials.length;
    const ldapCount = credentials.filter(c => c.ldap).length;
    const localCount = total - ldapCount;
    const toolCount = new Set(credentials.map(c => c.tool)).size;
    return { total, ldapCount, localCount, toolCount };
  }, [credentials]);

  const filteredAndSortedCredentials = useMemo(() => {
    let result = [...credentials];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.tool.toLowerCase().includes(lower) || 
        c.username.toLowerCase().includes(lower) ||
        c.description.toLowerCase().includes(lower)
      );
    }

    if (filterLdap !== 'all') {
        const isLdap = filterLdap === 'ldap';
        result = result.filter(c => c.ldap === isLdap);
    }

    if (filterTool !== 'all') {
        result = result.filter(c => c.tool === filterTool);
    }

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

  const hasActiveFilters = searchTerm || filterLdap !== 'all' || filterTool !== 'all';

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

  const renderSkeletonRows = () => (
    Array.from({ length: 4 }).map((_, i) => (
      <tr key={i}>
        {Array.from({ length: 7 }).map((_, j) => (
          <td key={j} className="px-6 py-4">
            <div className="skeleton h-4 rounded-md" style={{ width: `${60 + Math.random() * 40}%` }} />
          </td>
        ))}
      </tr>
    ))
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        {/* Red accent line */}
        <div className="h-0.5 header-accent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Claro.svg/2560px-Claro.svg.png" 
              alt="Claro Logo" 
              className="h-7 w-auto object-contain"
            />
            <div className="h-5 w-px bg-gray-200" />
            <h1 className="text-lg font-bold text-gray-900">Credentials Manager</h1>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 animate-fade-in">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="stat-card bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <Key className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500 font-medium">Total Credentials</p>
            </div>
          </div>
          <div className="stat-card bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.ldapCount}</p>
              <p className="text-xs text-gray-500 font-medium">LDAP Auth</p>
            </div>
          </div>
          <div className="stat-card bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Key className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.localCount}</p>
              <p className="text-xs text-gray-500 font-medium">Local Auth</p>
            </div>
          </div>
          <div className="stat-card bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Globe className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.toolCount}</p>
              <p className="text-xs text-gray-500 font-medium">Unique Tools</p>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4">
            
            <div className="flex flex-col lg:flex-row justify-between gap-4">
                
                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-3 flex-grow">
                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search credentials..."
                            className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus-ring text-sm placeholder-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex gap-3">
                        <select
                            value={filterLdap}
                            onChange={(e) => setFilterLdap(e.target.value as any)}
                            className="block w-full md:w-40 pl-3 pr-8 py-2 border border-gray-200 rounded-lg bg-gray-50 focus-ring text-sm text-gray-700"
                        >
                            <option value="all">All Auth Types</option>
                            <option value="ldap">LDAP Only</option>
                            <option value="local">Local Only</option>
                        </select>

                        <select
                            value={filterTool}
                            onChange={(e) => setFilterTool(e.target.value)}
                            className="block w-full md:w-40 pl-3 pr-8 py-2 border border-gray-200 rounded-lg bg-gray-50 focus-ring text-sm text-gray-700"
                        >
                            <option value="all">All Tools</option>
                            {uniqueTools.map(tool => (
                                <option key={tool} value={tool}>{tool}</option>
                            ))}
                        </select>

                        {hasActiveFilters && (
                            <button 
                                onClick={clearFilters}
                                className="px-3 py-2 text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                title="Clear filters"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center justify-center px-3.5 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium"
                    >
                        <Upload className="w-4 h-4 mr-1.5" />
                        Import
                    </button>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className={`flex items-center justify-center px-3.5 py-2 rounded-lg transition-all text-sm font-medium shadow-sm ${
                          showAddForm 
                            ? 'bg-gray-100 text-gray-700 border border-gray-200 shadow-none' 
                            : 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-600/20'
                        }`}
                    >
                        <Plus className={`w-4 h-4 mr-1.5 transition-transform duration-200 ${showAddForm ? 'rotate-45' : ''}`} />
                        {showAddForm ? 'Close' : 'Add New'}
                    </button>
                </div>
            </div>

            {/* Active filters indicator */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Filter className="w-3 h-3" />
                <span>Showing {filteredAndSortedCredentials.length} of {credentials.length} credentials</span>
              </div>
            )}
        </div>

        {/* Add Credential Panel */}
        {showAddForm && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 animate-fade-in-down">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Credential</h2>
                <CredentialForm onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} />
            </div>
        )}

        {/* Credentials Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {['Tool', 'Link', 'Username', 'Password', 'Auth', 'Notes', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {renderSkeletonRows()}
                </tbody>
              </table>
            </div>
          ) : filteredAndSortedCredentials.length === 0 ? (
            <div className="p-12 text-center animate-fade-in">
                <div className="mx-auto w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <Filter className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No matching credentials</h3>
                <p className="text-gray-500 mt-1 text-sm">Try adjusting your filters or search terms.</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium">
                      Clear all filters
                  </button>
                )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group select-none transition-colors"
                          onClick={() => handleSort('tool')}
                      >
                        <div className="flex items-center">
                          Tool
                          {renderSortIcon('tool')}
                        </div>
                      </th>
                      <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group select-none transition-colors"
                          onClick={() => handleSort('link')}
                      >
                          <div className="flex items-center">
                              Link
                              {renderSortIcon('link')}
                          </div>
                      </th>
                      <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group select-none transition-colors"
                          onClick={() => handleSort('username')}
                      >
                          <div className="flex items-center">
                              Username
                              {renderSortIcon('username')}
                          </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Auth</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    {filteredAndSortedCredentials.map((cred, index) => (
                      <tr 
                        key={cred.id} 
                        className="hover:bg-gray-50/50 transition-colors stagger-row"
                        style={{ animationDelay: `${index * 0.03}s` }}
                      >
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{cred.tool}</div>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                             {cred.link ? (
                                  <>
                                  <a 
                                      href={cred.link} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="text-sm text-primary-600 hover:text-primary-700 hover:underline truncate max-w-[140px] block"
                                      title={cred.link}
                                  >
                                      {new URL(cred.link).hostname}
                                  </a>
                                  <button onClick={() => handleCopy(cred.link)} className="text-gray-300 hover:text-gray-500 transition-colors" title="Copy URL">
                                      <Copy className="h-3 w-3" />
                                  </button>
                                  </>
                             ) : (
                               <span className="text-gray-300 text-sm">--</span>
                             )}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex items-center gap-1.5 group">
                            <span className="font-medium">{cred.username}</span>
                            <button 
                              onClick={() => handleCopy(cred.username)} 
                              className="text-gray-300 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-all"
                              title="Copy Username"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 group">
                            <span className={`text-sm font-mono ${visiblePasswords[cred.id!] ? 'text-gray-800' : 'text-gray-400 tracking-wider'}`}>
                              {visiblePasswords[cred.id!] ? cred.password : '········'}
                            </span>
                            <button 
                              onClick={() => togglePasswordVisibility(cred.id!)} 
                              className={`p-1 rounded-md transition-all ${
                                  visiblePasswords[cred.id!] 
                                      ? 'text-primary-600 bg-primary-50 hover:bg-primary-100' 
                                      : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                              }`}
                              title={visiblePasswords[cred.id!] ? "Hide Password" : "Show Password"}
                            >
                               {visiblePasswords[cred.id!] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                            <button 
                              onClick={() => handleCopy(cred.password || '')} 
                              className="text-gray-300 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-all p-1"
                              title="Copy Password"
                            >
                               <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          {cred.ldap ? (
                              <span className="badge-ldap px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full">
                                  LDAP
                              </span>
                          ) : (
                              <span className="badge-local px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full">
                                  Local
                              </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="text-sm text-gray-500 max-w-xs truncate" title={cred.description}>
                              {cred.description || <span className="text-gray-300">--</span>}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                                onClick={() => setEditingCred(cred)} 
                                className="text-gray-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                                title="Edit"
                            >
                                <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button 
                                onClick={() => setDeleteId(cred.id!)} 
                                className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredAndSortedCredentials.map((cred, index) => (
                  <div 
                    key={cred.id} 
                    className="p-4 hover:bg-gray-50/50 transition-colors stagger-row"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{cred.tool}</h3>
                        {cred.link && (
                          <a 
                            href={cred.link} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-xs text-primary-600 hover:underline"
                          >
                            {new URL(cred.link).hostname}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {cred.ldap ? (
                          <span className="badge-ldap px-2 py-0.5 text-xs font-semibold rounded-full">LDAP</span>
                        ) : (
                          <span className="badge-local px-2 py-0.5 text-xs font-semibold rounded-full">Local</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs">Username</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-gray-900">{cred.username}</span>
                          <button onClick={() => handleCopy(cred.username)} className="text-gray-300 hover:text-primary-600">
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs">Password</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono text-xs ${visiblePasswords[cred.id!] ? 'text-gray-800' : 'text-gray-400'}`}>
                            {visiblePasswords[cred.id!] ? cred.password : '········'}
                          </span>
                          <button onClick={() => togglePasswordVisibility(cred.id!)} className="text-gray-400 hover:text-gray-600">
                            {visiblePasswords[cred.id!] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                          <button onClick={() => handleCopy(cred.password || '')} className="text-gray-300 hover:text-primary-600">
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      {cred.description && (
                        <p className="text-xs text-gray-500 pt-1 truncate">{cred.description}</p>
                      )}
                    </div>

                    <div className="flex justify-end gap-1 mt-3 pt-2 border-t border-gray-100">
                      <button 
                        onClick={() => setEditingCred(cred)} 
                        className="text-gray-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50 transition-colors text-xs flex items-center gap-1"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>
                      <button 
                        onClick={() => setDeleteId(cred.id!)} 
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors text-xs flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Row count footer */}
              <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-500">
                {filteredAndSortedCredentials.length} credential{filteredAndSortedCredentials.length !== 1 ? 's' : ''}
                {hasActiveFilters ? ` (filtered from ${credentials.length})` : ''}
              </div>
            </>
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
            <div className="flex items-start gap-3 bg-red-50 p-4 rounded-xl text-red-800 border border-red-100">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium">Are you sure you want to delete this credential? This action cannot be undone.</p>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
                <button 
                    onClick={() => setDeleteId(null)} 
                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
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
