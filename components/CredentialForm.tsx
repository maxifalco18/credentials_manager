import React, { useState, useEffect } from 'react';
import { Credential } from '../types';

interface CredentialFormProps {
  initialData?: Credential | null;
  onSubmit: (data: Credential) => Promise<void>;
  onCancel?: () => void;
  isModal?: boolean;
}

export const CredentialForm: React.FC<CredentialFormProps> = ({ initialData, onSubmit, onCancel, isModal = false }) => {
  const [formData, setFormData] = useState<Credential>({
    tool: '',
    link: '',
    username: '',
    password: '',
    ldap: false,
    description: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        await onSubmit(formData);
        if (!initialData) {
            setFormData({
                tool: '',
                link: '',
                username: '',
                password: '',
                ldap: false,
                description: '',
            });
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Tool Name</label>
          <input
            type="text"
            name="tool"
            required
            value={formData.tool}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus-ring text-sm placeholder-gray-400"
            placeholder="e.g. Jira"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Link URL</label>
          <input
            type="url"
            name="link"
            value={formData.link}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus-ring text-sm placeholder-gray-400"
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            name="username"
            required
            value={formData.username}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus-ring text-sm placeholder-gray-400"
            placeholder="Username"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="text"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus-ring text-sm font-mono placeholder-gray-400"
            placeholder="Password"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus-ring text-sm placeholder-gray-400 resize-none"
          placeholder="Optional notes..."
        />
      </div>

      <div className="flex items-center gap-3 py-1">
        <button
          type="button"
          role="switch"
          aria-checked={formData.ldap}
          onClick={() => setFormData(prev => ({ ...prev, ldap: !prev.ldap }))}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
            formData.ldap ? 'bg-primary-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              formData.ldap ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
        <label className="text-sm text-gray-700 font-medium cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, ldap: !prev.ldap }))}>
          LDAP Authentication
        </label>
      </div>

      <div className={`flex ${isModal ? 'justify-end' : 'justify-start'} gap-3 pt-3`}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-primary-600 rounded-xl text-sm font-semibold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            initialData ? 'Save Changes' : 'Add Credential'
          )}
        </button>
      </div>
    </form>
  );
};
