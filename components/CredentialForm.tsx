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
            // Reset if adding new
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tool Name</label>
          <input
            type="text"
            name="tool"
            required
            value={formData.tool}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g. Jira"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
          <input
            type="url"
            name="link"
            value={formData.link}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            type="text"
            name="username"
            required
            value={formData.username}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Username"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="text" // Using text type so user can see what they type when adding/editing
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
            placeholder="Password"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Optional notes..."
        />
      </div>

      <div className="flex items-center">
        <input
          id="ldap-checkbox"
          type="checkbox"
          name="ldap"
          checked={formData.ldap}
          onChange={handleChange}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label htmlFor="ldap-checkbox" className="ml-2 block text-sm text-gray-900">
          Uses LDAP Authentication
        </label>
      </div>

      <div className={`flex ${isModal ? 'justify-end' : 'justify-start'} gap-3 pt-2`}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Credential')}
        </button>
      </div>
    </form>
  );
};