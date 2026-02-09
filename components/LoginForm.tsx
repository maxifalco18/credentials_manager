import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, Shield } from 'lucide-react';
import { api } from '../services/api';

interface LoginFormProps {
  onLoginSuccess: (token: string) => void;
  onError: (msg: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, onError }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    try {
      const result = await api.login({ username, password } as any);
      onLoginSuccess(result.token);
    } catch (error: any) {
      onError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center login-bg px-4 relative overflow-hidden">
      {/* Decorative accent bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1 header-accent" />

      <div className="max-w-md w-full animate-fade-in-up">
        {/* Main Card */}
        <div className="glass-card rounded-2xl shadow-xl overflow-hidden">
          {/* Header section with subtle red accent */}
          <div className="relative px-8 pt-10 pb-8 text-center">
            {/* Subtle background decoration */}
            <div className="absolute top-0 left-0 right-0 h-1 header-accent" />
            
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Claro_logo.svg/2048px-Claro_logo.svg.png" 
              alt="Claro"
              className="mx-auto h-20 w-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-500 mt-1 text-sm">Sign in to manage your credentials</p>
          </div>
          
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4.5 w-4.5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus-ring text-sm"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus-ring text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-4.5 w-4.5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="mt-4 text-center text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p className="font-medium text-gray-600 mb-1">Demo Credentials</p>
              <p className="font-mono text-gray-800">user1 / password1</p>
            </div>
          </form>
        </div>

        {/* Security badge below card */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Shield className="h-3.5 w-3.5" />
          <span>Secured with encryption</span>
        </div>
      </div>
    </div>
  );
};
