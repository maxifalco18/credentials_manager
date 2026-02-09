import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { Toast } from './components/Toast';

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [error, setError] = useState<string | null>(null);

  // Effect to sync token with local storage (in case manual modification)
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken !== token) {
        setToken(storedToken);
    }
  }, []);

  const handleLoginSuccess = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setError(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <>
      {token ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <LoginForm onLoginSuccess={handleLoginSuccess} onError={setError} />
      )}
      
      {error && (
        <Toast 
            message={error} 
            type="error" 
            onClose={() => setError(null)} 
        />
      )}
    </>
  );
};

export default App;